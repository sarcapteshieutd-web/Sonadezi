/* Nhận dạng giọng nói đám mây (Google Speech-to-Text) cho họp song ngữ.
   - Phần logic thuần (cặp ngôn ngữ, cắt đoạn, mã hóa PCM, hạn mức) xuất qua module.exports để kiểm thử bằng Node.
   - Phần trình duyệt (thu âm, gọi API) gắn vào window.CloudSTT.
   Các hằng số cắt đoạn đặt ngay dưới đây để chỉnh khi thử thực tế. */
(function () {
  'use strict';

  const SAMPLE_RATE = 16000;
  const SILENCE_MS = 700;   // im lặng bao lâu thì kết thúc một câu
  const PRE_ROLL_MS = 300;  // giữ lại phần đầu câu trước khi vượt ngưỡng
  const TRAIL_MS = 300;     // phần im lặng cuối câu giữ lại (phần còn lại cắt bỏ để đỡ tốn phút)
  const MIN_MS = 400;       // tiếng ngắn hơn mức này bị bỏ
  const MAX_MS = 25000;     // ép cắt khi nói liên tục quá lâu
  const MIN_THRESHOLD = 0.01;
  const NOISE_FACTOR = 3;

  // Mã nhận dạng của Google theo khóa ngôn ngữ trong ứng dụng. Tiếng Trung có thể cần 'cmn-Hans-CN' tùy phiên bản API.
  const CODES = { en: 'en-US', vi: 'vi-VN', zh: 'zh-CN', ja: 'ja-JP', ko: 'ko-KR' };
  const FOREIGN = ['en', 'zh', 'ja', 'ko'];

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
    let noise = 0, inSpeech = false, pre = [], preLen = 0, buf = [], total = 0, speech = 0, silent = 0;

    const reset = () => { inSpeech = false; buf = []; total = 0; speech = 0; silent = 0; pre = []; preLen = 0; };
    function emit(keepLen) {
      const seg = speech >= minN ? concat(buf, total).subarray(0, keepLen) : null;
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
        buf.push(frame); total += frame.length;
        if (isSpeech) { speech += frame.length; silent = 0; } else silent += frame.length;
        if (silent >= silenceN) return emit(total - Math.max(0, silent - trailN));
        if (total >= maxN) return emit(total);
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

  const api = { SAMPLE_RATE, CODES, pairFromLangs, langFromCode, downsampleTo16k, floatToPcm16, pcm16ToBase64, billedSeconds, createSegmenter, quotaDecision };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.CloudSTT = Object.assign(window.CloudSTT || {}, api);
})();
