/* Dịch Thời Gian Thực - Anh / Trung / Việt */
(() => {
  'use strict';

  // ---------- Cấu hình ngôn ngữ ----------
  const LANGS = {
    en: { name: 'Tiếng Anh',        api: 'en',    stt: 'en-US', tts: 'en-US' },
    zh: { name: 'Tiếng Trung (giản thể)', api: 'zh-CN', stt: 'zh-CN', tts: 'zh-CN' },
    vi: { name: 'Tiếng Việt',       api: 'vi',    stt: 'vi-VN', tts: 'vi-VN' }
  };
  const PRESETS = [
    ['en', 'vi'], ['vi', 'en'], ['zh', 'vi'], ['vi', 'zh'], ['en', 'zh'], ['zh', 'en']
  ];
  const DEBOUNCE_MS = 450;
  const SILENCE_MS = 1800; // im lặng bao lâu thì tự kết thúc lượt nói
  const MAX_BYTES = 450; // MyMemory giới hạn ~500 byte/yêu cầu

  const $ = id => document.getElementById(id);
  const el = {
    selSrc: $('selSrc'), selTgt: $('selTgt'), btnSwap: $('btnSwap'), presets: $('presets'),
    src: $('srcText'), out: $('outText'), counter: $('counter'), status: $('status'),
    btnMic: $('btnMic'), icoMic: $('icoMic'), icoStop: $('icoStop'),
    ring1: $('ring1'), ring2: $('ring2'), recBadge: $('recBadge'), micHint: $('micHint'),
    chkAuto: $('chkAuto'), btnClear: $('btnClear'), btnCopy: $('btnCopy'),
    btnSpeakSrc: $('btnSpeakSrc'), btnSpeakTgt: $('btnSpeakTgt'),
    lblSrc: $('lblSrc'), lblTgt: $('lblTgt'), toast: $('toast'),
    hist: $('history'), histWrap: $('histWrap'), btnClearHist: $('btnClearHist'),
    btnInstall: $('btnInstall'), iosHint: $('iosHint'), iosHintClose: $('iosHintClose'),
    btnSettings: $('btnSettings'), sheet: $('sheet'), btnSheetClose: $('btnSheetClose'),
    selEngine: $('selEngine'), inEmail: $('inEmail'), inKey: $('inKey'),
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
    reqId: 0
  };
  if (!LANGS[state.src]) state.src = 'en';
  if (!LANGS[state.tgt] || state.tgt === state.src) state.tgt = state.src === 'vi' ? 'en' : 'vi';

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

  function renderPresets() {
    el.presets.innerHTML = '';
    for (const [s, t] of PRESETS) {
      const b = document.createElement('button');
      const active = s === state.src && t === state.tgt;
      b.className = 'rounded-full px-3 py-1 text-xs font-medium ' +
        (active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300');
      b.textContent = `${short(s)} → ${short(t)}`;
      b.onclick = () => setLangs(s, t, false);
      el.presets.appendChild(b);
    }
  }
  const short = k => ({ en: 'Anh', zh: 'Trung', vi: 'Việt' })[k];

  function syncLangUI() {
    el.selSrc.value = state.src;
    el.selTgt.value = state.tgt;
    el.lblSrc.textContent = LANGS[state.src].name;
    el.lblTgt.textContent = LANGS[state.tgt].name;
    store.set('src', state.src);
    store.set('tgt', state.tgt);
    renderPresets();
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

  function addHistory(item) {
    el.histWrap.classList.remove('hidden');
    const d = document.createElement('div');
    d.className = 'rounded-xl bg-slate-50 p-3 dark:bg-slate-800';
    const a = document.createElement('div');
    a.className = 'text-xs text-slate-500';
    a.textContent = `${short(item.from)}: ${item.src}`;
    const b = document.createElement('div');
    b.className = 'mt-0.5 flex items-start gap-2 font-medium text-blue-700 dark:text-blue-300';
    const t = document.createElement('span');
    t.className = 'flex-1';
    t.textContent = `${short(item.to)}: ${item.out}`;
    const btn = document.createElement('button');
    btn.className = 'shrink-0 rounded-full p-1 text-slate-500';
    btn.setAttribute('aria-label', 'Đọc lại');
    btn.textContent = '🔊';
    btn.onclick = () => speak(item.out, item.to);
    b.append(t, btn);
    d.append(a, b);
    el.hist.appendChild(d);
    el.hist.scrollTop = el.hist.scrollHeight;
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
        body: JSON.stringify({ q: text, source: LANGS[state.src].api.split('-')[0], target: LANGS[state.tgt].api, format: 'text' })
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
      if (speakAfter && el.chkAuto.checked) speak(state.translated, state.tgt);
    } catch (e) {
      if (e.name === 'AbortError') return;
      if (id === state.reqId) el.status.textContent = 'Lỗi: ' + e.message;
    }
  }
  const translateDebounced = debounce(() => translateNow(false), DEBOUNCE_MS);

  function updateCounter() {
    el.counter.textContent = `${el.src.value.length}/5000`;
  }

  // ---------- Đọc văn bản (TTS) ----------
  let voices = [];
  function loadVoices() { voices = window.speechSynthesis ? speechSynthesis.getVoices() : []; }
  if ('speechSynthesis' in window) {
    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
  }

  function speak(text, langKey) {
    if (!('speechSynthesis' in window)) { toast('Thiết bị không hỗ trợ đọc văn bản'); return; }
    if (!text) return;
    speechSynthesis.cancel();
    const lang = LANGS[langKey].tts;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    const prefix = lang.split('-')[0].toLowerCase();
    const v = voices.find(x => x.lang.replace('_', '-').toLowerCase() === lang.toLowerCase()) ||
              voices.find(x => x.lang.toLowerCase().startsWith(prefix));
    if (v) u.voice = v;
    else if (voices.length) toast('Thiết bị chưa có giọng đọc cho ' + LANGS[langKey].name);
    u.rate = 1;
    speechSynthesis.speak(u);
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
    el.btnMic.classList.toggle('bg-blue-600', !on);
    el.btnMic.setAttribute('aria-pressed', String(on));
    el.btnMic.setAttribute('aria-label', on ? 'Dừng nói' : 'Bắt đầu nói');
    el.micHint.textContent = on ? 'Đang nghe… chạm để dừng' : 'Chạm để nói';
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
      const sep = committed && !/[\s]$/.test(committed) && state.src !== 'zh' ? ' ' : '';
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
  };
  el.selTgt.onchange = () => {
    const t = el.selTgt.value;
    setLangs(t === state.src ? state.tgt : state.src, t, false);
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
    el.src.focus();
  };
  el.btnClearHist.onclick = () => { el.hist.innerHTML = ''; el.histWrap.classList.add('hidden'); };
  el.btnCopy.onclick = async () => {
    if (!state.translated) return;
    try { await navigator.clipboard.writeText(state.translated); toast('Đã sao chép'); }
    catch (_) { toast('Không thể sao chép'); }
  };
  el.btnSpeakTgt.onclick = () => speak(state.translated, state.tgt);
  el.btnSpeakSrc.onclick = () => speak(el.src.value.trim(), state.src);
  el.chkAuto.checked = state.auto;
  el.chkAuto.onchange = () => { state.auto = el.chkAuto.checked; store.set('auto', state.auto ? '1' : '0'); };

  window.addEventListener('online', () => translateNow());

  // ---------- Cài đặt ----------
  function syncEngineBoxes() {
    const g = el.selEngine.value === 'google';
    el.boxGG.classList.toggle('hidden', !g);
    el.boxMM.classList.toggle('hidden', g);
  }
  el.btnSettings.onclick = () => {
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

  // ---------- Khởi tạo ----------
  fillSelect(el.selSrc, state.src);
  fillSelect(el.selTgt, state.tgt);
  syncLangUI();
  updateCounter();
  if (!SR) el.micHint.textContent = 'Trình duyệt chưa hỗ trợ nhận diện giọng nói - bạn vẫn có thể gõ văn bản';
})();
