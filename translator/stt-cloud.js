/* Nhận dạng giọng nói đám mây (Google Speech-to-Text) cho họp song ngữ.
   - Phần logic thuần (cặp ngôn ngữ, cắt đoạn, mã hóa PCM, hạn mức) xuất qua module.exports để kiểm thử bằng Node.
   - Phần trình duyệt (thu âm, gọi API) gắn vào window.CloudSTT.
   Các hằng số cắt đoạn đặt ngay dưới đây để chỉnh khi thử thực tế. */
(function () {
  'use strict';

  const SAMPLE_RATE = 16000;
  const SILENCE_MS = 550;   // im lặng bao lâu thì kết thúc một câu (mức "cân bằng")
  const PRE_ROLL_MS = 300;  // giữ lại phần đầu câu trước khi vượt ngưỡng
  const TRAIL_MS = 300;     // phần im lặng cuối câu giữ lại (phần còn lại cắt bỏ để đỡ tốn phút)
  const MIN_MS = 400;       // tiếng ngắn hơn mức này bị bỏ
  const MAX_MS = 12000;     // ép cắt khi nói liên tục quá lâu: đoạn càng dài thì càng phải chờ Google xử lý mới thấy chữ
  const MIN_THRESHOLD = 0.01;
  const NOISE_FACTOR = 3;

  // Mã nhận dạng của Google theo khóa ngôn ngữ trong ứng dụng. Tiếng Trung có thể cần 'cmn-Hans-CN' tùy phiên bản API.
  const CODES = { en: 'en-US', vi: 'vi-VN', zh: 'zh-CN', ja: 'ja-JP', ko: 'ko-KR' };
  const FOREIGN = ['en', 'zh', 'ja', 'ko'];

  // Ba mức tốc độ: ngắt câu sớm cho chữ hiện nhanh hơn nhưng dễ cắt giữa câu; ngắt muộn chính xác hơn nhưng chậm hơn
  const SPEED_PRESETS = {
    fast: { silenceMs: 400, maxMs: 8000 },
    balanced: { silenceMs: SILENCE_MS, maxMs: MAX_MS },
    accurate: { silenceMs: 800, maxMs: 25000 }
  };

  const ms = n => Math.round(n * SAMPLE_RATE / 1000);

  function pairFromLangs(src, tgt) {
    const foreign = src === 'vi' ? tgt : tgt === 'vi' ? src : null;
    if (!foreign || !FOREIGN.includes(foreign)) return null;
    return { foreign, primary: CODES[foreign], alt: CODES.vi };
  }

  function langFromCode(code, pair) {
    const c = String(code || '').toLowerCase();
    if (!c) return null;
    if (c.startsWith('vi')) return 'vi';
    const prefixes = pair.foreign === 'zh' ? ['zh', 'cmn'] : [pair.foreign];
    return prefixes.some(p => c.startsWith(p)) ? pair.foreign : null;
  }

  function downsampleTo16k(input, inRate) {
    if (inRate === SAMPLE_RATE) return input;
    const ratio = inRate / SAMPLE_RATE;
    const out = new Float32Array(Math.floor(input.length / ratio));
    for (let i = 0; i < out.length; i++) {
      const a = Math.floor(i * ratio), b = Math.max(a + 1, Math.floor((i + 1) * ratio));
      let sum = 0;
      for (let j = a; j < b && j < input.length; j++) sum += input[j];
      out[i] = sum / (b - a);
    }
    return out;
  }

  function floatToPcm16(f) {
    const out = new Int16Array(f.length);
    for (let i = 0; i < f.length; i++) {
      const s = Math.max(-1, Math.min(1, f[i]));
      out[i] = Math.round(s < 0 ? s * 32768 : s * 32767);
    }
    return out;
  }

  function pcm16ToBase64(pcm) {
    const bytes = new Uint8Array(pcm.buffer, pcm.byteOffset, pcm.byteLength);
    if (typeof Buffer !== 'undefined') return Buffer.from(bytes).toString('base64');
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }

  // Google làm tròn lên 1 giây mỗi yêu cầu
  const billedSeconds = sampleCount => Math.max(1, Math.ceil(sampleCount / SAMPLE_RATE));

  function concat(frames, length) {
    const out = new Float32Array(length);
    let k = 0;
    for (const f of frames) { out.set(f, k); k += f.length; }
    return out;
  }

  // Cắt đoạn theo năng lượng (RMS) với ngưỡng thích nghi theo mức ồn nền. Khung đầu vào đã ở 16 kHz, độ dài tùy ý.
  function createSegmenter(opts) {
    const o = Object.assign({ silenceMs: SILENCE_MS, preRollMs: PRE_ROLL_MS, trailMs: TRAIL_MS, minMs: MIN_MS, maxMs: MAX_MS }, opts);
    const silenceN = ms(o.silenceMs), preN = ms(o.preRollMs), trailN = ms(o.trailMs), minN = ms(o.minMs), maxN = ms(o.maxMs);
    let noise = 0, inSpeech = false, pre = [], preLen = 0, buf = [], total = 0, speech = 0, silent = 0, rmsList = [];

    const reset = () => { inSpeech = false; buf = []; total = 0; speech = 0; silent = 0; pre = []; preLen = 0; rmsList = []; };
    // Tiếng ồn đều (quạt, điều hòa, máy chiếu) có năng lượng gần như không đổi theo khung, tiếng nói thì lên xuống theo âm tiết
    const isSteady = l => { if (l.length < 20) return false; const a = l.slice().sort((x, y) => x - y), p10 = a[Math.floor(a.length * 0.1)], p90 = a[Math.floor(a.length * 0.9)]; return p10 > 0 && p90 < 2 * p10; };
    function emit(keepLen) {
      const seg = speech >= minN ? concat(buf, total).subarray(0, keepLen) : null;
      if (seg) seg.tailMs = Math.round(silent * 1000 / SAMPLE_RATE); // phần im lặng đã chờ: mốc ngừng nói = lúc cắt đoạn trừ tailMs
      reset();
      return seg ? [seg] : [];
    }

    return {
      push(frame) {
        let sum = 0;
        for (let i = 0; i < frame.length; i++) sum += frame[i] * frame[i];
        const rms = Math.sqrt(sum / (frame.length || 1));
        const isSpeech = rms > Math.max(MIN_THRESHOLD, NOISE_FACTOR * noise);
        if (!inSpeech) {
          if (isSpeech) {
            inSpeech = true; buf = pre.slice(); total = preLen; speech = 0; silent = 0; pre = []; preLen = 0;
          } else {
            noise = noise ? 0.95 * noise + 0.05 * rms : rms;
            pre.push(frame); preLen += frame.length;
            while (preLen - pre[0].length >= preN) preLen -= pre.shift().length;
            return [];
          }
        }
        buf.push(frame); total += frame.length; rmsList.push(rms);
        if (isSpeech) { speech += frame.length; silent = 0; } else silent += frame.length;
        if (silent >= silenceN) return emit(total - Math.max(0, silent - trailN));
        if (total >= maxN) {
          if (isSteady(rmsList)) { // không phải lời nói: học lại mức ồn nền mới, không gửi (không tính phút)
            const m = rmsList.slice().sort((x, y) => x - y)[Math.floor(rmsList.length / 2)];
            reset(); noise = m; return [];
          }
          return emit(total);
        }
        return [];
      },
      flush() { return inSpeech ? emit(total) : []; }
    };
  }

  // Quyết định theo hạn mức (phút/tháng; 0 = không giới hạn). mode: 'fallback' chặn khi vượt, 'continue' vẫn cho dùng
  function quotaDecision({ usedSec, addSec, limitMin, mode }) {
    if (!(limitMin > 0)) return { allow: true, warn: false, over: false };
    const total = usedSec + addSec, cap = limitMin * 60;
    const over = total > cap;
    return { allow: !over || mode === 'continue', warn: !over && total >= cap * 0.8, over };
  }

  // Chạy các công việc bất đồng bộ SONG SONG (không để đoạn sau chờ đoạn trước) nhưng giao kết quả đúng thứ tự gửi.
  // deliver(job, { ok, v } | { ok:false, e }) được gọi lần lượt; lỗi của một việc không chặn các việc sau.
  function createOrderedRunner(run, deliver) {
    let tail = Promise.resolve();
    return job => {
      const p = Promise.resolve().then(() => run(job)).then(v => ({ ok: true, v }), e => ({ ok: false, e }));
      tail = tail.then(() => p).then(r => deliver(job, r)).catch(() => {});
      return tail;
    };
  }

  // ---------- Gọi API Google Speech-to-Text (V1, khóa API) ----------
  const ENDPOINT = 'https://speech.googleapis.com/v1/speech:recognize';
  function sttError(status, message) { const e = new Error(message); e.status = status; return e; }
  function httpError(status) {
    if (status === 403) return sttError(403, 'Khóa API chưa được phép dùng Speech-to-Text (403). Hãy bật Cloud Speech-to-Text trong dự án Google Cloud và cho phép dịch vụ này trong giới hạn của khóa');
    if (status === 400) return sttError(400, 'Yêu cầu nhận dạng không hợp lệ (400). Kiểm tra mã ngôn ngữ và khóa API');
    if (status === 429) return sttError(429, 'Đã vượt hạn mức của Google Speech-to-Text (429)');
    return sttError(status, 'Dịch vụ nhận dạng của Google tạm thời lỗi (' + status + ')');
  }

  // Lỗi mạng và 5xx được thử lại đúng một lần; 4xx không thử lại. Thông điệp lỗi không bao giờ chứa khóa API.
  async function recognize(pcm, opts) {
    const fetchImpl = opts.fetchImpl || (typeof fetch !== 'undefined' ? fetch.bind(globalThis) : null);
    if (!fetchImpl) throw sttError(0, 'Trình duyệt không hỗ trợ gọi dịch vụ nhận dạng');
    const body = JSON.stringify({
      config: { encoding: 'LINEAR16', sampleRateHertz: SAMPLE_RATE, languageCode: opts.primary, alternativeLanguageCodes: [opts.alt], enableAutomaticPunctuation: true },
      audio: { content: pcm16ToBase64(pcm) }
    });
    const url = ENDPOINT + '?key=' + encodeURIComponent(opts.apiKey);
    let res, err;
    for (let attempt = 0; attempt < 2; attempt++) {
      err = null;
      try { res = await fetchImpl(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }); }
      catch (_) { err = sttError(0, 'Mất kết nối tới dịch vụ nhận dạng'); continue; }
      if (res.ok) break;
      err = httpError(res.status);
      if (res.status < 500) throw err;
    }
    if (err) throw err;
    const j = await res.json();
    const results = (j && j.results) || [];
    const parts = results.map(r => (r.alternatives && r.alternatives[0] && r.alternatives[0].transcript) || '').filter(Boolean);
    const glue = /^(ja|zh)/i.test(opts.primary) ? '' : ' ';
    const first = results[0] && results[0].alternatives && results[0].alternatives[0];
    return { text: parts.join(glue).trim(), code: (results[0] && results[0].languageCode) || '', confidence: (first && first.confidence) || 0 };
  }

  // ---------- Thu âm từ micro (chỉ chạy trên trình duyệt) ----------
  const WORKLET_SRC = 'class P extends AudioWorkletProcessor{constructor(){super();this.b=new Float32Array(2048);this.n=0;}' +
    'process(i){const c=i[0]&&i[0][0];if(c){for(let k=0;k<c.length;k++){this.b[this.n++]=c[k];if(this.n===2048){this.port.postMessage(this.b.slice(0));this.n=0;}}}return true;}}' +
    'registerProcessor("stt-capture",P);';

  // Mở micro và gọi onFrame(Float32Array ở tần số gốc, sampleRate) liên tục; trả về { sampleRate, close() }
  async function openCapture(deviceId, onFrame, onDead) {
    const audio = { echoCancellation: true, noiseSuppression: true, autoGainControl: true };
    if (deviceId) audio.deviceId = { exact: deviceId };
    const stream = await navigator.mediaDevices.getUserMedia({ audio });
    const AC = window.AudioContext || window.webkitAudioContext;
    const ctx = new AC();
    if (ctx.state === 'suspended') { try { await ctx.resume(); } catch (_) {} }
    let closing = false, dead = false;
    const die = why => { if (!closing && !dead) { dead = true; if (onDead) onDead(why); } };
    stream.getTracks().forEach(t => t.addEventListener('ended', () => die('ended'))); // rút micro/loa họp
    ctx.onstatechange = () => { // trình duyệt (nhất là iPad) có thể tạm dừng AudioContext khi khóa màn hình hoặc chuyển ứng dụng
      if (closing || ctx.state === 'running') return;
      try { ctx.resume(); } catch (_) {}
      setTimeout(() => { if (!closing && ctx.state !== 'running') die('suspended'); }, 3000);
    };
    const source = ctx.createMediaStreamSource(stream);
    const mute = ctx.createGain(); mute.gain.value = 0; mute.connect(ctx.destination); // giữ đồ thị âm thanh chạy mà không phát ra loa
    let node;
    try {
      const url = URL.createObjectURL(new Blob([WORKLET_SRC], { type: 'application/javascript' }));
      await ctx.audioWorklet.addModule(url); URL.revokeObjectURL(url);
      node = new AudioWorkletNode(ctx, 'stt-capture');
      node.port.onmessage = e => onFrame(e.data, ctx.sampleRate);
    } catch (_) {
      node = ctx.createScriptProcessor(4096, 1, 1);
      node.onaudioprocess = e => onFrame(new Float32Array(e.inputBuffer.getChannelData(0)), ctx.sampleRate);
    }
    source.connect(node); node.connect(mute);
    return {
      sampleRate: ctx.sampleRate,
      close() {
        closing = true;
        try { node.disconnect(); source.disconnect(); mute.disconnect(); } catch (_) {}
        stream.getTracks().forEach(t => t.stop());
        try { ctx.close(); } catch (_) {}
      }
    };
  }

  let cap = null, seg = null, cfg = null, paused = false, gen = 0, segOptsCur = {}; // gen: số thế hệ, để bỏ qua lần start() đã bị stop()/start() khác chen ngang

  const runner = createOrderedRunner(
    job => recognize(job.pcm, { apiKey: job.c.apiKey, primary: job.c.pair.primary, alt: job.c.pair.alt }),
    (job, r) => {
      const c = job.c;
      if (!r.ok) { if (c.onError) c.onError(r.e); return; }
      const lang = langFromCode(r.v.code, c.pair);
      const base = { seconds: job.secs, quota: job.quota, endedAt: job.endedAt };
      // Văn bản rỗng hoặc ngôn ngữ ngoài cặp: vẫn báo số giây (Google vẫn tính tiền) nhưng không có nội dung
      c.onSegment(r.v.text && lang ? { ...base, text: r.v.text, lang, confidence: r.v.confidence } : { ...base, text: '', lang: null, confidence: 0 });
    });

  function handleSegment(samples) {
    const c = cfg, secs = billedSeconds(samples.length);
    // Cổng hạn mức do bên gọi cung cấp: gọi TRƯỚC khi gửi (Google tính tiền theo âm thanh gửi đi); bị chặn thì không gửi
    const quota = c.gate ? c.gate(secs) : null;
    if (quota && !quota.allow) { if (c.onBlocked) c.onBlocked(quota); return; }
    runner({ c, pcm: floatToPcm16(samples), secs, quota, endedAt: Date.now() - (samples.tailMs || 0) });
  }

  // opts: { deviceId?, apiKey, pair: {primary, alt, foreign}, onSegment, onLevel?, onError?, gate?(seconds) -> {allow,...}, onBlocked?, paused? }
  async function start(opts) {
    stop();
    const my = ++gen;
    cfg = opts; paused = !!opts.paused;
    const segOpts = {}; // chỉ truyền các tùy chọn có giá trị để không ghi đè mặc định bằng undefined
    if (opts.silenceMs > 0) segOpts.silenceMs = opts.silenceMs;
    if (opts.maxMs > 0) segOpts.maxMs = opts.maxMs;
    segOptsCur = segOpts; seg = createSegmenter(segOpts);
    const c = await openCapture(opts.deviceId, (f, rate) => {
      if (my !== gen || paused) return;
      const down = downsampleTo16k(f, rate);
      if (opts.onLevel) { let s = 0; for (let i = 0; i < down.length; i++) s += down[i] * down[i]; opts.onLevel(Math.sqrt(s / (down.length || 1))); }
      for (const piece of seg.push(down)) handleSegment(piece);
    }, why => {
      if (my !== gen) return;
      if (opts.onError) opts.onError(sttError(-1, why === 'ended' ? 'Micro đã bị ngắt kết nối' : 'Không thu được âm thanh (trình duyệt đã tạm dừng micro)'));
    });
    if (my !== gen) { c.close(); return; } // đã bị stop() hoặc start() khác thay thế trong lúc chờ quyền micro
    cap = c;
  }
  function pause() { paused = true; if (seg) seg = createSegmenter(segOptsCur); } // bỏ đoạn đang dở để không thu lại tiếng đọc bản dịch
  function resume() { paused = false; }
  function stop() {
    gen++;
    if (seg && cfg) for (const piece of seg.flush()) handleSegment(piece);
    if (cap) { cap.close(); cap = null; }
    seg = null; paused = false;
  }

  async function listDevices() {
    let list = await navigator.mediaDevices.enumerateDevices();
    if (list.some(d => d.kind === 'audioinput' && !d.label)) { // chưa có quyền micro thì nhãn bị ẩn
      try { (await navigator.mediaDevices.getUserMedia({ audio: true })).getTracks().forEach(t => t.stop()); list = await navigator.mediaDevices.enumerateDevices(); } catch (_) {}
    }
    return list.filter(d => d.kind === 'audioinput').map((d, i) => ({ id: d.deviceId, label: d.label || 'Micro ' + (i + 1) }));
  }

  // Thu 5 giây rồi gọi API một lần: dùng để kiểm tra khóa, dịch vụ và chất lượng nhận dạng của từng cặp
  async function probe(opts) {
    const frames = [];
    const c = await openCapture(opts.deviceId, (f, rate) => frames.push(downsampleTo16k(f, rate)));
    await new Promise(r => setTimeout(r, 5000));
    c.close();
    const total = frames.reduce((n, f) => n + f.length, 0);
    const samples = concat(frames, total);
    const r = await recognize(floatToPcm16(samples), { apiKey: opts.apiKey, primary: opts.pair.primary, alt: opts.pair.alt });
    return { text: r.text, lang: langFromCode(r.code, opts.pair), seconds: billedSeconds(samples.length) };
  }

  const api = { SAMPLE_RATE, CODES, SPEED_PRESETS, pairFromLangs, langFromCode, downsampleTo16k, floatToPcm16, pcm16ToBase64, billedSeconds, createSegmenter, createOrderedRunner, quotaDecision, recognize };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.CloudSTT = Object.assign(window.CloudSTT || {}, api, { start, pause, resume, stop, listDevices, probe });
})();
