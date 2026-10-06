/* Dịch Thời Gian Thực - đa ngôn ngữ */
(() => {
  'use strict';

  // ---------- Cấu hình ngôn ngữ ----------
  // sp: false = ngôn ngữ viết liền, không có dấu cách giữa các từ
  const L = (name, short, api, loc, sp = true) => ({ name, short, api, stt: loc, tts: loc, sp });
  const LANGS = {
    en:  L('Tiếng Anh', 'Anh', 'en', 'en-US'),
    vi:  L('Tiếng Việt', 'Việt', 'vi', 'vi-VN'),
    zh:  L('Tiếng Trung (giản thể)', 'Trung', 'zh-CN', 'zh-CN', false),
    zht: L('Tiếng Trung (phồn thể)', 'Trung PT', 'zh-TW', 'zh-TW', false),
    ja:  L('Tiếng Nhật', 'Nhật', 'ja', 'ja-JP', false),
    ko:  L('Tiếng Hàn', 'Hàn', 'ko', 'ko-KR'),
    th:  L('Tiếng Thái', 'Thái', 'th', 'th-TH', false),
    fr:  L('Tiếng Pháp', 'Pháp', 'fr', 'fr-FR'),
    de:  L('Tiếng Đức', 'Đức', 'de', 'de-DE'),
    es:  L('Tiếng Tây Ban Nha', 'Tây Ban Nha', 'es', 'es-ES'),
    pt:  L('Tiếng Bồ Đào Nha', 'Bồ Đào Nha', 'pt', 'pt-BR'),
    it:  L('Tiếng Ý', 'Ý', 'it', 'it-IT'),
    ru:  L('Tiếng Nga', 'Nga', 'ru', 'ru-RU'),
    ar:  L('Tiếng Ả Rập', 'Ả Rập', 'ar', 'ar-SA'),
    hi:  L('Tiếng Hindi', 'Hindi', 'hi', 'hi-IN'),
    id:  L('Tiếng Indonesia', 'Indonesia', 'id', 'id-ID'),
    ms:  L('Tiếng Mã Lai', 'Mã Lai', 'ms', 'ms-MY')
  };
  const DEBOUNCE_MS = 450;
  const SILENCE_MS = 1800; // im lặng bao lâu thì tự kết thúc lượt nói
  const MAX_BYTES = 450; // MyMemory giới hạn ~500 byte/yêu cầu

  const $ = id => document.getElementById(id);
  const el = {
    selSrc: $('selSrc'), selTgt: $('selTgt'), btnSwap: $('btnSwap'),
    src: $('srcText'), out: $('outText'), status: $('status'),
    liveRow: $('liveRow'), liveSrc: $('liveSrc'), emptyHint: $('emptyHint'), btnSend: $('btnSend'),
    btnMic: $('btnMic'), icoMic: $('icoMic'), icoStop: $('icoStop'),
    ring1: $('ring1'), ring2: $('ring2'), recBadge: $('recBadge'), micHint: $('micHint'),
    chkAuto: $('chkAuto'), btnClear: $('btnClear'),
    lblSrc: $('lblSrc'), lblTgt: $('lblTgt'), toast: $('toast'),
    hist: $('history'), histWrap: $('histWrap'), btnClearHist: $('btnClearHist'),
    btnInstall: $('btnInstall'), iosHint: $('iosHint'), iosHintClose: $('iosHintClose'),
    btnExport: $('btnExport'), btnDonate: $('btnDonate'), sheetExport: $('sheetExport'), sheetDonate: $('sheetDonate'),
    expInfo: $('expInfo'), expTxt: $('expTxt'), expCsv: $('expCsv'), expShare: $('expShare'),
    donateBody: $('donateBody'), donateTitle: $('donateTitle'),
    btnSettings: $('btnSettings'), sheet: $('sheet'), btnSheetClose: $('btnSheetClose'),
    selEngine: $('selEngine'), selVoiceLang: $('selVoiceLang'), selVoice: $('selVoice'),
    inRate: $('inRate'), inPitch: $('inPitch'), lblRate: $('lblRate'), lblPitch: $('lblPitch'), btnTest: $('btnTest'), inEmail: $('inEmail'), inKey: $('inKey'),
    boxMM: $('boxMM'), boxGG: $('boxGG'), btnSave: $('btnSave')
  };

  // ---------- Lưu trữ cục bộ ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (_) { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (_) {} }
  };

  const state = {
    src: store.get('src', 'en'),
    tgt: store.get('tgt', 'vi'),
    engine: store.get('engine', 'mymemory'),
    email: store.get('email', ''),
    gkey: store.get('gkey', ''),
    auto: store.get('auto', '1') === '1',
    listening: false,
    translated: '',
    rate: parseFloat(store.get('rate', '0.95')) || 0.95,
    pitch: parseFloat(store.get('pitch', '1')) || 1,
    log: [], // toàn bộ lượt hội thoại, lưu trên thiết bị
    mine: null, // ngôn ngữ của người dùng: lời của bên này hiện bên phải
    reqId: 0
  };
  if (!LANGS[state.src]) state.src = 'en';
  if (!LANGS[state.tgt] || state.tgt === state.src) state.tgt = state.src === 'vi' ? 'en' : 'vi';

  state.mine = state.src;
  try { state.log = JSON.parse(store.get('chat', '[]')).filter(i => LANGS[i.from] && LANGS[i.to]); } catch (_) { state.log = []; }
  const saveLog = () => store.set('chat', JSON.stringify(state.log.slice(-300)));

  // ---------- Tiện ích ----------
  let toastTimer;
  function toast(msg) {
    el.toast.textContent = msg;
    el.toast.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.toast.classList.add('hidden'), 2200);
  }
  const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  const bytes = s => new TextEncoder().encode(s).length;
  function decodeEntities(s) {
    const t = document.createElement('textarea');
    t.innerHTML = s;
    return t.value;
  }

  // ---------- Giao diện ngôn ngữ ----------
  function fillSelect(sel, value) {
    sel.innerHTML = '';
    for (const [k, v] of Object.entries(LANGS)) {
      const o = document.createElement('option');
      o.value = k; o.textContent = v.name;
      sel.appendChild(o);
    }
    sel.value = value;
  }

  const short = k => LANGS[k].short;

  function syncLangUI() {
    el.selSrc.value = state.src;
    el.selTgt.value = state.tgt;
    el.lblSrc.textContent = LANGS[state.src].name;
    el.lblTgt.textContent = LANGS[state.tgt].name;
    store.set('src', state.src);
    store.set('tgt', state.tgt);
  }

  function setLangs(s, t, swapText) {
    const wasListening = state.listening;
    if (wasListening) stopListening();
    archiveTurn();
    state.src = s;
    state.tgt = t;
    syncLangUI();
    updateCounter();
  }

  // ---------- Lịch sử hội thoại ----------
  function archiveTurn() {
    const text = el.src.value.trim();
    if (text && state.translated) {
      addHistory({ src: text, out: state.translated, from: state.src, to: state.tgt });
    }
    el.src.value = '';
    el.out.textContent = '';
    state.translated = '';
    committed = '';
    state.reqId++;
    if (abortCtl) abortCtl.abort();
    el.status.textContent = '';
    updateCounter();
  }

  const svgSpeaker = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg>';
  const svgCopy = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>';

  function scrollChat() { el.histWrap.scrollTop = el.histWrap.scrollHeight; }

  function iconBtn(html, label, fn, cls) {
    const b = document.createElement('button');
    b.className = 'shrink-0 rounded-full p-1.5 ' + cls;
    b.setAttribute('aria-label', label);
    b.innerHTML = html;
    b.onclick = fn;
    return b;
  }

  function addHistory(item, restoring = false) {
    if (!restoring) {
      item.ts = Date.now();
      state.log.push(item);
      saveLog();
    }
    const mine = item.from === state.mine;
    el.emptyHint.classList.add('hidden');
    const row = document.createElement('div');
    row.className = 'flex ' + (mine ? 'justify-end' : 'justify-start');
    const bub = document.createElement('div');
    bub.className = 'max-w-[88%] rounded-2xl px-3.5 py-2.5 shadow-sm ' +
      (mine ? 'rounded-br-md bg-brand-600 text-white' : 'rounded-bl-md border border-slate-200 bg-white text-slate-900');

    const meta = document.createElement('div');
    meta.className = 'mb-0.5 text-[11px] font-medium ' + (mine ? 'text-brand-100' : 'text-slate-500');
    const time = new Date(item.ts).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    meta.textContent = `${LANGS[item.from].name} · ${time}`;

    const orig = document.createElement('div');
    orig.className = 'whitespace-pre-wrap break-words text-[15px] leading-snug';
    orig.textContent = item.src;

    const tr = document.createElement('div');
    tr.className = 'mt-2 border-t pt-2 ' + (mine ? 'border-white/25' : 'border-slate-200');
    const lbl = document.createElement('div');
    lbl.className = 'text-[11px] font-medium ' + (mine ? 'text-brand-100' : 'text-brand-600');
    lbl.textContent = LANGS[item.to].name;
    const out = document.createElement('div');
    out.className = 'whitespace-pre-wrap break-words text-base font-semibold leading-snug';
    out.textContent = item.out;
    const tools = document.createElement('div');
    tools.className = 'mt-1 flex gap-1 ' + (mine ? 'text-brand-100' : 'text-slate-500');
    tools.append(
      iconBtn(svgSpeaker, 'Đọc lại', () => speak(item.out, item.to), mine ? 'hover:bg-white/15' : 'hover:bg-slate-100'),
      iconBtn(svgCopy, 'Sao chép', async () => {
        try { await navigator.clipboard.writeText(item.out); toast('Đã sao chép'); } catch (_) { toast('Không thể sao chép'); }
      }, mine ? 'hover:bg-white/15' : 'hover:bg-slate-100')
    );
    tr.append(lbl, out, tools);
    bub.append(meta, orig, tr);
    row.appendChild(bub);
    el.hist.appendChild(row);
    scrollChat();
  }

  // ---------- Dịch ----------
  const cache = new Map(); // key: engine|src|tgt|text

  function splitChunks(text) {
    const sentences = text.match(/[^.!?。！？\n]+[.!?。！？]*\s*|\n/g) || [text];
    const chunks = [];
    let cur = '';
    const push = () => { if (cur.trim()) chunks.push(cur); cur = ''; };
    for (const s of sentences) {
      if (bytes(s) > MAX_BYTES) {
        push();
        let part = '';
        for (const ch of s) {
          if (bytes(part + ch) > MAX_BYTES) { chunks.push(part); part = ''; }
          part += ch;
        }
        cur = part;
      } else if (bytes(cur + s) > MAX_BYTES) {
        push(); cur = s;
      } else {
        cur += s;
      }
    }
    push();
    return chunks;
  }

  async function translateChunk(text, signal) {
    const key = `${state.engine}|${state.src}|${state.tgt}|${text}`;
    if (cache.has(key)) return cache.get(key);
    let result;
    if (state.engine === 'google' && state.gkey) {
      const url = 'https://translation.googleapis.com/language/translate/v2?key=' + encodeURIComponent(state.gkey);
      const res = await fetch(url, {
        method: 'POST', signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: text, source: LANGS[state.src].api, target: LANGS[state.tgt].api, format: 'text' })
      });
      if (!res.ok) throw new Error('Google API lỗi ' + res.status);
      const j = await res.json();
      result = decodeEntities(j.data.translations[0].translatedText);
    } else {
      const p = new URLSearchParams({ q: text, langpair: `${LANGS[state.src].api}|${LANGS[state.tgt].api}` });
      if (state.email) p.set('de', state.email);
      const res = await fetch('https://api.mymemory.translated.net/get?' + p, { signal });
      if (!res.ok) throw new Error('MyMemory lỗi ' + res.status);
      const j = await res.json();
      if (Number(j.responseStatus) !== 200) throw new Error(j.responseDetails || 'MyMemory lỗi');
      result = decodeEntities(j.responseData.translatedText);
    }
    cache.set(key, result);
    if (cache.size > 300) cache.delete(cache.keys().next().value);
    return result;
  }

  let abortCtl = null;
  async function translateNow(speakAfter = false) {
    const text = el.src.value.trim();
    const id = ++state.reqId;
    if (abortCtl) abortCtl.abort();
    if (!text) {
      state.translated = '';
      el.out.textContent = '';
      el.status.textContent = '';
      return;
    }
    if (!navigator.onLine) { el.status.textContent = 'Không có mạng'; return; }
    abortCtl = new AbortController();
    el.status.textContent = 'Đang dịch…';
    try {
      const parts = await Promise.all(splitChunks(text).map(c => translateChunk(c, abortCtl.signal)));
      if (id !== state.reqId) return; // đã có yêu cầu mới hơn
      state.translated = parts.join('').replace(/\s+\n/g, '\n').trim();
      el.out.textContent = state.translated;
      el.status.textContent = '';
      if (speakAfter) {
        if (el.chkAuto.checked) speak(state.translated, state.tgt);
        archiveTurn(); // đưa lượt này vào khung chat
      }
    } catch (e) {
      if (e.name === 'AbortError') return;
      if (id === state.reqId) el.status.textContent = 'Lỗi: ' + e.message;
    }
  }
  const translateDebounced = debounce(() => translateNow(false), DEBOUNCE_MS);

  // Cập nhật bong bóng "đang nói" ở cuối khung chat và độ cao ô nhập
  function updateCounter() {
    const text = el.src.value.trim();
    el.liveSrc.textContent = text;
    const show = !!text || state.listening;
    el.liveRow.classList.toggle('hidden', !show);
    el.liveRow.classList.toggle('justify-end', state.src === state.mine);
    el.liveRow.classList.toggle('justify-start', state.src !== state.mine);
    if (show) el.emptyHint.classList.add('hidden');
    else if (!el.hist.children.length) el.emptyHint.classList.remove('hidden');
    el.src.style.height = 'auto';
    el.src.style.height = Math.min(el.src.scrollHeight, 112) + 'px';
    scrollChat();
  }

  // ---------- Đọc văn bản (TTS) ----------
  let voices = [];
  function loadVoices() { voices = window.speechSynthesis ? speechSynthesis.getVoices() : []; }
  if ('speechSynthesis' in window) {
    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
  }

  function voicesFor(langKey) {
    const lang = LANGS[langKey].tts.toLowerCase();
    const prefix = lang.split('-')[0];
    const norm = v => v.lang.replace('_', '-').toLowerCase();
    return voices.filter(v => norm(v) === lang).concat(voices.filter(v => norm(v) !== lang && norm(v).startsWith(prefix)));
  }

  function speak(text, langKey) {
    if (!('speechSynthesis' in window)) { toast('Thiết bị không hỗ trợ đọc văn bản'); return; }
    if (!text) return;
    speechSynthesis.cancel();
    const lang = LANGS[langKey].tts;
    const list = voicesFor(langKey);
    const v = list.find(x => x.name === store.get('voice_' + langKey, '')) || list[0];
    if (!v && voices.length) toast('Thiết bị chưa có giọng đọc cho ' + LANGS[langKey].name);
    // Đọc từng câu để có quãng nghỉ tự nhiên, dễ nghe hơn
    const sentences = text.match(/[^.!?。！？\n]+[.!?。！？]*/g) || [text];
    for (const part of sentences) {
      if (!part.trim()) continue;
      const u = new SpeechSynthesisUtterance(part.trim());
      u.lang = lang;
      if (v) u.voice = v;
      u.rate = state.rate;
      u.pitch = state.pitch;
      speechSynthesis.speak(u);
    }
  }

  // iOS/Safari yêu cầu phát âm đầu tiên phải từ thao tác chạm của người dùng
  function unlockTTS() {
    if (!('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    speechSynthesis.speak(u);
  }

  // ---------- Nhận diện giọng nói (STT) ----------
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let rec = null;
  let committed = '';      // văn bản đã chốt trước phiên nhận diện hiện tại
  let wantListening = false;
  let lastNetError = 0;
  let silenceTimer = null;

  function setListeningUI(on) {
    state.listening = on;
    el.icoMic.classList.toggle('hidden', on);
    el.icoStop.classList.toggle('hidden', !on);
    el.ring1.classList.toggle('hidden', !on);
    el.ring2.classList.toggle('hidden', !on);
    el.recBadge.classList.toggle('hidden', !on);
    el.recBadge.classList.toggle('inline-flex', on);
    el.btnMic.classList.toggle('bg-red-600', on);
    el.btnMic.classList.toggle('bg-brand-600', !on);
    el.btnMic.setAttribute('aria-pressed', String(on));
    el.btnMic.setAttribute('aria-label', on ? 'Dừng nói' : 'Bắt đầu nói');
    el.micHint.textContent = on ? 'Đang nghe… chạm để dừng' : 'Chạm để nói';
    updateCounter();
  }

  function startListening() {
    if (!SR) {
      toast('Trình duyệt không hỗ trợ nhận diện giọng nói. Dùng Chrome (Android) hoặc Safari (iOS 14.5+).');
      return;
    }
    unlockTTS();
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    wantListening = true;
    archiveTurn(); // mỗi lần bấm micro là một lượt nói mới
    beginSession();
  }

  function beginSession() {
    rec = new SR();
    rec.lang = LANGS[state.src].stt;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => setListeningUI(true);

    rec.onresult = ev => {
      let text = '';
      for (let i = 0; i < ev.results.length; i++) text += ev.results[i][0].transcript;
      const sep = committed && !/[\s]$/.test(committed) && LANGS[state.src].sp ? ' ' : '';
      el.src.value = (committed + sep + text).trimStart();
      updateCounter();
      translateDebounced(); // dịch ngay trong khi đang nói
      clearTimeout(silenceTimer);
      silenceTimer = setTimeout(stopListening_andTranslate, SILENCE_MS);
    };

    rec.onerror = ev => {
      if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') {
        wantListening = false;
        toast('Chưa được cấp quyền micro. Hãy cho phép micro trong cài đặt trình duyệt.');
      } else if (ev.error === 'network') {
        const now = Date.now();
        if (now - lastNetError < 3000) { wantListening = false; toast('Lỗi mạng khi nhận diện giọng nói'); }
        lastNetError = now;
      } else if (ev.error === 'audio-capture') {
        wantListening = false;
        toast('Không tìm thấy micro');
      }
    };

    rec.onend = () => {
      // Chốt văn bản của phiên vừa kết thúc
      committed = el.src.value.trim();
      if (wantListening) {
        // Chrome tự ngắt sau một khoảng im lặng: khởi động lại để nghe liên tục
        setTimeout(() => { if (wantListening) { try { beginSession(); } catch (_) { finish(); } } }, 250);
      } else {
        finish();
      }
    };

    try { rec.start(); } catch (_) { /* đang chạy */ }
  }

  function finish() {
    clearTimeout(silenceTimer);
    setListeningUI(false);
    translateNow(true); // dịch bản cuối và tự động đọc
  }

  function stopListening() {
    wantListening = false;
    clearTimeout(silenceTimer);
    if (rec) { rec.onend = null; try { rec.stop(); } catch (_) {} }
    setListeningUI(false);
  }

  // ---------- Sự kiện ----------
  el.selSrc.onchange = () => {
    const s = el.selSrc.value;
    setLangs(s, s === state.tgt ? state.src : state.tgt, false);
    state.mine = state.src;
  };
  el.selTgt.onchange = () => {
    const t = el.selTgt.value;
    setLangs(t === state.src ? state.tgt : state.src, t, false);
    state.mine = state.src;
  };
  el.btnSwap.onclick = () => { setLangs(state.tgt, state.src, false); if (SR) startListening(); };

  el.src.addEventListener('input', () => { updateCounter(); translateDebounced(); });

  el.btnMic.onclick = () => (state.listening || wantListening ? stopListening_andTranslate() : startListening());
  function stopListening_andTranslate() {
    wantListening = false;
    clearTimeout(silenceTimer);
    if (rec) { try { rec.stop(); } catch (_) { finish(); } } else finish();
  }

  el.btnClear.onclick = () => {
    if (state.listening) stopListening();
    el.src.value = ''; committed = '';
    updateCounter(); translateNow();
    if (!state.listening) el.src.focus();
  };
  el.btnClearHist.onclick = () => {
    el.hist.innerHTML = '';
    state.log = [];
    saveLog();
    updateCounter();
    el.emptyHint.classList.remove('hidden');
  };
  const sendTyped = () => {
    if (state.listening || !el.src.value.trim()) return;
    translateNow(true);
  };
  el.btnSend.onclick = sendTyped;
  el.src.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendTyped(); }
  });
  el.chkAuto.checked = state.auto;
  el.chkAuto.onchange = () => { state.auto = el.chkAuto.checked; store.set('auto', state.auto ? '1' : '0'); };

  window.addEventListener('online', () => translateNow());

  // ---------- Cài đặt ----------
  function syncEngineBoxes() {
    const g = el.selEngine.value === 'google';
    el.boxGG.classList.toggle('hidden', !g);
    el.boxMM.classList.toggle('hidden', g);
  }
  const TEST_TEXT = { vi: 'Xin chào, rất vui được hỗ trợ quý khách.', en: 'Hello, nice to meet you.', zh: '你好，很高兴认识你。' };
  function fillVoices() {
    const k = el.selVoiceLang.value;
    const list = voicesFor(k);
    el.selVoice.innerHTML = '';
    if (!list.length) {
      const o = document.createElement('option');
      o.textContent = 'Thiết bị chưa có giọng cho ngôn ngữ này';
      el.selVoice.appendChild(o);
      return;
    }
    for (const v of list) {
      const o = document.createElement('option');
      o.value = v.name; o.textContent = `${v.name} (${v.lang})`;
      el.selVoice.appendChild(o);
    }
    el.selVoice.value = store.get('voice_' + k, '') || list[0].name;
  }
  el.selVoiceLang.onchange = fillVoices;
  el.inRate.oninput = () => { el.lblRate.textContent = (+el.inRate.value).toFixed(2) + '×'; };
  el.inPitch.oninput = () => { el.lblPitch.textContent = (+el.inPitch.value).toFixed(2); };
  el.btnTest.onclick = () => {
    const k = el.selVoiceLang.value;
    store.set('voice_' + k, el.selVoice.value);
    state.rate = +el.inRate.value; state.pitch = +el.inPitch.value;
    speak(TEST_TEXT[k] || TEST_TEXT.en, k);
  };
  el.btnSettings.onclick = () => {
    loadVoices();
    el.selVoiceLang.value = state.tgt;
    fillVoices();
    el.inRate.value = state.rate; el.inRate.oninput();
    el.inPitch.value = state.pitch; el.inPitch.oninput();
    el.selEngine.value = state.engine;
    el.inEmail.value = state.email;
    el.inKey.value = state.gkey;
    syncEngineBoxes();
    el.sheet.classList.remove('hidden'); el.sheet.classList.add('flex');
  };
  const closeSheet = () => { el.sheet.classList.add('hidden'); el.sheet.classList.remove('flex'); };
  el.btnSheetClose.onclick = closeSheet;
  el.sheet.onclick = e => { if (e.target === el.sheet) closeSheet(); };
  el.selEngine.onchange = syncEngineBoxes;
  el.btnSave.onclick = () => {
    state.engine = el.selEngine.value;
    state.email = el.inEmail.value.trim();
    state.gkey = el.inKey.value.trim();
    if (state.engine === 'google' && !state.gkey) { toast('Vui lòng nhập API key'); return; }
    store.set('voice_' + el.selVoiceLang.value, el.selVoice.value);
    state.rate = +el.inRate.value; state.pitch = +el.inPitch.value;
    store.set('rate', String(state.rate)); store.set('pitch', String(state.pitch));
    store.set('engine', state.engine); store.set('email', state.email); store.set('gkey', state.gkey);
    cache.clear();
    closeSheet(); toast('Đã lưu cài đặt'); translateNow();
  };

  // ---------- PWA: cài đặt ứng dụng ----------
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    el.btnInstall.classList.remove('hidden');
  });
  el.btnInstall.onclick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    el.btnInstall.classList.add('hidden');
  };
  window.addEventListener('appinstalled', () => el.btnInstall.classList.add('hidden'));

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) ||
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  if (isIOS && !standalone && store.get('iosHintClosed', '0') !== '1') el.iosHint.classList.remove('hidden');
  el.iosHintClose.onclick = () => { el.iosHint.classList.add('hidden'); store.set('iosHintClosed', '1'); };

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('service-worker.js').catch(() => {}));
  }

  // ---------- Lưu đoạn chat ra tệp ----------
  const pad = n => String(n).padStart(2, '0');
  const fmtDate = d => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const fileStamp = () => { const d = new Date(); return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`; };

  function buildTxt() {
    const lines = ['SONADEZI LONG THÀNH - PHIÊN DỊCH TRỰC TUYẾN', 'Xuất lúc: ' + fmtDate(new Date()), '='.repeat(48), ''];
    state.log.forEach((i, n) => {
      lines.push(`#${n + 1} [${fmtDate(new Date(i.ts))}] ${LANGS[i.from].name} → ${LANGS[i.to].name}`);
      lines.push('Gốc : ' + i.src, 'Dịch : ' + i.out, '');
    });
    return lines.join('\r\n');
  }
  function buildCsv() {
    const q = v => '"' + String(v).replace(/"/g, '""') + '"';
    const rows = [['STT', 'Thời gian', 'Ngôn ngữ gốc', 'Văn bản gốc', 'Ngôn ngữ dịch', 'Bản dịch']];
    state.log.forEach((i, n) => rows.push([n + 1, fmtDate(new Date(i.ts)), LANGS[i.from].name, i.src, LANGS[i.to].name, i.out]));
    return '﻿' + rows.map(r => r.map(q).join(',')).join('\r\n'); // BOM để Excel đọc đúng tiếng Việt
  }
  function makeFile(kind) {
    return kind === 'csv'
      ? new File([buildCsv()], `Doan-chat-dich-${fileStamp()}.csv`, { type: 'text/csv;charset=utf-8' })
      : new File(['﻿' + buildTxt()], `Doan-chat-dich-${fileStamp()}.txt`, { type: 'text/plain;charset=utf-8' });
  }
  function download(file) {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url; a.download = file.name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
  function openModal(m) { m.classList.remove('hidden'); m.classList.add('flex'); }
  function closeModal(m) { m.classList.add('hidden'); m.classList.remove('flex'); }
  [el.sheetExport, el.sheetDonate].forEach(m => { m.onclick = e => { if (e.target === m) closeModal(m); }; });
  document.querySelectorAll('[data-close]').forEach(b => { b.onclick = () => closeModal(b.closest('[data-modal]')); });

  el.btnExport.onclick = () => {
    el.expInfo.textContent = state.log.length
      ? `Có ${state.log.length} lượt hội thoại được lưu trên thiết bị này.`
      : 'Chưa có đoạn hội thoại nào để lưu.';
    const none = !state.log.length;
    [el.expTxt, el.expCsv, el.expShare].forEach(b => { b.disabled = none; b.classList.toggle('opacity-50', none); });
    el.expShare.classList.toggle('hidden', !(navigator.canShare && navigator.share));
    openModal(el.sheetExport);
  };
  el.expTxt.onclick = () => { if (state.log.length) { download(makeFile('txt')); toast('Đã lưu tệp .txt'); } };
  el.expCsv.onclick = () => { if (state.log.length) { download(makeFile('csv')); toast('Đã lưu tệp .csv'); } };
  el.expShare.onclick = async () => {
    const f = makeFile('txt');
    try {
      if (navigator.canShare({ files: [f] })) await navigator.share({ files: [f], title: 'Đoạn chat dịch' });
      else await navigator.share({ title: 'Đoạn chat dịch', text: buildTxt() });
    } catch (_) { /* người dùng hủy chia sẻ */ }
  };

  // ---------- Ủng hộ / gói sử dụng ----------
  const CFG = window.APP_CONFIG || {};
  const safeUrl = u => { try { const x = new URL(u); return x.protocol === 'https:' ? x.href : null; } catch (_) { return null; } };
  function node(tag, cls, text) { const n = document.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; return n; }
  function linkBtn(label, url, primary) {
    const a = node('a', 'block rounded-xl py-2.5 text-center font-medium ' +
      (primary ? 'bg-brand-600 text-white' : 'border border-brand-600 text-brand-600'), label);
    a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
    return a;
  }
  function renderDonate() {
    const d = CFG.donate || {};
    const box = el.donateBody;
    box.innerHTML = '';
    el.donateTitle.textContent = d.title || 'Ủng hộ nhà phát hành';
    let has = false;
    if (d.message) box.appendChild(node('p', 'text-sm text-slate-600', d.message));

    const plans = (CFG.plans || []).filter(p => p && p.name);
    if (plans.length) {
      has = true;
      box.appendChild(node('h3', 'mt-4 text-sm font-semibold', 'Gói sử dụng'));
      plans.forEach(p => {
        const c = node('div', 'mt-2 rounded-xl border border-slate-200 p-3');
        c.appendChild(node('div', 'font-semibold text-brand-700', p.name));
        if (p.price) c.appendChild(node('div', 'text-sm font-medium', p.price));
        if (p.description) c.appendChild(node('div', 'text-sm text-slate-500', p.description));
        const u = p.url && safeUrl(p.url);
        if (u) { const b = linkBtn('Chọn gói này', u, true); b.classList.add('mt-2'); c.appendChild(b); }
        box.appendChild(c);
      });
    }
    if (d.qrImage) {
      has = true;
      box.appendChild(node('h3', 'mt-4 text-sm font-semibold', 'Quét mã QR để chuyển khoản'));
      const img = node('img', 'mx-auto mt-2 max-h-64 w-auto rounded-xl border border-slate-200');
      img.src = d.qrImage; img.alt = 'Mã QR ủng hộ';
      box.appendChild(img);
    }
    const b = d.bank || {};
    if (b.accountNumber) {
      has = true;
      const c = node('div', 'mt-3 rounded-xl bg-slate-50 p-3 text-sm');
      [['Ngân hàng', b.bankName], ['Số tài khoản', b.accountNumber], ['Chủ tài khoản', b.accountName], ['Nội dung', b.note]]
        .filter(r => r[1]).forEach(r => { const row = node('div', 'flex justify-between gap-3'); row.append(node('span', 'text-slate-500', r[0]), node('span', 'font-medium text-right', r[1])); c.appendChild(row); });
      const cp = node('button', 'mt-2 w-full rounded-lg border border-brand-600 py-1.5 font-medium text-brand-600', 'Sao chép số tài khoản');
      cp.onclick = async () => { try { await navigator.clipboard.writeText(b.accountNumber); toast('Đã sao chép số tài khoản'); } catch (_) { toast('Không thể sao chép'); } };
      c.appendChild(cp);
      box.appendChild(c);
    }
    (d.links || []).forEach(l => {
      const u = l && l.url && safeUrl(l.url);
      if (u) { has = true; const a = linkBtn(l.label || 'Ủng hộ', u, true); a.classList.add('mt-3'); box.appendChild(a); }
    });
    if (!has) box.appendChild(node('p', 'mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-500', 'Tính năng ủng hộ và gói sử dụng đang được cập nhật. Vui lòng quay lại sau.'));
  }
  el.btnDonate.onclick = () => { renderDonate(); openModal(el.sheetDonate); };

  // ---------- Khởi tạo ----------
  fillSelect(el.selVoiceLang, state.tgt);
  fillSelect(el.selSrc, state.src);
  fillSelect(el.selTgt, state.tgt);
  syncLangUI();
  state.log.forEach(i => addHistory(i, true));
  updateCounter();
  if (!SR) el.micHint.textContent = 'Trình duyệt chưa hỗ trợ nhận diện giọng nói - bạn vẫn có thể gõ văn bản';
})();
