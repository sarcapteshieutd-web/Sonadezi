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
  // Giọng/vùng nói cho nhận diện (đầu vào). Mã vùng do trình duyệt quyết định có hỗ trợ hay không.
  const REGIONS = {
    en: [['en-US', 'Mỹ (US)'], ['en-GB', 'Anh (UK)'], ['en-AU', 'Úc (AU)'], ['en-ZA', 'Nam Phi (ZA)'], ['en-IN', 'Ấn Độ (IN)'], ['en-CA', 'Canada (CA)'], ['en-NZ', 'New Zealand (NZ)'], ['en-IE', 'Ireland (IE)'], ['en-SG', 'Singapore (SG)'], ['en-PH', 'Philippines (PH)'], ['en-NG', 'Nigeria (NG)'], ['en-KE', 'Kenya (KE)']],
    es: [['es-ES', 'Tây Ban Nha (ES)'], ['es-MX', 'Mexico (MX)'], ['es-AR', 'Argentina (AR)'], ['es-CO', 'Colombia (CO)'], ['es-US', 'Mỹ (US)']],
    pt: [['pt-BR', 'Brazil (BR)'], ['pt-PT', 'Bồ Đào Nha (PT)']],
    fr: [['fr-FR', 'Pháp (FR)'], ['fr-CA', 'Canada (CA)'], ['fr-BE', 'Bỉ (BE)'], ['fr-CH', 'Thụy Sĩ (CH)']],
    de: [['de-DE', 'Đức (DE)'], ['de-AT', 'Áo (AT)'], ['de-CH', 'Thụy Sĩ (CH)']],
    ar: [['ar-SA', 'Ả Rập Xê Út (SA)'], ['ar-EG', 'Ai Cập (EG)'], ['ar-AE', 'UAE (AE)'], ['ar-MA', 'Ma-rốc (MA)']]
  };
  const DEBOUNCE_MS = 300;
  const SILENCE_MS = 1200; // im lặng bao lâu thì tự kết thúc lượt nói (trước đây 1800)
  const MAX_BYTES = 450; // MyMemory giới hạn ~500 byte/yêu cầu

  const $ = id => document.getElementById(id);
  const el = {
    selSrc: $('selSrc'), selTgt: $('selTgt'), btnSwap: $('btnSwap'),
    src: $('srcText'), out: $('outText'), status: $('status'),
    liveRow: $('liveRow'), liveSrc: $('liveSrc'), emptyHint: $('emptyHint'), btnSend: $('btnSend'),
    btnMic: $('btnMic'), icoMic: $('icoMic'), icoStop: $('icoStop'),
    ring1: $('ring1'), ring2: $('ring2'), recBadge: $('recBadge'), micHint: $('micHint'),
    chkAuto: $('chkAuto'), btnClear: $('btnClear'),
    selSrcAcc: $('selSrcAcc'), selTgtVoice: $('selTgtVoice'), accRow: $('accRow'), lblSrc: $('lblSrc'), lblTgt: $('lblTgt'), toast: $('toast'),
    hist: $('history'), histWrap: $('histWrap'), btnClearHist: $('btnClearHist'),
    btnInstall: $('btnInstall'), iosHint: $('iosHint'), iosHintClose: $('iosHintClose'),
    btnExport: $('btnExport'), btnDonate: $('btnDonate'), sheetExport: $('sheetExport'), sheetDonate: $('sheetDonate'),
    expInfo: $('expInfo'), expTxt: $('expTxt'), expCsv: $('expCsv'), expShare: $('expShare'),
    donateBody: $('donateBody'), donateTitle: $('donateTitle'),
    btnMeeting: $('btnMeeting'), btnConf: $('btnConf'), btnMeetingStop: $('btnMeetingStop'), meetingBar: $('meetingBar'), meetingTime: $('meetingTime'),
    chkMeetingSpeak: $('chkMeetingSpeak'), chkConf: $('chkConf'), meetingSpeaking: $('meetingSpeaking'),
    chkAutoTurn: $('chkAutoTurn'), meetingLang: $('meetingLang'),
    app: $('app'), btnBig: $('btnBig'), btnBigExit: $('btnBigExit'), btnDual: $('btnDual'), btnFontMinus: $('btnFontMinus'), btnFontPlus: $('btnFontPlus'),
    dualHeadL: $('dualHeadL'), dualHeadR: $('dualHeadR'), liveDual: $('liveDual'),
    ldLLbl: $('ldLLbl'), ldLTxt: $('ldLTxt'), ldLRec: $('ldLRec'), ldRLbl: $('ldRLbl'), ldRTxt: $('ldRTxt'), ldRRec: $('ldRRec'), btnRoom: $('btnRoom'), roomDot: $('roomDot'),
    sheetRoom: $('sheetRoom'), roomBody: $('roomBody'),
    viewerBar: $('viewerBar'), selViewerLang: $('selViewerLang'), viewerStatus: $('viewerStatus'), coBar: $('coBar'), coStatus: $('coStatus'), chkEar: $('chkEar'),
    chkIncr: $('chkIncr'), selCut: $('selCut'), chkLat: $('chkLat'),
    btnSettings: $('btnSettings'), sheet: $('sheet'), btnSheetClose: $('btnSheetClose'),
    selEngine: $('selEngine'), rowEngine: $('rowEngine'), rowFallback: $('rowFallback'), rowGKey: $('rowGKey'), noteGKey: $('noteGKey'), rowTtsKey: $('rowTtsKey'), noteTts: $('noteTts'), selVoiceLang: $('selVoiceLang'), selVoice: $('selVoice'),
    selTtsMode: $('selTtsMode'), rowTtsMode: $('rowTtsMode'), boxDevVoice: $('boxDevVoice'), boxCloudVoice: $('boxCloudVoice'), inTtsKey: $('inTtsKey'), selCloudVoice: $('selCloudVoice'),
    gate: $('gate'), gateFree: $('gateFree'), gateForm: $('gateForm'), gateEmail: $('gateEmail'), gatePass: $('gatePass'), gateErr: $('gateErr'), gateLogin: $('gateLogin'),
    gateToReg: $('gateToReg'), gateForgot: $('gateForgot'), regForm: $('regForm'), regName: $('regName'), regEmail: $('regEmail'), regPass: $('regPass'), regPass2: $('regPass2'),
    regErr: $('regErr'), regSubmit: $('regSubmit'), regToLogin: $('regToLogin'), gateStatus: $('gateStatus'), gsTitle: $('gsTitle'), gsText: $('gsText'), gsPay: $('gsPay'),
    gsRecheck: $('gsRecheck'), gsFree: $('gsFree'), gsLogout: $('gsLogout'), gatePlan: $('gatePlan'),
    acctName: $('acctName'), btnSwitchAcct: $('btnSwitchAcct'), freeNote: $('freeNote'), acctMeta: $('acctMeta'), acctUidRow: $('acctUidRow'), acctUid: $('acctUid'),
    btnCopyUid: $('btnCopyUid'), btnAdmin: $('btnAdmin'), sheetAdmin: $('sheetAdmin'), adminBody: $('adminBody'),
    ttsDayN: $('ttsDayN'), ttsDayC: $('ttsDayC'), ttsMonN: $('ttsMonN'), ttsMonC: $('ttsMonC'), ttsFree: $('ttsFree'), ttsCost: $('ttsCost'), inTtsLimit: $('inTtsLimit'), ttsStatus: $('ttsStatus'), btnTtsReset: $('btnTtsReset'),
    inRate: $('inRate'), inPitch: $('inPitch'), lblRate: $('lblRate'), lblPitch: $('lblPitch'), btnTest: $('btnTest'), inEmail: $('inEmail'), inKey: $('inKey'),
    boxMM: $('boxMM'), boxGG: $('boxGG'), gUsage: $('gUsage'), gUsageBox: $('gUsageBox'), boxGAdmin: $('boxGAdmin'), boxTtsAdmin: $('boxTtsAdmin'), vipUse: $('vipUse'),
    trDayN: $('trDayN'), trDayC: $('trDayC'), trMonN: $('trMonN'), trMonC: $('trMonC'), trLim: $('trLim'), trCost: $('trCost'), inGLimit: $('inGLimit'), chkGFallback: $('chkGFallback'), btnGReset: $('btnGReset'), btnSave: $('btnSave')
  };

  // ---------- Lưu trữ cục bộ ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (_) { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (_) {} }
  };

  // ---------- Tài khoản: Miễn phí / VIP ----------
  // VIP là tài khoản Firebase (email + mật khẩu) do quản trị viên duyệt và cấp hạn dùng. Hồ sơ và hạn dùng nằm trên Firestore;
  // thiết bị chỉ giữ bản nhớ tạm ("acctInfo") để mở nhanh khi chưa có mạng. Khóa Google dùng chung chỉ được Firestore trả cho VIP còn hạn.
  function cachedInfo() { try { return JSON.parse(store.get('acctInfo', 'null')); } catch (_) { return null; } }
  const vipValid = i => !!i && (!!i.admin || (i.status === 'active' && i.expiresAtMs > Date.now()));
  const acct0 = (() => {
    const t = store.get('acct', '');
    if (t === 'free') return { type: 'free', info: cachedInfo() };
    if (t === 'vip') { const i = cachedInfo(); return vipValid(i) ? { type: 'vip', info: i } : { type: 'free', info: i }; }
    return null;
  })();
  const acct0Vip = !!acct0 && acct0.type === 'vip';

  const state = {
    acct: acct0 ? acct0.type : null, // 'free' | 'vip' | null (chưa chọn)
    acctInfo: acct0 ? acct0.info : null, // {uid, email, name, status, expiresAtMs, admin, usage}
    userLimit: { tr: 0, tts: 0 }, // giới hạn ký tự mỗi tháng của tài khoản VIP do quản trị viên đặt (0 = không giới hạn)
    sharedKey: '', // khóa Google dùng chung do quản trị viên cấp (chỉ giữ trong bộ nhớ, không lưu trên thiết bị)
    src: store.get('src', 'en'),
    tgt: store.get('tgt', 'vi'),
    engine: store.get('engine', 'mymemory'),
    email: store.get('email', ''),
    gkey: (acct0Vip && !(acct0.info && acct0.info.admin)) ? '' : store.get('gkey', ''), // chỉ quản trị viên được nhập khóa riêng; VIP dùng khóa dùng chung (nạp sau khi đăng nhập)
    ttsMode: store.get('ttsMode', 'device'), // nguồn giọng đọc: 'device' (miễn phí) hoặc 'cloud' (Google WaveNet)
    ttsKey: (acct0Vip && !(acct0.info && acct0.info.admin)) ? '' : store.get('ttskey', ''),
    ttsLimit: Math.max(0, parseInt(store.get('ttsLimit', '4000000'), 10) || 0), // giới hạn ký tự giọng Google mỗi tháng (0 = không giới hạn)
    gLimit: Math.max(0, parseInt(store.get('gLimitM', '0'), 10) || 0), // giới hạn ký tự Google dịch mỗi tháng của quản trị viên tại máy này (0 = không giới hạn)
    gFallback: store.get('gFallback', '1') === '1', // đạt giới hạn: tự chuyển sang MyMemory
    auto: store.get('auto', '1') === '1',
    listening: false,
    translated: '',
    rate: parseFloat(store.get('rate', '0.95')) || 0.95,
    pitch: parseFloat(store.get('pitch', '1')) || 1,
    log: [], // toàn bộ lượt hội thoại, lưu trên thiết bị
    meeting: false,
    dual: store.get('dual', window.innerWidth >= 1024 ? '1' : '0') === '1',
    uiScale: parseFloat(store.get('uiScale', '1')) || 1,
    incr: store.get('incr', '1') === '1',          // dịch chạy theo khi đang nói (cụm ổn định + phần đuôi)
    cutMs: parseInt(store.get('cutMs', '0'), 10) || 0, // tự chốt câu sau N ms im lặng (0 = tắt)
    showLat: store.get('showLat', '0') === '1',    // hiện độ trễ trên bong bóng
    meetingSpeak: store.get('meetingSpeak', '0') === '1',
    speaking: false,
    autoTurn: store.get('autoTurn', '1') === '1',
    conf: acct0Vip && store.get('conf', '0') === '1', // chế độ hội nghị: nghe bản dịch qua tai nghe/loa, micro luôn mở
    twoMode: false, // chế độ hai máy laptop dùng chung phòng
    mine: null, // ngôn ngữ của người dùng: lời của bên này hiện bên phải
    reqId: 0
  };
  if (!LANGS[state.src]) state.src = 'en';
  if (!LANGS[state.tgt] || state.tgt === state.src) state.tgt = state.src === 'vi' ? 'en' : 'vi';

  state.mine = state.src;
  const isVip = () => state.acct === 'vip';
  const isAdminAcct = () => isVip() && !!(state.acctInfo && state.acctInfo.admin); // chỉ quản trị viên thấy và nhập được khóa API
  // Chỉ tài khoản VIP lưu đoạn chat trên thiết bị; tài khoản Miễn phí chỉ giữ trong phiên đang mở
  function loadLog() {
    try { return JSON.parse(store.get('chat', '[]')).filter(i => LANGS[i.from] && LANGS[i.to]); } catch (_) { return []; }
  }
  if (acct0Vip) state.log = loadLog();
  const saveLog = () => { if (isVip()) store.set('chat', JSON.stringify(state.log.slice(-300))); };

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
    el.meetingLang.textContent = LANGS[state.src].name;
    store.set('src', state.src);
    store.set('tgt', state.tgt);
    syncDual();
    syncAccentUI();
  }

  // Vùng nói của ngôn ngữ nguồn (nhận diện) và giọng đọc của ngôn ngữ đích
  function sttLocale(k) {
    const saved = store.get('stt_' + k, '');
    return (REGIONS[k] || []).some(r => r[0] === saved) ? saved : LANGS[k].stt;
  }
  function syncAccentUI() {
    const regs = REGIONS[state.src] || [];
    const wrapS = el.selSrcAcc.parentElement;
    wrapS.classList.toggle('hidden', regs.length < 2);
    el.selSrcAcc.innerHTML = '';
    for (const [code, name] of regs) {
      const o = document.createElement('option');
      o.value = code; o.textContent = name;
      el.selSrcAcc.appendChild(o);
    }
    if (regs.length) el.selSrcAcc.value = sttLocale(state.src);
    // VIP/quản trị viên chọn được cả giọng Google WaveNet lẫn giọng thiết bị (hai nhóm trong cùng danh sách);
    // tài khoản thường chỉ có giọng thiết bị. Chọn giọng ở đây đổi luôn nguồn giọng đọc, cùng nơi lưu với Cài đặt.
    const dev = 'speechSynthesis' in window ? voicesFor(state.tgt) : [];
    let cloudList = null, pending = false;
    if (isVip() && cloudKey()) {
      cloudList = cloudVoicesCached(state.tgt);
      if (!cloudList && !cloudTried[state.tgt]) { // chưa có danh sách: tải một lần rồi vẽ lại; lỗi thì chỉ còn giọng thiết bị
        cloudTried[state.tgt] = true; pending = true;
        cloudVoices(state.tgt).then(r => { if (r.length) syncAccentUI(); }).catch(() => {});
      }
    }
    const hasCloud = !!(cloudList && cloudList.length);
    const wrapT = el.selTgtVoice.parentElement;
    wrapT.classList.toggle('hidden', pending || !(dev.length || hasCloud));
    el.selTgtVoice.innerHTML = '';
    const grouped = hasCloud && dev.length > 0;
    const parentFor = title => { if (!grouped) return el.selTgtVoice; const g = document.createElement('optgroup'); g.label = title; el.selTgtVoice.appendChild(g); return g; };
    const addOpts = (parent, list, prefix, label) => { for (const v of list) { const o = document.createElement('option'); o.value = prefix + v.name; o.textContent = label(v); parent.appendChild(o); } };
    if (hasCloud) addOpts(parentFor('Giọng Google WaveNet'), cloudList, 'c:', v => `${v.name} (${GENDER_VI[v.gender] || 'không rõ'})`);
    if (dev.length) addOpts(parentFor('Giọng của thiết bị'), dev, 'd:', v => `${v.name} (${v.lang.replace('_', '-')})`);
    const useCloud = hasCloud && cloudOn();
    const vals = [...el.selTgtVoice.options].map(o => o.value);
    const want = (useCloud ? 'c:' + store.get('cvoice_' + state.tgt, '') : 'd:' + store.get('voice_' + state.tgt, ''));
    el.selTgtVoice.value = vals.includes(want) ? want : (vals.find(v => v.startsWith(useCloud ? 'c:' : 'd:')) || vals[0] || '');
    el.accRow.style.display = wrapS.classList.contains('hidden') && wrapT.classList.contains('hidden') ? 'none' : '';
  }

  function setLangs(s, t, swapText) {
    const wasMeeting = state.meeting;
    if (wasMeeting) { resetUtt(); if (rec) { rec.onend = null; try { rec.abort(); } catch (_) {} } }
    else if (state.listening) stopListening();
    archiveTurn();
    state.src = s;
    state.tgt = t;
    syncLangUI();
    updateCounter();
    if (wasMeeting && !state.speaking) beginSession(); // tiếp tục ghi họp với ngôn ngữ mới (khi đang đọc, sẽ nghe lại sau)
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
      roomPublish(item);
    }
    if (state.twoMode) return; // chế độ hai máy: khung chat hiển thị từ phòng chung
    el.emptyHint.classList.add('hidden');
    el.hist.appendChild(renderItem(item));
    scrollChat();
  }

  // ----- Chế độ hai ô trái/phải: mỗi bên đọc bằng ngôn ngữ của mình, các hàng thẳng nhau -----
  function panelLangs() {
    const m = state.mine;
    if (state.src !== m && state.tgt !== m) return [state.src, state.tgt];
    return [m, state.src === m ? state.tgt : state.src];
  }
  function renderDualItem(item) {
    const row = document.createElement('div');
    row.className = 'grid grid-cols-2 gap-3 lg:gap-5';
    const time = new Date(item.ts).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    for (const lang of panelLangs()) {
      const spoken = lang === item.from;
      const text = lang === item.from ? item.src : lang === item.to ? item.out : null;
      const cell = document.createElement('div');
      cell.className = 'rounded-2xl px-3.5 py-2.5 shadow-sm ' + (spoken ? 'border-l-4 border-brand-600 bg-white' : 'bg-brand-50 ring-1 ring-brand-100');
      const meta = document.createElement('div');
      meta.className = 'mb-0.5 text-[0.6875rem] font-medium ' + (spoken ? 'text-brand-700' : 'text-slate-500');
      meta.textContent = (spoken ? '🎤 Nói' : 'Bản dịch') + ' · ' + time + (state.showLat && item.lat != null && !spoken ? ` · ⏱ ${(item.lat / 1000).toFixed(1)} s` : '');
      const t = document.createElement('div');
      t.className = 'whitespace-pre-wrap break-words text-lg font-medium leading-snug text-slate-900';
      t.textContent = text == null ? '—' : text;
      cell.append(meta, t);
      if (text != null) {
        const tools = document.createElement('div');
        tools.className = 'mt-1 flex gap-1 text-slate-500';
        tools.append(
          iconBtn(svgSpeaker, 'Đọc lại', () => speak(text, lang), 'hover:bg-slate-100'),
          iconBtn(svgCopy, 'Sao chép', async () => { try { await navigator.clipboard.writeText(text); toast('Đã sao chép'); } catch (_) { toast('Không thể sao chép'); } }, 'hover:bg-slate-100')
        );
        cell.appendChild(tools);
      }
      row.appendChild(cell);
    }
    return row;
  }
  function renderItem(item) { return state.dual ? renderDualItem(item) : renderBubble(item); }
  function renderAll() {
    el.hist.innerHTML = '';
    state.log.forEach(i => el.hist.appendChild(renderItem(i)));
    if (state.log.length) el.emptyHint.classList.add('hidden');
    scrollChat();
    if (state.twoMode) renderFeed();
  }
  let lastPanels = '';
  function syncDual() {
    document.body.classList.toggle('dual', state.dual);
    const [l, r] = panelLangs();
    el.dualHeadL.textContent = LANGS[l].name;
    el.dualHeadR.textContent = LANGS[r].name;
    el.btnDual.classList.toggle('bg-brand-600', state.dual);
    el.btnDual.classList.toggle('bg-white', !state.dual);
    el.btnDual.classList.toggle('text-white', state.dual);
    el.btnDual.classList.toggle('text-slate-500', !state.dual);
    const key = state.dual + l + r;
    if (key !== lastPanels) { lastPanels = key; renderAll(); }
  }
  // Dòng "đang nói" dạng hai ô
  function liveDualUpdate() {
    if (!state.dual) return;
    const [l, r] = panelLangs();
    const spokenLeft = state.src === l;
    const srcTxt = el.src.value.trim();
    const outTxt = el.out.textContent;
    el.ldLLbl.textContent = LANGS[l].name; el.ldRLbl.textContent = LANGS[r].name;
    el.ldLTxt.textContent = spokenLeft ? srcTxt : outTxt;
    el.ldRTxt.textContent = spokenLeft ? outTxt : srcTxt;
    el.ldLRec.classList.toggle('hidden', !(state.listening && spokenLeft));
    el.ldRRec.classList.toggle('hidden', !(state.listening && !spokenLeft));
    el.ldLRec.classList.toggle('inline-flex', state.listening && spokenLeft);
    el.ldRRec.classList.toggle('inline-flex', state.listening && !spokenLeft);
  }

  function renderBubble(item) {
    const mine = item.from === state.mine;
    el.emptyHint.classList.add('hidden');
    const row = document.createElement('div');
    row.className = 'flex ' + (mine ? 'justify-end' : 'justify-start');
    const bub = document.createElement('div');
    bub.className = 'max-w-[88%] rounded-2xl px-3.5 py-2.5 shadow-sm ' +
      (mine ? 'rounded-br-md bg-brand-600 text-white' : 'rounded-bl-md border border-slate-200 bg-white text-slate-900');

    const meta = document.createElement('div');
    meta.className = 'mb-0.5 text-[0.6875rem] font-medium ' + (mine ? 'text-brand-100' : 'text-slate-500');
    const time = new Date(item.ts).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    meta.textContent = `${LANGS[item.from].name} · ${time}` + (state.showLat && item.lat != null ? ` · ⏱ ${(item.lat / 1000).toFixed(1)} s` : '');

    const orig = document.createElement('div');
    orig.className = 'whitespace-pre-wrap break-words text-[0.9375rem] leading-snug';
    orig.textContent = item.src;

    const tr = document.createElement('div');
    tr.className = 'mt-2 border-t pt-2 ' + (mine ? 'border-white/25' : 'border-slate-200');
    const lbl = document.createElement('div');
    lbl.className = 'text-[0.6875rem] font-medium ' + (mine ? 'text-brand-100' : 'text-brand-600');
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
    return row;
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

  // ----- Bộ đếm ký tự Google Translation (theo ngày và tháng, lưu trên thiết bị này; chỉ mang tính tham khảo) -----
  const todayKey = () => new Date().toLocaleDateString('sv-SE');
  const monthKey = () => 'm' + todayKey().slice(0, 7).replace('-', '');
  const pendingUse = { tr: 0, tts: 0 }; // ký tự đã dùng nhưng chưa báo lên hồ sơ
  const TR_USD_PER_M = 20; // đơn giá tham khảo (USD cho 1 triệu ký tự), cần đối chiếu với Google
  function trUse() {
    let u = null;
    try { u = JSON.parse(store.get('trUsage', 'null')); } catch (_) {}
    if (!u || typeof u !== 'object') u = {};
    const d = todayKey(), m = d.slice(0, 7);
    if (u.d !== d) { u.d = d; u.dn = 0; u.dc = 0; }
    if (u.m !== m) { u.m = m; u.mn = 0; u.mc = 0; u.warned = false; u.over = false; }
    return u;
  }
  const fmtN = n => n.toLocaleString('vi-VN');
  // Số ký tự tài khoản này đã dùng trong tháng, theo hồ sơ trên máy chủ (gộp mọi thiết bị) cộng phần chưa báo
  function userUsed(kind) {
    const u = (((state.acctInfo && state.acctInfo.usage) || {})[monthKey()] || {})[kind] || 0;
    return u + pendingUse[kind];
  }
  function renderGUsage() {
    const admin = isAdminAcct();
    const on = isVip() && state.engine === 'google' && !!state.gkey;
    let txt = '', over = false, pct = 0;
    if (admin) {
      const u = trUse(), lim = state.gLimit;
      pct = lim > 0 ? Math.min(100, Math.round(u.mn * 100 / lim)) : 0;
      over = lim > 0 && (u.mn >= lim || !!u.over);
      if (el.trMonN) {
        el.trDayN.textContent = fmtN(u.dn); el.trDayC.textContent = fmtN(u.dc);
        el.trMonN.textContent = fmtN(u.mn); el.trMonC.textContent = fmtN(u.mc);
        el.trLim.textContent = lim > 0 ? `${fmtN(u.mn)} / ${fmtN(lim)} (${pct}%)` : 'Chưa đặt giới hạn';
        const cost = u.mn * TR_USD_PER_M / 1e6;
        el.trCost.textContent = '≈ ' + cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' USD (chưa trừ ưu đãi miễn phí, nếu có)';
      }
      txt = `Google dịch tháng này: ${fmtN(u.mn)}${lim > 0 ? ' / ' + fmtN(lim) + ' ký tự (' + pct + '%)' : ' ký tự (chưa đặt giới hạn)'}`;
      if (over) txt += state.gFallback ? ' · đã đạt giới hạn, đang dùng MyMemory' : ' · đã đạt giới hạn, tạm dừng dịch';
    } else {
      const L = state.userLimit.tr, used = userUsed('tr');
      pct = L > 0 ? Math.min(100, Math.round(used * 100 / L)) : 0;
      over = L > 0 && used >= L;
      txt = L > 0 ? `Dịch bằng Google tháng này: ${fmtN(used)} / ${fmtN(L)} ký tự (${pct}%)${over ? ' · đã hết giới hạn, đang dùng MyMemory' : ''}` : '';
    }
    for (const node of [el.gUsage, el.gUsageBox]) {
      node.textContent = txt;
      node.classList.toggle('text-red-600', over);
      node.classList.toggle('text-amber-600', !over && pct >= 80);
      node.classList.toggle('text-slate-500', !over && pct < 80);
    }
    el.gUsage.classList.toggle('hidden', !(on && txt));
  }
  // Giới hạn mỗi tháng của tài khoản VIP (quản trị viên không bị giới hạn). Dựa trên số liệu hồ sơ trên máy chủ, nên tính chung mọi thiết bị.
  let userLimitToast = '';
  function userLimitHit(kind, n) {
    if (!isVip() || (state.acctInfo && state.acctInfo.admin)) return 0;
    const lim = state.userLimit[kind];
    if (!(lim > 0)) return 0;
    return userUsed(kind) + n > lim ? lim : 0;
  }
  // true: được gọi Google (đã cộng vào bộ đếm); false: đã đạt giới hạn, dùng MyMemory; ném lỗi nếu không cho chuyển
  function gCharge(text) {
    const ul = userLimitHit('tr', text.length);
    if (ul) {
      limitBlocked = true;
      if (userLimitToast !== todayKey()) { userLimitToast = todayKey(); toast(`Đã hết giới hạn ${fmtN(ul)} ký tự dịch bằng Google trong tháng, đang dùng MyMemory. Liên hệ quản trị viên để tăng giới hạn`); }
      return false;
    }
    const u = trUse();
    const lim = isAdminAcct() ? state.gLimit : 0; // giới hạn tại máy chỉ dành cho quản trị viên; VIP theo mức quản trị viên đặt
    if (lim > 0 && u.mn + text.length > lim) {
      u.over = true; store.set('trUsage', JSON.stringify(u));
      renderGUsage();
      if (state.gFallback) return false;
      throw new Error('Đã đạt giới hạn ký tự Google trong tháng (' + fmtN(lim) + ')');
    }
    u.dn += text.length; u.dc++; u.mn += text.length; u.mc++;
    reportUsage('tr', text.length);
    if (lim > 0 && !u.warned && u.mn >= lim * 0.8) { u.warned = true; toast('Đã dùng 80% giới hạn ký tự Google dịch trong tháng'); }
    store.set('trUsage', JSON.stringify(u));
    renderGUsage();
    return true;
  }

  async function requestTranslate(text, signal, from, to) {
    let result;
    if (isVip() && state.engine === 'google' && state.gkey && gCharge(text)) {
      const url = 'https://translation.googleapis.com/language/translate/v2?key=' + encodeURIComponent(state.gkey);
      const res = await fetch(url, {
        method: 'POST', signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: text, source: LANGS[from].api, target: LANGS[to].api, format: 'text' })
      });
      if (!res.ok) throw new Error('Google API lỗi ' + res.status);
      const j = await res.json();
      result = decodeEntities(j.data.translations[0].translatedText);
    } else {
      const p = new URLSearchParams({ q: text, langpair: `${LANGS[from].api}|${LANGS[to].api}` });
      if (state.email) p.set('de', state.email);
      const res = await fetch('https://api.mymemory.translated.net/get?' + p, { signal });
      if (!res.ok) throw new Error('MyMemory lỗi ' + res.status);
      const j = await res.json();
      if (Number(j.responseStatus) !== 200) throw new Error(j.responseDetails || 'MyMemory lỗi');
      result = decodeEntities(j.responseData.translatedText);
    }
    return result;
  }

  // Bảng thuật ngữ dịch (config.terms): giữ cách dịch nhất quán cho tên dự án và thuật ngữ chuyên ngành
  const TERMS = (window.APP_CONFIG && window.APP_CONFIG.terms) || [];
  function protectTerms(text, from, to) {
    const map = [];
    let out = text;
    const sp = LANGS[from].sp;
    const cand = TERMS.filter(t => t[from] && t[to]).sort((a, b) => b[from].length - a[from].length);
    for (const t of cand) {
      const re = new RegExp((sp ? '(^|[^\\p{L}\\p{N}])' : '()') + escRe(t[from].trim()).replace(/\s+/g, '\\s+') + (sp ? '(?![\\p{L}\\p{N}])' : ''), 'giu');
      out = out.replace(re, (m, pre) => { const tok = 'QXT' + map.length + 'Z'; map.push([tok, t[to]]); return pre + tok; });
    }
    return { text: out, map };
  }
  function restoreTerms(text, map) {
    let out = text;
    for (const [tok, to] of map) {
      const re = new RegExp(tok, 'i');
      if (!re.test(out)) return null; // dịch vụ làm mất ký hiệu: bỏ cách này
      out = out.replace(re, () => to);
    }
    return /QXT\d+Z/i.test(out) ? null : out;
  }

  async function translateChunk(text, signal, from = state.src, to = state.tgt) {
    const key = `${state.engine}|${from}|${to}|${text}`;
    if (cache.has(key)) return cache.get(key);
    let result;
    const prot = protectTerms(text, from, to);
    if (prot.map.length) {
      try {
        const r = await requestTranslate(prot.text, signal, from, to);
        const restored = restoreTerms(r, prot.map);
        if (restored !== null) result = restored;
      } catch (e) { if (e.name === 'AbortError') throw e; }
    }
    if (result === undefined) result = await requestTranslate(text, signal, from, to); // không có thuật ngữ, hoặc cách trên thất bại
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
    el.liveDual.classList.toggle('hidden', !show);
    liveDualUpdate();
    el.liveRow.classList.toggle('justify-end', state.src === state.mine);
    el.liveRow.classList.toggle('justify-start', state.src !== state.mine);
    el.out.parentElement.classList.toggle('hidden', state.meeting && !state.incr);
    if (show) el.emptyHint.classList.add('hidden');
    else if (!el.hist.children.length) el.emptyHint.classList.remove('hidden');
    el.src.style.height = 'auto';
    el.src.style.height = Math.min(el.src.scrollHeight, 112) + 'px';
    scrollChat();
    roomLive();
  }

  // ---------- Đọc văn bản (TTS) ----------
  let voices = [];
  function loadVoices() { voices = window.speechSynthesis ? speechSynthesis.getVoices() : []; }
  if ('speechSynthesis' in window) {
    loadVoices();
    speechSynthesis.onvoiceschanged = () => { loadVoices(); syncAccentUI(); };
  }

  function voicesFor(langKey) {
    const lang = LANGS[langKey].tts.toLowerCase();
    const prefix = lang.split('-')[0];
    const norm = v => v.lang.replace('_', '-').toLowerCase();
    return voices.filter(v => norm(v) === lang).concat(voices.filter(v => norm(v) !== lang && norm(v).startsWith(prefix)));
  }

  let speechBoost = 1; // đọc nhanh hơn khi bản dịch đang dồn lại
  function buildUtterances(text, langKey) {
    const lang = LANGS[langKey].tts;
    const list = voicesFor(langKey);
    const v = list.find(x => x.name === store.get('voice_' + langKey, '')) || list[0];
    if (!v && voices.length) toast('Thiết bị chưa có giọng đọc cho ' + LANGS[langKey].name);
    // Đọc từng câu để có quãng nghỉ tự nhiên, dễ nghe hơn
    const sentences = text.match(/[^.!?。！？\n]+[.!?。！？]*/g) || [text];
    const out = [];
    for (const part of sentences) {
      if (!part.trim()) continue;
      const u = new SpeechSynthesisUtterance(part.trim());
      u.lang = lang;
      if (v) u.voice = v;
      u.rate = Math.min(2, state.rate * speechBoost);
      u.pitch = state.pitch;
      out.push(u);
    }
    return out;
  }

  // ---------- Giọng đọc Google Cloud Text-to-Speech (WaveNet) ----------
  // Chỉ dùng khi người dùng bật trong Cài đặt. Lỗi bất kỳ (mạng, khóa, hạn mức) thì tự quay về giọng thiết bị.
  const TTS_API = 'https://texttospeech.googleapis.com/v1/';
  const CLOUD_LOC = { zh: 'cmn-CN', zht: 'cmn-TW' }; // Google gọi tiếng Quan Thoại là cmn
  const GENDER_VI = { FEMALE: 'nữ', MALE: 'nam' };
  const cloudLoc = k => CLOUD_LOC[k] || LANGS[k].tts;
  const cloudKey = () => state.ttsKey || state.gkey;
  const cloudOn = () => isVip() && state.ttsMode === 'cloud' && !!cloudKey();

  async function ttsFetch(path, opts, key) {
    const res = await fetch(TTS_API + path + (path.includes('?') ? '&' : '?') + 'key=' + encodeURIComponent(key), opts);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((data.error && data.error.message) || ('HTTP ' + res.status));
    return data;
  }

  // Danh sách giọng WaveNet của một ngôn ngữ (miễn phí khi gọi danh sách). Nhớ lại trên thiết bị để không gọi lại.
  const cloudVoiceCache = {};
  async function cloudVoices(langKey, keyOverride) {
    if (cloudVoiceCache[langKey]) return cloudVoiceCache[langKey];
    try { const c = JSON.parse(store.get('cvl_' + langKey, 'null')); if (c && c.length) return (cloudVoiceCache[langKey] = c); } catch (_) {}
    const key = keyOverride || cloudKey();
    if (!key) return [];
    const data = await ttsFetch('voices?languageCode=' + encodeURIComponent(cloudLoc(langKey)), {}, key);
    const list = (data.voices || [])
      .filter(v => /-Wavenet-/i.test(v.name))
      .map(v => ({ name: v.name, gender: v.ssmlGender }))
      .sort((a, b) => a.name.localeCompare(b.name));
    if (list.length) { cloudVoiceCache[langKey] = list; store.set('cvl_' + langKey, JSON.stringify(list)); }
    return list;
  }
  const cloudTried = {}; // ngôn ngữ đã thử tải danh sách giọng trong phiên này
  function cloudVoicesCached(langKey) {
    if (cloudVoiceCache[langKey]) return cloudVoiceCache[langKey];
    try { const c = JSON.parse(store.get('cvl_' + langKey, 'null')); if (c && c.length) return (cloudVoiceCache[langKey] = c); } catch (_) {}
    return null;
  }
  async function cloudVoiceName(langKey) {
    const list = await cloudVoices(langKey);
    if (!list.length) return '';
    const saved = store.get('cvoice_' + langKey, '');
    return (list.find(v => v.name === saved) || list[0]).name;
  }

  // ----- Bảng đo giọng đọc Google (theo ngày và theo tháng, lưu trên thiết bị này; chỉ mang tính tham khảo) -----
  const TTS_FREE_MONTH = 4000000; // hạn mức miễn phí WaveNet mỗi tháng theo bảng giá đã tra cứu, cần đối chiếu lại với Google
  const TTS_USD_PER_M = 4;        // đơn giá WaveNet sau hạn mức miễn phí (USD cho 1 triệu ký tự)
  function ttsUse() {
    let u = null;
    try { u = JSON.parse(store.get('ttsUsage', 'null')); } catch (_) {}
    if (!u || typeof u !== 'object') u = {};
    const d = todayKey(), m = d.slice(0, 7);
    if (u.d !== d) { u.d = d; u.dn = 0; u.dc = 0; }
    if (u.m !== m) { u.m = m; u.mn = 0; u.mc = 0; u.warned = false; }
    return u;
  }
  function renderTtsUsage() {
    if (!el.ttsMonN) return;
    const u = ttsUse(), lim = state.ttsLimit;
    const over = Math.max(0, u.mn - TTS_FREE_MONTH);
    const cost = over * TTS_USD_PER_M / 1e6;
    el.ttsDayN.textContent = fmtN(u.dn); el.ttsDayC.textContent = fmtN(u.dc);
    el.ttsMonN.textContent = fmtN(u.mn); el.ttsMonC.textContent = fmtN(u.mc);
    el.ttsFree.textContent = `${fmtN(Math.min(u.mn, TTS_FREE_MONTH))} / ${fmtN(TTS_FREE_MONTH)} (${Math.round(Math.min(u.mn, TTS_FREE_MONTH) * 100 / TTS_FREE_MONTH)}%)`;
    el.ttsCost.textContent = over > 0 ? `khoảng ${cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD` : '0 USD (còn trong hạn mức miễn phí)';
    const pct = lim > 0 ? Math.round(u.mn * 100 / lim) : 0;
    const full = lim > 0 && u.mn >= lim;
    el.ttsStatus.textContent = lim > 0 ? `Giới hạn tháng: ${fmtN(u.mn)} / ${fmtN(lim)} ký tự (${pct}%)${full ? ' · đã đạt giới hạn, đang dùng giọng thiết bị' : ''}` : 'Không đặt giới hạn tháng';
    el.ttsStatus.classList.toggle('text-red-600', full);
    el.ttsStatus.classList.toggle('text-amber-600', !full && pct >= 80);
    el.ttsStatus.classList.toggle('text-slate-500', !full && pct < 80);
  }

  // Bộ nhớ đệm âm thanh (cùng câu, cùng giọng, cùng tốc độ thì không tính phí lần nữa)
  // Hết giới hạn ký tự trong tháng: mặc định tự chuyển về bản miễn phí (MyMemory / giọng thiết bị). Chỉ quản trị viên được tắt qua dấu tick.
  const fallbackOn = () => !isAdminAcct() || state.gFallback;
  let limitBlocked = false; // đã chạm giới hạn: khi được cấp thêm sẽ báo và dùng lại Google
  function limitError(msg) { const e = new Error(msg); e.limit = true; limitBlocked = true; return e; }
  const audioCache = new Map();
  async function cloudAudioUrl(text, langKey, voice) {
    const rate = Math.min(2, state.rate * speechBoost);
    const pitch = Math.max(-20, Math.min(20, (state.pitch - 1) * 10));
    const ck = [voice, rate.toFixed(2), pitch.toFixed(1), text].join('|');
    if (audioCache.has(ck)) return audioCache.get(ck);
    const ul = userLimitHit('tts', text.length);
    if (ul) throw limitError('Đã hết giới hạn ' + fmtN(ul) + ' ký tự giọng Google của tài khoản trong tháng');
    const lim = isAdminAcct() ? state.ttsLimit : 0; // VIP theo mức quản trị viên đặt
    if (lim > 0 && ttsUse().mn + text.length > lim) { renderTtsUsage(); throw limitError('Đã đạt giới hạn ' + fmtN(lim) + ' ký tự giọng Google trong tháng'); }
    const body = {
      input: { text },
      voice: { languageCode: cloudLoc(langKey), name: voice },
      audioConfig: { audioEncoding: 'MP3', speakingRate: rate, pitch }
    };
    const data = await ttsFetch('text:synthesize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }, cloudKey());
    if (!data.audioContent) throw new Error('Không nhận được âm thanh');
    const u = ttsUse(); // chỉ cộng khi Google trả kết quả thành công
    u.dn += text.length; u.dc++; u.mn += text.length; u.mc++;
    reportUsage('tts', text.length);
    if (state.ttsLimit > 0 && !u.warned && u.mn >= state.ttsLimit * 0.8) { u.warned = true; toast('Đã dùng 80% giới hạn ký tự giọng Google trong tháng'); }
    store.set('ttsUsage', JSON.stringify(u));
    renderTtsUsage();
    const bin = atob(data.audioContent), bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([bytes], { type: 'audio/mpeg' }));
    audioCache.set(ck, url);
    if (audioCache.size > 40) { const old = audioCache.keys().next().value; URL.revokeObjectURL(audioCache.get(old)); audioCache.delete(old); }
    return url;
  }

  // Một thẻ audio dùng chung (iOS chỉ cho phát khi thẻ đã được mở khóa bằng thao tác chạm)
  const audioEl = new Audio();
  let audioDone = null, speechToken = 0, cloudWarnAt = 0;
  function playUrl(url) {
    return new Promise((resolve, reject) => {
      const clear = () => { audioEl.onended = audioEl.onerror = null; audioDone = null; };
      audioDone = () => { clear(); resolve(); };
      audioEl.onended = audioDone;
      audioEl.onerror = () => { clear(); reject(new Error('Không phát được âm thanh')); };
      audioEl.src = url;
      audioEl.play().catch(e => { clear(); reject(e); });
    });
  }
  // Dừng mọi giọng đang đọc (cả giọng thiết bị lẫn Google Cloud)
  function cancelSpeech() {
    speechToken++;
    try { audioEl.pause(); } catch (_) {}
    if (audioDone) audioDone();
    if ('speechSynthesis' in window) speechSynthesis.cancel();
  }

  async function speakCloud(text, langKey) {
    const my = speechToken;
    const voice = await cloudVoiceName(langKey);
    if (!voice) throw new Error('Chưa có giọng WaveNet cho ' + LANGS[langKey].name);
    // Chia theo câu, gom thành đoạn ≤ 600 ký tự; tải song song rồi phát lần lượt
    const sentences = text.match(/[^.!?。！？\n]+[.!?。！？]*/g) || [text];
    const chunks = [];
    let cur = '';
    for (const s of sentences) {
      if (cur && (cur + s).length > 600) { chunks.push(cur); cur = ''; }
      cur += s;
    }
    if (cur.trim()) chunks.push(cur);
    const urls = chunks.map(c => cloudAudioUrl(c.trim(), langKey, voice));
    urls.forEach(p => p.catch(() => {})); // lỗi sẽ được bắt khi await bên dưới
    for (const p of urls) {
      const url = await p;
      if (my !== speechToken) return; // đã bị dừng hoặc thay bằng câu khác
      await playUrl(url);
      if (my !== speechToken) return;
    }
  }
  function cloudFailed(e) {
    const now = Date.now();
    if (now - cloudWarnAt > 30000) {
      cloudWarnAt = now;
      toast(e && e.limit ? e.message + (fallbackOn() ? ', đang đọc bằng giọng của thiết bị (miễn phí)' : ', tạm dừng đọc bằng Google')
        : 'Giọng Google Cloud lỗi (' + (e && e.message ? e.message : 'không rõ') + '), dùng giọng thiết bị');
    }
  }

  function speakDevice(text, langKey) {
    if (!('speechSynthesis' in window)) { toast('Thiết bị không hỗ trợ đọc văn bản'); return; }
    speechSynthesis.cancel();
    buildUtterances(text, langKey).forEach(u => speechSynthesis.speak(u));
  }

  function speak(text, langKey) {
    if (!text) return;
    cancelSpeech();
    if (!cloudOn()) { speakDevice(text, langKey); return; }
    const my = speechToken;
    speakCloud(text, langKey).catch(e => { cloudFailed(e); if (my === speechToken && !(e && e.limit && !fallbackOn())) speakDevice(text, langKey); });
  }

  // Đọc xong mới trả về (không cắt câu đang đọc). Có thời gian chờ tối đa phòng khi trình duyệt không báo kết thúc.
  function speakAndWaitDevice(text, langKey) {
    return new Promise(resolve => {
      if (!('speechSynthesis' in window) || !text) { resolve(); return; }
      const us = buildUtterances(text, langKey);
      if (!us.length) { resolve(); return; }
      const timer = setTimeout(resolve, Math.max(8000, text.length * 150));
      const done = () => { clearTimeout(timer); resolve(); };
      us[us.length - 1].onend = done;
      us[us.length - 1].onerror = done;
      us.forEach(u => speechSynthesis.speak(u));
    });
  }
  async function speakAndWait(text, langKey) {
    if (!text) return;
    if (!cloudOn()) return speakAndWaitDevice(text, langKey);
    const my = speechToken;
    let timer;
    const limit = new Promise(resolve => { timer = setTimeout(resolve, Math.max(20000, text.length * 200)); });
    try {
      await Promise.race([speakCloud(text, langKey), limit]);
    } catch (e) {
      cloudFailed(e);
      if (my === speechToken && !(e && e.limit && !fallbackOn())) await speakAndWaitDevice(text, langKey);
    } finally { clearTimeout(timer); }
  }

  // iOS/Safari yêu cầu phát âm đầu tiên phải từ thao tác chạm của người dùng
  const SILENT_WAV = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=';
  function unlockTTS() {
    if (cloudOn()) {
      try { if (!audioEl.src) { audioEl.src = SILENT_WAV; audioEl.play().catch(() => {}); } } catch (_) {}
    }
    if (!('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    speechSynthesis.speak(u);
  }

  // ---------- Cải thiện nhận diện: từ điển sửa lỗi và lọc độ tin cậy ----------
  const RCFG = (window.APP_CONFIG && window.APP_CONFIG.recognition) || {};
  const MIN_CONF = typeof RCFG.minConfidence === 'number' ? RCFG.minConfidence : 0;
  const escRe = x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const GLOSSARY = (RCFG.glossary || []).flatMap(g =>
    (g.variants || []).filter(Boolean).map(v => ({ re: new RegExp('(^|[^\\p{L}\\p{N}])' + escRe(v.trim()).replace(/\s+/g, '\\s+') + '(?![\\p{L}\\p{N}])', 'giu'), to: g.to, alt: g.en }))
  ).sort((a, b) => b.re.source.length - a.re.source.length);

  // Thay các cách nghe sai bằng từ đúng (theo config.js)
  function applyGlossary(text) {
    let out = text;
    for (const g of GLOSSARY) out = out.replace(g.re, (_, pre) => pre + (state.src === 'en' && g.alt ? g.alt : g.to)); // nói tiếng Anh: dùng tên không dấu
    return out;
  }
  // Bỏ câu đã chốt mà trình duyệt chấm độ tin cậy quá thấp (0 = trình duyệt không báo, giữ lại)
  function heard(result) {
    const alt = result[0];
    if (result.isFinal && MIN_CONF > 0 && alt.confidence > 0 && alt.confidence < MIN_CONF) return '';
    return alt.transcript;
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
    cancelSpeech();
    wantListening = true;
    archiveTurn(); // mỗi lần bấm micro là một lượt nói mới
    beginSession();
  }

  function beginSession() {
    rec = new SR();
    rec.lang = sttLocale(state.src);
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => setListeningUI(true);

    rec.onresult = ev => {
      if (state.meeting) { onMeetingResult(ev); return; }
      let text = '';
      for (let i = 0; i < ev.results.length; i++) text += heard(ev.results[i]);
      text = applyGlossary(text);
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
    if (state.meeting) { stopMeeting(); return; }
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

  // ---------- Chế độ họp: tự nghe liên tục, dịch lên khung chat, không đọc bản dịch ----------
  let meetingStart = 0, meetingTimer = null, wakeLock = null;
  let meetingChain = Promise.resolve(), lastMeetingText = '', lastMeetingAt = 0;

  async function translateText(text, from, to) {
    const parts = await Promise.all(splitChunks(text).map(c => translateChunk(c, undefined, from, to)));
    return parts.join('').replace(/\s+\n/g, '\n').trim();
  }
  function queueMeeting(text, pre) {
    const now = Date.now();
    if (text === lastMeetingText && now - lastMeetingAt < 4000) return; // tránh lặp câu do lỗi của trình duyệt
    lastMeetingText = text; lastMeetingAt = now;
    const from = state.src, to = state.tgt;
    const t0 = (pre && pre.tLast) || now; // mốc ngừng nói để đo độ trễ
    meetingChain = meetingChain.then(async () => {
      let out;
      try {
        const prefixOk = pre && text.startsWith(pre.consumed || '');
        if (pre && prefixOk && (pre.parts.length || pre.tailResult)) {
          // Đã dịch sẵn khi đang nói: dùng lại các cụm đã dịch; phần đuôi dùng lại nếu không đổi, nếu khác chỉ dịch phần đuôi
          const done = await Promise.all(pre.parts);
          const rest = text.slice((pre.consumed || '').length).trim();
          let tail = '';
          if (rest) tail = (pre.tailResult && normText(rest) === normText(pre.tailText)) ? pre.tailResult : await translateText(rest, from, to);
          out = [...done, tail].filter(Boolean).join(LANGS[to].sp ? ' ' : '');
        } else {
          out = await translateText(text, from, to);
        }
      } catch (_) {
        try { out = await translateText(text, from, to); } catch (__) { out = '[Chưa dịch được]'; }
      }
      addHistory({ src: text, out, from, to, meeting: true, lat: Date.now() - t0 });
      if ((state.meetingSpeak || state.conf) && state.meeting && !state.twoMode && !/^\[Chưa dịch được\]$/.test(out)) enqueueSpeech(out, to);
    });
  }

  // ----- Dịch tăng dần và tự chốt câu (giảm độ trễ) -----
  const normText = x => x.toLowerCase().replace(/[\p{P}\p{S}\s]+/gu, '');
  // Nếu raw bắt đầu bằng prefix (bỏ qua dấu câu/khoảng trắng/hoa thường) thì trả phần còn lại, ngược lại trả null
  function stripPrefix(raw, prefix) {
    const target = normText(prefix);
    if (!target) return raw;
    let acc = '';
    for (let i = 0; i < raw.length; i++) {
      acc += normText(raw[i]);
      if (acc === target) return raw.slice(i + 1).trim();
      if (!target.startsWith(acc)) return null;
    }
    return null;
  }
  const newUtt = () => ({ consumed: '', parts: [], results: [], lastText: '', tLast: 0, forced: '', timer: null,
    tail: { text: '', done: '', result: null, seq: 0, at: 0, timer: null } });
  let utt = newUtt();
  function resetUtt() { clearTimeout(utt.timer); clearTimeout(utt.tail.timer); utt = newUtt(); }

  const TWO_CUT_MS = 1500; // thời gian im lặng để chốt câu khi chạy chế độ hai máy mà chưa chọn "Tự chốt câu"
  const MIN_WORDS = 4, TAIL_WORDS = 3, MIN_CJK = 8, TAIL_CJK = 4;
  // Tìm vị trí cắt "ổn định": giữ lại vài từ cuối vì trình duyệt còn có thể sửa
  function stableCut(rest, lang) {
    if (lang.sp) {
      const ends = []; const re = /\S+/g; let m;
      while ((m = re.exec(rest))) ends.push({ end: m.index + m[0].length, w: m[0] });
      const n = ends.length;
      if (n < MIN_WORDS + TAIL_WORDS) return 0;
      const last = n - TAIL_WORDS - 1;
      for (let i = last; i >= MIN_WORDS - 1; i--) if (/[,;:.!?]$/.test(ends[i].w)) return ends[i].end;
      return ends[last].end;
    }
    if (rest.length < MIN_CJK + TAIL_CJK) return 0;
    const limit = rest.length - TAIL_CJK;
    for (let i = limit - 1; i >= MIN_CJK - 1; i--) if (/[，。；、,.;!?！？]/.test(rest[i])) return i + 1;
    return limit;
  }
  const joinOut = (arr) => arr.filter(Boolean).join(LANGS[state.tgt].sp ? ' ' : '');
  function showPartial() {
    if (!state.incr || !state.meeting) return;
    const done = [];
    for (let i = 0; i < utt.results.length; i++) { if (utt.results[i] == null) break; done.push(utt.results[i]); }
    const pending = utt.tail.text && normText(utt.tail.text) !== normText(utt.tail.done);
    el.out.textContent = joinOut([...done, utt.tail.result]) + (pending || done.length < utt.parts.length ? ' …' : '');
    scrollChat();
  }
  // Dịch phần đuôi (các từ cuối còn chưa ổn định) liên tục, tối đa mỗi TAIL_MS một lần
  const TAIL_MS = 400;
  function scheduleTail(tailText) {
    const t = utt.tail;
    t.text = tailText;
    if (!tailText || normText(tailText) === normText(t.done)) { showPartial(); return; }
    if (t.timer) { showPartial(); return; }
    const wait = Math.max(0, TAIL_MS - (Date.now() - t.at));
    t.timer = setTimeout(() => fireTail(utt), wait);
    showPartial();
  }
  function fireTail(u) {
    const t = u.tail;
    t.timer = null;
    const text = t.text.trim();
    if (!text || normText(text) === normText(t.done)) return;
    t.at = Date.now();
    const my = ++t.seq;
    translateText(text, state.src, state.tgt).then(r => {
      if (u !== utt || my !== t.seq) return; // đã có yêu cầu mới hơn hoặc đã sang câu khác
      t.done = text; t.result = r;
      showPartial();
      if (normText(t.text) !== normText(t.done)) scheduleTail(t.text); // chữ đã đổi trong lúc chờ: dịch tiếp
    }).catch(() => {});
  }
  function incrementalStep(T) {
    if (utt.consumed && !T.startsWith(utt.consumed)) { utt.consumed = ''; utt.parts = []; utt.results = []; utt.tail.done = ''; utt.tail.result = null; } // trình duyệt đã sửa phần đầu: bỏ phần đã dịch
    const rest = T.slice(utt.consumed.length);
    const cut = stableCut(rest, LANGS[state.src]);
    if (cut > 0) {
      const chunk = rest.slice(0, cut);
      const idx = utt.parts.length;
      utt.consumed += chunk;
      utt.tail.done = ''; utt.tail.result = null; // phần đuôi cũ đã được gộp vào cụm mới
      const p = translateText(chunk.trim(), state.src, state.tgt);
      p.then(r => { utt.results[idx] = r; showPartial(); }).catch(() => {});
      utt.parts.push(p);
    }
    scheduleTail(T.slice(utt.consumed.length).trim());
  }
  function snapshotUtt() { return { consumed: utt.consumed, parts: utt.parts.slice(), tLast: utt.tLast, tailText: utt.tail.done, tailResult: utt.tail.result }; }
  // Chốt câu sớm khi im lặng đủ lâu, không chờ trình duyệt báo kết thúc
  function forceCommit() {
    const text = utt.lastText.trim();
    if (!text || !state.meeting) return;
    queueMeeting(text, snapshotUtt());
    const keep = text;
    resetUtt(); utt.forced = keep;
    el.src.value = ''; el.out.textContent = ''; updateCounter();
  }
  function commitFinal(f) {
    let text = f;
    if (utt.forced) {
      const rest = stripPrefix(f, utt.forced);
      if (rest === '') { resetUtt(); return false; }          // trùng với câu đã chốt sớm
      if (rest !== null) text = rest;                          // chỉ thêm phần mới
    }
    queueMeeting(text, utt.forced ? undefined : snapshotUtt());
    resetUtt();
    el.out.textContent = '';
    return true;
  }

  // Đọc bản dịch lần lượt; trong lúc đọc tạm dừng nghe để không thu lại tiếng dịch
  const speechQueue = [];
  let draining = false;
  function setSpeakingUI(on) {
    state.speaking = on;
    el.meetingSpeaking.classList.toggle('hidden', !on);
  }
  function enqueueSpeech(text, langKey) {
    speechQueue.push({ text, langKey });
    while (speechQueue.length > (state.conf ? 2 : 3)) speechQueue.shift(); // chỉ giữ vài bản dịch mới nhất, tránh đọc chậm hơn cuộc họp
    drainSpeech();
  }
  async function drainSpeech() {
    if (draining) return;
    draining = true;
    if (state.conf) { // hội nghị: không tắt micro, đọc dồn thì tăng tốc để bắt kịp
      while (speechQueue.length && state.meeting) {
        const item = speechQueue.shift();
        speechBoost = speechQueue.length ? 1.25 : 1;
        await speakAndWait(item.text, item.langKey);
      }
      speechBoost = 1;
      draining = false;
      return;
    }
    setSpeakingUI(true);
    if (rec) { rec.onend = null; try { rec.abort(); } catch (_) {} } // tạm nghỉ micro
    el.src.value = '';
    updateCounter();
    while (speechQueue.length && state.meeting) {
      const item = speechQueue.shift();
      await speakAndWait(item.text, item.langKey);
    }
    draining = false;
    setSpeakingUI(false);
    if (state.meeting) beginSession(); // đọc xong: nghe lại bằng ngôn ngữ hiện tại
  }
  function onMeetingResult(ev) {
    if (state.speaking) return; // đang đọc bản dịch: bỏ qua kết quả lẻ còn sót
    let interim = '';
    let gotFinal = false;
    for (let i = ev.resultIndex; i < ev.results.length; i++) {
      const r = ev.results[i];
      const t = applyGlossary(heard(r).trim());
      if (r.isFinal) { if (t && commitFinal(t)) gotFinal = true; } else interim += t;
    }
    if (utt.forced && interim) { const rest = stripPrefix(interim, utt.forced); if (rest !== null) interim = rest; }
    el.src.value = interim;
    updateCounter();
    if (interim && !gotFinal) {
      if (interim !== utt.lastText) { utt.lastText = interim; utt.tLast = Date.now(); }
      if (state.incr) incrementalStep(interim);
      clearTimeout(utt.timer);
      const cut = state.cutMs || (state.twoMode ? TWO_CUT_MS : 0); // hai máy: luôn tự chốt câu, không phụ thuộc trình duyệt báo kết thúc
      if (cut > 0) utt.timer = setTimeout(forceCommit, cut);
    }
    // Hai bên nói luân phiên: sau mỗi câu chốt, chuyển sang ngôn ngữ còn lại
    if (gotFinal && state.autoTurn) setLangs(state.tgt, state.src, false);
  }
  async function requestWake() {
    try { if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); } catch (_) {}
  }
  document.addEventListener('visibilitychange', () => {
    if (state.meeting && document.visibilityState === 'visible') requestWake();
  });
  function tickMeeting() {
    const s = Math.floor((Date.now() - meetingStart) / 1000);
    el.meetingTime.textContent = `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
  }
  function setMeetingUI(on) {
    el.meetingBar.classList.toggle('hidden', !on);
    el.meetingBar.classList.toggle('flex', on);
    syncConfBtn();
    el.btnMeeting.textContent = on ? 'Dừng họp' : 'Chế độ họp';
    el.btnMeeting.classList.toggle('bg-red-600', on);
    el.btnMeeting.classList.toggle('text-white', on);
    el.btnMeeting.classList.toggle('border-red-600', on);
    el.btnMeeting.classList.toggle('text-brand-600', !on);
    el.btnMeeting.classList.toggle('border-brand-600', !on);
  }
  function startMeeting() {
    if (!SR) { toast('Trình duyệt không hỗ trợ nhận diện giọng nói. Dùng Chrome (Android) hoặc Safari (iOS 14.5+).'); return; }
    if (state.listening || wantListening) stopListening();
    archiveTurn();
    unlockTTS();
    state.meeting = true;
    state.mine = state.src; // bên đầu tiên nói nằm bên phải khung chat
    syncDual();
    wantListening = true;
    committed = '';
    meetingStart = Date.now();
    clearInterval(meetingTimer);
    meetingTimer = setInterval(tickMeeting, 1000);
    tickMeeting();
    setMeetingUI(true);
    requestWake();
    beginSession();
  }
  function stopMeeting() {
    if (!state.meeting) return;
    const rest = el.src.value.trim();
    state.meeting = false;
    wantListening = false;
    resetUtt();
    speechQueue.length = 0;
    cancelSpeech();
    setSpeakingUI(false);
    clearInterval(meetingTimer);
    if (rec) { rec.onend = null; try { rec.stop(); } catch (_) {} }
    if (rest) queueMeeting(rest);
    el.src.value = '';
    setListeningUI(false);
    setMeetingUI(false);
    if (wakeLock) { try { wakeLock.release(); } catch (_) {} wakeLock = null; }
    toast('Đã dừng chế độ họp');
  }
  document.addEventListener('keydown', e => {
    if (e.code !== 'Space' || !state.meeting || e.repeat) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    e.preventDefault();
    setLangs(state.tgt, state.src, false); // Space: đổi người nói
  });
  // Tránh Space kích hoạt nút đang được chọn (ví dụ Dừng họp)
  document.addEventListener('keyup', e => {
    if (e.code === 'Space' && state.meeting && !/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) e.preventDefault();
  });
  el.chkMeetingSpeak.checked = state.meetingSpeak;
  el.chkMeetingSpeak.onchange = () => {
    state.meetingSpeak = el.chkMeetingSpeak.checked;
    store.set('meetingSpeak', state.meetingSpeak ? '1' : '0');
    if (!state.meetingSpeak) { speechQueue.length = 0; cancelSpeech(); }
  };
  function syncConfBtn() {
    const on = state.meeting && state.conf;
    el.btnConf.textContent = on ? '⏹ Dừng hội nghị' : '🎧 Hội nghị';
    el.btnConf.classList.toggle('bg-red-600', on);
    el.btnConf.classList.toggle('bg-brand-600', !on);
  }
  function syncConf() {
    if (state.conf) { state.autoTurn = false; el.chkAutoTurn.checked = false; }
    el.chkAutoTurn.disabled = state.conf; // hội nghị: ngôn ngữ cố định, không đảo lượt
    el.chkConf.checked = state.conf;
    syncConfBtn();
  }
  el.chkConf.onchange = () => { if (!isVip()) { el.chkConf.checked = false; vipOnly(); return; } state.conf = el.chkConf.checked; store.set('conf', state.conf ? '1' : '0'); syncConf(); };
  el.chkAutoTurn.checked = state.autoTurn;
  syncConf();
  el.chkAutoTurn.onchange = () => { state.autoTurn = el.chkAutoTurn.checked; store.set('autoTurn', state.autoTurn ? '1' : '0'); };
  // Nút ngoài: bật nhanh chế độ hội nghị (ngôn ngữ cố định, nghe bằng tai nghe, micro không tắt)
  el.btnConf.onclick = () => {
    if (!isVip()) { vipOnly(); return; }
    if (state.meeting && state.conf) { stopMeeting(); return; }
    state.conf = true; store.set('conf', '1'); syncConf();
    if (!state.meeting) startMeeting();
    toast('Chế độ hội nghị: hãy cắm tai nghe và chọn làm thiết bị phát của máy');
  };
  el.btnMeeting.onclick = () => (state.meeting ? stopMeeting() : startMeeting());
  el.btnMeetingStop.onclick = stopMeeting;

  new MutationObserver(() => { liveDualUpdate(); roomLive(); }).observe(el.out, { childList: true, characterData: true, subtree: true });

  // ---------- Cỡ chữ và bố cục theo màn hình (laptop) ----------
  function applyScale() {
    const w = window.innerWidth;
    const hgt = window.innerHeight;
    const auto = w >= 1024 ? Math.min(1.4, Math.max(1, Math.min(w / 1100, hgt / 720))) : 1; // laptop: phóng to theo cả chiều rộng và chiều cao
    document.documentElement.style.fontSize = (16 * auto * state.uiScale).toFixed(2) + 'px';
  }
  function setScale(v) {
    state.uiScale = Math.min(1.8, Math.max(0.8, Math.round(v * 20) / 20));
    store.set('uiScale', String(state.uiScale));
    applyScale();
  }
  el.btnFontMinus.onclick = () => setScale(state.uiScale - 0.1);
  el.btnFontPlus.onclick = () => setScale(state.uiScale + 0.1);
  window.addEventListener('resize', applyScale);
  el.btnDual.onclick = () => { state.dual = !state.dual; store.set('dual', state.dual ? '1' : '0'); syncDual(); updateCounter(); };

  // ---------- Chế độ màn hình lớn (chiếu lên TV / máy chiếu) ----------
  function setBig(on) {
    el.app.classList.toggle('big', on);
    el.btnBig.setAttribute('aria-pressed', String(on));
    el.btnBig.title = on ? 'Thoát màn hình lớn' : 'Màn hình lớn';
    updateCounter();
  }
  el.btnBigExit.onclick = () => el.btnBig.onclick();
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && el.app.classList.contains('big')) el.btnBig.onclick(); }); // máy không có chế độ toàn màn hình thật
  el.btnBig.onclick = () => {
    const on = !el.app.classList.contains('big');
    setBig(on);
    try {
      if (on && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
      else if (!on && document.fullscreenElement) document.exitFullscreen();
    } catch (_) {}
  };
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && el.app.classList.contains('big')) setBig(false);
  });

  // ---------- Sự kiện ----------
  el.selSrc.onchange = () => {
    const s = el.selSrc.value;
    setLangs(s, s === state.tgt ? state.src : state.tgt, false);
    state.mine = state.src; syncDual();
  };
  el.selTgt.onchange = () => {
    const t = el.selTgt.value;
    setLangs(t === state.src ? state.tgt : state.src, t, false);
    state.mine = state.src; syncDual();
  };
  el.btnSwap.onclick = () => { setLangs(state.tgt, state.src, false); if (SR && !state.meeting) startListening(); };

  el.src.addEventListener('input', () => { updateCounter(); translateDebounced(); });

  el.btnMic.onclick = () => (state.meeting ? stopMeeting() : state.listening || wantListening ? stopListening_andTranslate() : startListening());
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
  // Giọng Google Cloud: lấy danh sách theo khóa đang nhập (chưa cần lưu)
  async function fillCloudVoices() {
    const k = el.selVoiceLang.value;
    const key = el.inTtsKey.value.trim() || el.inKey.value.trim() || state.ttsKey || state.gkey;
    const keep = /-Wavenet-/i.test(el.selCloudVoice.value) ? el.selCloudVoice.value : ''; // giữ lựa chọn người dùng vừa chọn
    el.selCloudVoice.innerHTML = '';
    const msg = t => { const o = document.createElement('option'); o.textContent = t; el.selCloudVoice.appendChild(o); };
    if (!key) { msg(isAdminAcct() ? 'Nhập API key để tải danh sách giọng' : 'Chưa nhận được khóa Google dùng chung'); return; }
    msg('Đang tải danh sách giọng…');
    try {
      const list = await cloudVoices(k, key);
      if (el.selVoiceLang.value !== k) return; // người dùng đã đổi ngôn ngữ
      el.selCloudVoice.innerHTML = '';
      if (!list.length) { msg('Google chưa có giọng WaveNet cho ngôn ngữ này'); return; }
      for (const v of list) {
        const o = document.createElement('option');
        o.value = v.name; o.textContent = `${v.name} (${GENDER_VI[v.gender] || 'không rõ'})`;
        el.selCloudVoice.appendChild(o);
      }
      const want = keep || store.get('cvoice_' + k, '');
      el.selCloudVoice.value = list.some(v => v.name === want) ? want : list[0].name;
    } catch (e) {
      el.selCloudVoice.innerHTML = '';
      msg('Không tải được: ' + (e && e.message ? e.message : 'lỗi không rõ'));
    }
  }
  function syncTtsBoxes() {
    const vip = isVip();
    el.boxDevVoice.classList.remove('hidden'); // giọng của thiết bị luôn có (tài khoản thường chỉ có giọng này)
    el.boxCloudVoice.classList.toggle('hidden', !vip); // VIP/quản trị viên có thêm giọng Google WaveNet
    if (vip) fillCloudVoices();
  }
  el.selVoice.onchange = () => { if (isVip()) el.selTtsMode.value = 'device'; };
  el.selCloudVoice.onchange = () => { el.selTtsMode.value = 'cloud'; };
  el.selTtsMode.onchange = syncTtsBoxes;
  let lastTtsKey = null; // chỉ tải lại danh sách giọng khi khóa thực sự đổi
  el.inTtsKey.onchange = () => {
    const v = el.inTtsKey.value.trim();
    if (lastTtsKey !== null && v !== lastTtsKey) Object.keys(cloudVoiceCache).forEach(k => { delete cloudVoiceCache[k]; store.set('cvl_' + k, 'null'); });
    lastTtsKey = v;
    fillCloudVoices();
  };
  el.selVoiceLang.onchange = () => { fillVoices(); if (isVip()) fillCloudVoices(); };
  el.selSrcAcc.onchange = () => {
    store.set('stt_' + state.src, el.selSrcAcc.value);
    if (wantListening && rec) { try { rec.abort(); } catch (_) {} } // tự nghe lại với vùng nói mới
  };
  el.selTgtVoice.onchange = () => {
    const v = el.selTgtVoice.value, name = v.slice(2);
    if (v.startsWith('c:') && isVip()) { state.ttsMode = 'cloud'; store.set('cvoice_' + state.tgt, name); } // chọn giọng WaveNet: chuyển sang nguồn Google
    else { state.ttsMode = 'device'; store.set('voice_' + state.tgt, name); }                                // chọn giọng thiết bị: chuyển sang nguồn thiết bị
    store.set('ttsMode', state.ttsMode);
    speak(TEST_TEXT[state.tgt] || TEST_TEXT.en, state.tgt);
  };
  el.inRate.oninput = () => { el.lblRate.textContent = (+el.inRate.value).toFixed(2) + '×'; };
  el.inPitch.oninput = () => { el.lblPitch.textContent = (+el.inPitch.value).toFixed(2); };
  el.btnTest.onclick = () => {
    const k = el.selVoiceLang.value;
    store.set('voice_' + k, el.selVoice.value);
    state.rate = +el.inRate.value; state.pitch = +el.inPitch.value;
    state.ttsMode = el.selTtsMode.value; state.ttsKey = el.inTtsKey.value.trim(); // thử ngay, chưa cần bấm Lưu
    if (state.ttsMode === 'cloud') {
      if (!cloudKey() && !(isAdminAcct() && el.inKey.value.trim())) { toast(isAdminAcct() ? 'Vui lòng nhập API key' : 'Chưa nhận được khóa Google dùng chung. Vui lòng liên hệ quản trị viên'); return; }
      if (isAdminAcct() && !state.ttsKey && !state.gkey) state.gkey = el.inKey.value.trim();
      if (/-Wavenet-/i.test(el.selCloudVoice.value)) store.set('cvoice_' + k, el.selCloudVoice.value);
      unlockTTS();
    }
    speak(TEST_TEXT[k] || TEST_TEXT.en, k);
  };
  el.btnSettings.onclick = () => {
    loadVoices();
    el.chkIncr.checked = state.incr; el.selCut.value = String(state.cutMs); el.chkLat.checked = state.showLat;
    el.selVoiceLang.value = state.tgt;
    fillVoices();
    el.selTtsMode.value = state.ttsMode;
    el.selCloudVoice.innerHTML = '';
    el.inTtsKey.value = isAdminAcct() ? state.ttsKey : ''; lastTtsKey = el.inTtsKey.value;
    el.inTtsLimit.value = String(state.ttsLimit); renderTtsUsage();
    el.inRate.value = state.rate; el.inRate.oninput();
    el.inPitch.value = state.pitch; el.inPitch.oninput();
    el.selEngine.value = state.engine;
    el.inEmail.value = state.email;
    el.inKey.value = isAdminAcct() ? store.get('gkey', '') : ''; // chỉ quản trị viên thấy khóa tự nhập; không bao giờ hiện khóa dùng chung
    el.inGLimit.value = String(state.gLimit); el.chkGFallback.checked = state.gFallback; renderGUsage();
    syncEngineBoxes();
    syncTtsBoxes();
    el.sheet.classList.remove('hidden'); el.sheet.classList.add('flex');
  };
  const closeSheet = () => { el.sheet.classList.add('hidden'); el.sheet.classList.remove('flex'); };
  el.btnSheetClose.onclick = closeSheet;
  el.sheet.onclick = e => { if (e.target === el.sheet) closeSheet(); };
  el.selEngine.onchange = syncEngineBoxes;
  el.btnTtsReset.onclick = () => { store.set('ttsUsage', 'null'); renderTtsUsage(); };
  el.btnGReset.onclick = () => { store.set('trUsage', 'null'); renderGUsage(); };
  el.btnSave.onclick = () => {
    state.engine = el.selEngine.value;
    state.email = el.inEmail.value.trim();
    const typedKey = isAdminAcct() ? el.inKey.value.trim() : '';
    state.gkey = typedKey || (isVip() ? state.sharedKey : '');
    if (!isVip()) state.engine = 'mymemory'; // Miễn phí: chỉ MyMemory
    if (state.engine === 'google' && !state.gkey) { toast(isAdminAcct() ? 'Vui lòng nhập API key' : 'Chưa nhận được khóa Google dùng chung. Vui lòng liên hệ quản trị viên'); return; }
    state.ttsMode = isVip() ? el.selTtsMode.value : 'device'; state.ttsKey = isAdminAcct() ? el.inTtsKey.value.trim() : '';
    if (state.ttsMode === 'cloud' && !state.ttsKey && !state.gkey) { toast(isAdminAcct() ? 'Vui lòng nhập API key Text-to-Speech (hoặc khóa Translation)' : 'Chưa nhận được khóa Google dùng chung. Vui lòng liên hệ quản trị viên'); return; }
    store.set('ttsMode', state.ttsMode); store.set('ttskey', isAdminAcct() ? state.ttsKey : '');
    state.ttsLimit = Math.max(0, parseInt(el.inTtsLimit.value, 10) || 0); store.set('ttsLimit', String(state.ttsLimit));
    if (state.ttsMode === 'cloud' && /-Wavenet-/i.test(el.selCloudVoice.value)) store.set('cvoice_' + el.selVoiceLang.value, el.selCloudVoice.value);
    if (isAdminAcct()) { state.gLimit = Math.max(0, parseInt(el.inGLimit.value, 10) || 0); state.gFallback = el.chkGFallback.checked; }
    store.set('gLimitM', String(state.gLimit)); store.set('gFallback', state.gFallback ? '1' : '0');
    store.set('voice_' + el.selVoiceLang.value, el.selVoice.value);
    state.rate = +el.inRate.value; state.pitch = +el.inPitch.value;
    store.set('rate', String(state.rate)); store.set('pitch', String(state.pitch));
    state.incr = el.chkIncr.checked; state.cutMs = parseInt(el.selCut.value, 10) || 0; state.showLat = el.chkLat.checked;
    store.set('incr', state.incr ? '1' : '0'); store.set('cutMs', String(state.cutMs)); store.set('showLat', state.showLat ? '1' : '0');
    store.set('engine', state.engine); store.set('email', state.email); store.set('gkey', typedKey);
    cache.clear(); renderGUsage();
    Object.keys(cloudTried).forEach(k => delete cloudTried[k]); syncAccentUI(); // giọng đọc ngoài màn hình khớp với Cài đặt
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
  [el.sheetExport, el.sheetDonate, el.sheetRoom].forEach(m => { m.onclick = e => { if (e.target === m) closeModal(m); }; });
  document.querySelectorAll('[data-close]').forEach(b => { b.onclick = () => closeModal(b.closest('[data-modal]')); });

  el.btnExport.onclick = () => {
    if (!isVip()) { vipOnly(); return; }
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
    if (b.accountNumber || b.accountName || b.bankName) {
      has = true;
      const c = node('div', 'mt-3 rounded-xl bg-slate-50 p-3 text-sm');
      [['Ngân hàng', b.bankName], ['Số tài khoản', b.accountNumber], ['Chủ tài khoản', b.accountName], ['Nội dung', b.note]]
        .filter(r => r[1]).forEach(r => { const row = node('div', 'flex justify-between gap-3'); row.append(node('span', 'text-slate-500', r[0]), node('span', 'font-medium text-right', r[1])); c.appendChild(row); });
      if (b.accountNumber) {
      const cp = node('button', 'mt-2 w-full rounded-lg border border-brand-600 py-1.5 font-medium text-brand-600', 'Sao chép số tài khoản');
      cp.onclick = async () => { try { await navigator.clipboard.writeText(b.accountNumber); toast('Đã sao chép số tài khoản'); } catch (_) { toast('Không thể sao chép'); } };
      c.appendChild(cp);
      }
      box.appendChild(c);
    }
    (d.links || []).forEach(l => {
      const u = l && l.url && safeUrl(l.url);
      if (u) { has = true; const a = linkBtn(l.label || 'Ủng hộ', u, true); a.classList.add('mt-3'); box.appendChild(a); }
    });
    if (!has) box.appendChild(node('p', 'mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-500', 'Tính năng ủng hộ và gói sử dụng đang được cập nhật. Vui lòng quay lại sau.'));
  }
  el.btnDonate.onclick = () => { renderDonate(); openModal(el.sheetDonate); };

  // ---------- Phòng họp xem chung (Firebase) + mã QR ----------
  const FB = (window.APP_CONFIG && window.APP_CONFIG.firebase) || {};
  const ROOMCFG = (window.APP_CONFIG && window.APP_CONFIG.room) || {};
  const roomEnabled = !!(FB.apiKey && FB.projectId);
  const MAX_EXTRA = typeof ROOMCFG.maxExtraLanguages === 'number' ? ROOMCFG.maxExtraLanguages : 3;
  const BACKLOG = 15; // số tin gần nhất được dịch bù khi có ngôn ngữ mới tham gia
  const LIVE_MS = typeof ROOMCFG.liveIntervalMs === 'number' ? ROOMCFG.liveIntervalMs : 800;
  const newUttId = () => Math.random().toString(36).slice(2, 10);
  const room = { kit: null, id: null, expiresAtMs: 0, active: false, unsubViewers: null, viewers: [], allowed: [], recent: [], chain: Promise.resolve(),
    utt: newUttId(), noUtt: false, liveOff: false, liveKey: '', liveAt: 0, liveTimer: 0, writeMs: 0,
    role: 'host', code: '', cohosts: [], unsubCo: null };

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (window.RoomKit) { resolve(); return; }
      const sc = document.createElement('script');
      sc.src = src; sc.onload = resolve; sc.onerror = () => reject(new Error('Không tải được thư viện phòng họp'));
      document.head.appendChild(sc);
    });
  }
  // anon=true: phòng họp (đăng nhập ẩn danh nếu chưa có phiên). anon=false: chỉ khôi phục phiên đã lưu (dùng cho tài khoản VIP).
  let kitRawP = null;
  const kitRaw = () => kitRawP || (kitRawP = (async () => { await loadScript('room.bundle.js'); return window.RoomKit.create(FB); })().catch(e => { kitRawP = null; throw e; }));
  async function getKit(anon = true) {
    if (anon && room.kit) return room.kit;
    const kit = await kitRaw();
    if (!anon) { await kit.ready(); return kit; }
    await kit.init();
    room.kit = kit;
    return kit;
  }
  const joinUrl = id => new URL('./', location.href).href + '?room=' + id;

  function setRoomDot() { el.roomDot.classList.toggle('hidden', !room.active); }
  function saveRoom() {
    if (room.active) store.set('room', JSON.stringify({ id: room.id, expiresAtMs: room.expiresAtMs }));
    else store.set('room', '');
  }

  // Phía chủ phòng: dịch bù cho các ngôn ngữ người xem đã chọn (bằng khóa API của máy chủ phòng)
  function needLangs(rec) { return room.allowed.filter(l => l !== rec.from && l !== rec.to && !(rec.tr && rec.tr[l])); }
  // Dịch song song mọi ngôn ngữ phụ và ghi một lần (nhanh hơn, ít lượt ghi hơn)
  async function translateForViewers(rec) {
    rec.pend = rec.pend || new Set();
    const langs = needLangs(rec).filter(l => !rec.pend.has(l));
    if (!langs.length) return;
    langs.forEach(l => rec.pend.add(l));
    const got = {};
    await Promise.all(langs.map(async l => {
      try { got[l] = await translateText(rec.src, rec.from, l); } catch (_) { /* bỏ qua; người xem vẫn thấy bản dịch của chủ phòng */ }
    }));
    langs.forEach(l => rec.pend.delete(l));
    if (!room.active || !Object.keys(got).length) return;
    try {
      await room.kit.setTranslations(room.id, rec.id, got);
      rec.tr = Object.assign(rec.tr || {}, got);
    } catch (_) {}
  }
  // Đẩy bản "đang nói" lên phòng (giới hạn tần suất; chỉ khi có người xem và nội dung thay đổi)
  function roomLive() {
    const co = room.role === 'co';
    if (!room.active || room.liveOff || (!co && !room.viewers.length && !state.twoMode)) return;
    const src = el.src.value.trim();
    if (!src) return;
    const out = (el.out.textContent || '').trim();
    const key = src + '\u0001' + out;
    if (key === room.liveKey) return;
    const wait = room.liveAt + LIVE_MS - Date.now();
    if (wait > 0) { if (!room.liveTimer) room.liveTimer = setTimeout(() => { room.liveTimer = 0; roomLive(); }, wait); return; }
    room.liveKey = key; room.liveAt = Date.now();
    room.kit.setLive(room.id, room.expiresAtMs, { utt: room.utt, src, out, from: state.src, to: state.tgt }, co ? 'co' : 'now')
      .catch(e => { if (e && e.code === 'permission-denied') room.liveOff = true; });
  }
  function onViewers(list) {
    room.viewers = list;
    const langs = [...new Set(list.map(v => v.lang))];
    for (const l of langs) if (LANGS[l] && !room.allowed.includes(l) && room.allowed.length < MAX_EXTRA) {
      room.allowed.push(l);
      room.recent.slice(-BACKLOG).forEach(translateForViewers);
    }
    if (el.sheetRoom.classList.contains('flex')) renderRoom();
  }
  async function roomPublish(item) {
    if (!room.active) return;
    const utt = room.utt;
    room.utt = newUttId(); room.liveKey = '';
    if (room.role === 'co') item = Object.assign({}, item, { by: 'co' });
    try {
      const t0 = Date.now();
      let id;
      try {
        id = await room.kit.pushMessage(room.id, room.expiresAtMs, room.noUtt ? item : Object.assign({}, item, { utt }));
      } catch (e) {
        // Quy tắc Firestore cũ chưa có trường utt: gửi lại không kèm utt và tắt bản "đang nói"
        if (e && e.code === 'permission-denied' && !room.noUtt) {
          room.noUtt = true; room.liveOff = true;
          id = await room.kit.pushMessage(room.id, room.expiresAtMs, item);
        } else throw e;
      }
      room.writeMs = Date.now() - t0;
      const rec = { id, src: item.src, out: item.out, from: item.from, to: item.to, tr: {} };
      room.recent.push(rec);
      if (room.recent.length > 40) room.recent.shift();
      if (room.role !== 'co') translateForViewers(rec); // chỉ máy chủ phòng dịch thêm cho ngôn ngữ phụ của người xem
    } catch (e) { toast('Không gửi được tin lên phòng: ' + (e.code || e.message)); }
  }

  // ---------- Hai máy laptop: mỗi máy một ngôn ngữ cố định, dùng chung một phòng ----------
  const feed = { msgs: [], lives: {}, seen: null, unsub: [] };
  const mySlot = () => (room.role === 'co' ? 'co' : 'now');
  function feedBubble(m, live) {
    const mine = m.from === state.src;
    const big = mine ? m.src : m.out;
    const small = mine ? m.out : m.src;
    const row = node('div', 'flex ' + (mine ? 'justify-end' : 'justify-start'));
    const cls = live ? 'border border-dashed border-brand-300 bg-brand-50 text-brand-900' : (mine ? 'rounded-br-md bg-brand-600 text-white' : 'rounded-bl-md border border-slate-200 bg-white text-slate-900');
    const bub = node('div', 'max-w-[88%] rounded-2xl px-3.5 py-2.5 shadow-sm ' + cls);
    const time = live ? 'Đang nói…' : new Date(m.ts).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    bub.appendChild(node('div', 'text-[0.6875rem] font-medium ' + (mine && !live ? 'text-brand-100' : 'text-slate-500'), `${LANGS[m.from] ? LANGS[m.from].name : ''} · ${time}`));
    bub.appendChild(node('div', 'mt-0.5 whitespace-pre-wrap break-words text-lg font-semibold leading-snug', big || '…'));
    if (small && small !== big) bub.appendChild(node('div', 'mt-1 border-t pt-1 text-xs ' + (mine && !live ? 'border-white/20 text-brand-100' : 'border-slate-100 text-slate-500'), small));
    row.appendChild(bub);
    return row;
  }
  function renderFeed() {
    if (!state.twoMode) return;
    const wrap = el.histWrap;
    const near = wrap.scrollHeight - wrap.scrollTop - wrap.clientHeight < 80;
    el.hist.innerHTML = '';
    if (feed.msgs.length) el.emptyHint.classList.add('hidden');
    for (const m of feed.msgs) el.hist.appendChild(feedBubble(m, false));
    const recent = feed.msgs.slice(-6);
    for (const slot of ['now', 'co']) {
      const l = feed.lives[slot];
      if (slot === mySlot() || !l || !l.src || Date.now() - l.ts > 20000) continue;
      if (recent.some(m => m.utt && m.utt === l.utt)) continue;
      el.hist.appendChild(feedBubble(l, true));
    }
    if (near) scrollChat();
  }
  function onFeed(list) {
    feed.msgs = list;
    if (feed.seen === null) feed.seen = new Set(list.map(m => m.id)); // tin cũ lúc mới vào: không dịch bù, không đọc
    else for (const m of list) {
      if (feed.seen.has(m.id)) continue;
      feed.seen.add(m.id);
      const fromOther = room.role === 'co' ? m.by !== 'co' : m.by === 'co';
      if (!fromOther) continue;
      if (room.role === 'host') { // máy chủ phòng dịch thêm các ngôn ngữ phụ cho tin của máy thứ hai
        const rec = { id: m.id, src: m.src, out: m.out, from: m.from, to: m.to, tr: m.tr || {} };
        room.recent.push(rec); if (room.recent.length > 40) room.recent.shift();
        translateForViewers(rec);
      }
      // Đọc bản dịch của người bên kia bằng ngôn ngữ của máy này
      if (state.meetingSpeak && state.meeting && m.to === state.src && m.out) enqueueSpeech(m.out, m.to);
    }
    renderFeed();
  }
  function enterTwoMode() {
    if (state.twoMode) return;
    state.twoMode = true;
    state.autoTurn = false; el.chkAutoTurn.checked = false; // ngôn ngữ cố định, không đảo lượt
    state.dual = false; syncDual();
    for (const b of [el.btnSwap, el.btnDual, el.chkAutoTurn.parentElement]) b.classList.add('hidden');
    feed.msgs = []; feed.lives = {}; feed.seen = null;
    feed.unsub.push(room.kit.subscribeMessages(room.id, onFeed, () => {}));
    const other = mySlot() === 'co' ? 'now' : 'co';
    feed.unsub.push(room.kit.subscribeLive(room.id, other, l => { feed.lives[other] = l; renderFeed(); }));
    renderFeed();
    toast('Chế độ hai máy: mỗi máy giữ một ngôn ngữ cố định');
  }
  function leaveTwoMode() {
    feed.unsub.forEach(u => { try { u(); } catch (_) {} });
    feed.unsub = [];
    if (!state.twoMode) return;
    state.twoMode = false;
    for (const b of [el.btnSwap, el.btnDual, el.chkAutoTurn.parentElement]) b.classList.remove('hidden');
    renderAll();
  }
  async function activateRoom(info) {
    room.id = info.id; room.expiresAtMs = info.expiresAtMs; room.active = true;
    room.recent = []; room.allowed = []; room.viewers = []; room.utt = newUttId(); room.noUtt = false; room.liveOff = false; room.liveKey = '';
    if (room.unsubViewers) room.unsubViewers();
    room.unsubViewers = room.kit.subscribeViewers(room.id, onViewers, () => {});
    room.role = 'host'; room.code = info.code || ''; room.cohosts = [];
    if (!info.code) room.kit.ensureCoCode(room.id).then(c => { room.code = c; if (el.sheetRoom.classList.contains('flex')) renderRoom(); }).catch(() => {});
    if (room.unsubCo) room.unsubCo();
    room.unsubCo = room.kit.subscribeCohosts(room.id, list => {
      room.cohosts = list;
      if (list.length) enterTwoMode();
      if (el.sheetRoom.classList.contains('flex')) renderRoom();
    });
    saveRoom(); setRoomDot();
  }
  async function createRoomNow() {
    try {
      const kit = await getKit();
      const info = await kit.createRoom({ ttlHours: ROOMCFG.ttlHours || 24, hostSrc: state.src, hostTgt: state.tgt });
      await activateRoom(info);
      renderRoom();
    } catch (e) { toast('Không tạo được phòng: ' + (e.code || e.message)); renderRoom(); }
  }
  // wipe = true: xóa luôn toàn bộ nội dung phòng trên máy chủ; false: chỉ đóng, dữ liệu giữ đến khi hết hạn
  async function closeRoomNow(wipe) {
    if (!room.active) return;
    const id = room.id;
    if (room.unsubViewers) room.unsubViewers();
    if (room.unsubCo) { room.unsubCo(); room.unsubCo = null; }
    leaveTwoMode();
    room.active = false; room.id = null; room.chain = Promise.resolve();
    saveRoom(); setRoomDot();
    let failed = false;
    try { await room.kit.closeRoom(id); } catch (_) { failed = !wipe; }
    if (wipe) {
      try { await room.kit.deleteRoomData(id); } catch (e) { failed = true; toast('Không xóa hết được dữ liệu: ' + (e.code || e.message)); }
    }
    renderRoom();
    if (!failed) toast(wipe ? 'Đã kết thúc phòng và xóa nội dung' : 'Đã kết thúc phòng');
  }
  async function resumeRoom() {
    let saved = null;
    try { saved = JSON.parse(store.get('room', '') || 'null'); } catch (_) {}
    if (!roomEnabled || !saved || saved.expiresAtMs < Date.now()) { if (saved) store.set('room', ''); return; }
    try {
      const kit = await getKit();
      const info = await kit.getRoom(saved.id);
      if (info && info.hostUid === kit.uid && info.status === 'open') await activateRoom(info);
      else store.set('room', '');
    } catch (_) { /* giữ nguyên, thử lại lần sau */ }
  }

  function renderRoom() {
    const b = el.roomBody;
    b.innerHTML = '';
    if (!roomEnabled) {
      b.appendChild(node('p', 'text-sm text-slate-600', 'Tính năng phòng họp xem chung cần cấu hình Firebase trong config.js.'));
      b.appendChild(node('p', 'mt-2 text-sm text-slate-500', 'Xem hướng dẫn tại docs/FIREBASE-SETUP.md.'));
      return;
    }
    if (!room.active) {
      b.appendChild(node('p', 'text-sm text-slate-600', 'Tạo một phòng để người trong phòng họp quét mã QR bằng điện thoại, xem chữ gốc và chữ dịch theo thời gian thực và tự chọn ngôn ngữ hiển thị.'));
      b.appendChild(node('p', 'mt-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-800', 'Lưu ý: nội dung họp sẽ được lưu trên máy chủ Firebase tối đa 24 giờ. Chỉ chia sẻ mã QR cho người được phép xem. Người xem chỉ đọc, không gửi được nội dung.'));
      const bt = node('button', 'mt-4 w-full rounded-xl bg-brand-600 py-2.5 font-medium text-white', 'Tạo phòng họp');
      bt.onclick = () => { bt.disabled = true; bt.textContent = 'Đang tạo…'; createRoomNow(); };
      b.appendChild(bt);
      return;
    }
    const url = joinUrl(room.id);
    const qr = node('div', 'mx-auto w-56 rounded-xl border border-slate-200 bg-white p-2');
    qr.innerHTML = room.kit.qrSvg(url);
    b.appendChild(qr);
    b.appendChild(node('p', 'mt-2 text-center text-xs text-slate-500', 'Người trong phòng quét mã bằng camera điện thoại'));
    const link = node('div', 'mt-3 break-all rounded-lg bg-slate-50 p-2 text-xs text-slate-600', url);
    b.appendChild(link);
    const cp = node('button', 'mt-2 w-full rounded-lg border border-brand-600 py-1.5 text-sm font-medium text-brand-600', 'Sao chép liên kết');
    cp.onclick = async () => { try { await navigator.clipboard.writeText(url); toast('Đã sao chép liên kết'); } catch (_) { toast('Không thể sao chép'); } };
    b.appendChild(cp);
    b.appendChild(node('h3', 'mt-5 border-t border-slate-200 pt-3 text-sm font-semibold text-brand-700', 'Laptop thứ hai (mỗi máy một ngôn ngữ cố định)'));
    if (!room.code) {
      b.appendChild(node('p', 'mt-1 text-xs text-amber-700', 'Chưa tạo được mã mời máy thứ hai (cần xuất bản lại quy tắc Firestore).'));
    } else {
      const coUrl = joinUrl(room.id) + '&co=' + room.code;
      b.appendChild(node('p', 'mt-1 text-xs text-slate-500', 'Mở liên kết này trên laptop bên kia. Máy đó tự lấy ngôn ngữ ngược với máy này. Không chia sẻ liên kết cho người xem.'));
      const qr2 = node('div', 'mx-auto mt-2 w-40 rounded-xl border border-slate-200 bg-white p-2');
      qr2.innerHTML = room.kit.qrSvg(coUrl);
      b.appendChild(qr2);
      const cp2 = node('button', 'mt-2 w-full rounded-lg border border-brand-600 py-1.5 text-sm font-medium text-brand-600', 'Sao chép liên kết máy thứ hai');
      cp2.onclick = async () => { try { await navigator.clipboard.writeText(coUrl); toast('Đã sao chép liên kết máy thứ hai'); } catch (_) { toast('Không thể sao chép'); } };
      b.appendChild(cp2);
      b.appendChild(node('p', 'mt-1 text-sm', room.cohosts.length ? 'Máy thứ hai: đã kết nối' : 'Máy thứ hai: chưa kết nối'));
    }
    const exp = new Date(room.expiresAtMs);
    const names = [...new Set(room.viewers.map(v => LANGS[v.lang] ? LANGS[v.lang].name : v.lang))];
    b.appendChild(node('p', 'mt-3 text-sm', `Đang xem: ${room.viewers.length} người${names.length ? ' (' + names.join(', ') + ')' : ''}`));
    if (room.writeMs) b.appendChild(node('p', 'text-xs text-slate-500', `Độ trễ gửi lên máy chủ gần nhất: ${room.writeMs} ms${room.liveOff ? ' · Chưa bật "đang nói" (cần xuất bản lại quy tắc Firestore)' : ''}`));
    b.appendChild(node('p', 'text-xs text-slate-500', `Phòng hết hạn lúc ${pad(exp.getHours())}:${pad(exp.getMinutes())} ngày ${pad(exp.getDate())}/${pad(exp.getMonth() + 1)}. Tối đa ${MAX_EXTRA} ngôn ngữ phụ được dịch thêm.`));
    const endWipe = node('button', 'mt-4 w-full rounded-xl bg-red-600 py-2 text-sm font-medium text-white', 'Kết thúc và xóa nội dung ngay');
    endWipe.onclick = () => { if (confirm('Kết thúc phòng và XÓA toàn bộ nội dung trên máy chủ? Người xem sẽ không xem lại được. Không thể hoàn tác.')) closeRoomNow(true); };
    b.appendChild(endWipe);
    const endKeep = node('button', 'mt-2 w-full rounded-xl border border-red-300 py-2 text-sm font-medium text-red-600', 'Kết thúc, giữ nội dung đến khi hết hạn');
    endKeep.onclick = () => { if (confirm('Kết thúc phòng? Người xem sẽ không nhận thêm nội dung mới; nội dung vẫn xem được đến khi phòng hết hạn.')) closeRoomNow(false); };
    b.appendChild(endKeep);
  }
  el.btnRoom.onclick = () => { renderRoom(); openModal(el.sheetRoom); };

  // Phía người xem (mở liên kết có ?room=)
  const viewerRoomId = new URLSearchParams(location.search).get('room');
  async function startViewer(id) {
    document.body.classList.add('viewer');
    el.viewerBar.classList.remove('hidden');
    el.emptyHint.querySelector('p').textContent = 'Đang chờ nội dung từ phòng họp…';
    el.viewerStatus.textContent = 'Đang kết nối…';
    let lang = store.get('viewerLang', '');
    if (!LANGS[lang]) { const g = (navigator.language || 'vi').slice(0, 2).toLowerCase(); lang = LANGS[g] ? g : 'vi'; }
    el.selViewerLang.innerHTML = '';
    for (const [k, v] of Object.entries(LANGS)) { const o = document.createElement('option'); o.value = k; o.textContent = v.name; el.selViewerLang.appendChild(o); }
    el.selViewerLang.value = lang;
    if (!roomEnabled) { el.viewerStatus.textContent = 'Chưa cấu hình phòng họp'; return; }
    let kit, info;
    try {
      kit = await getKit();
      info = await kit.getRoom(id);
    } catch (e) { el.viewerStatus.textContent = 'Không kết nối được: ' + (e.code || e.message); return; }
    if (!info || info.expiresAtMs < Date.now()) { el.viewerStatus.textContent = 'Phòng không tồn tại hoặc đã hết hạn'; return; }
    const join = () => kit.joinAsViewer(id, info.expiresAtMs, lang).catch(() => {});
    el.selViewerLang.onchange = () => { lang = el.selViewerLang.value; store.set('viewerLang', lang); join(); render(); fillViewerVoices(); };
    await join();
    let msgs = [];
    const pick = m => {
      if (lang === m.from) return { text: m.src, note: '' };
      if (lang === m.to) return { text: m.out, note: '' };
      if (m.tr && m.tr[lang]) return { text: m.tr[lang], note: '' };
      return { text: m.out, note: `(đang dịch sang ${LANGS[lang].name}…)` };
    };
    let render = function () {
      const wrap = el.histWrap;
      const nearBottom = wrap.scrollHeight - wrap.scrollTop - wrap.clientHeight < 80;
      el.hist.innerHTML = '';
      if (msgs.length) el.emptyHint.classList.add('hidden');
      for (const m of msgs) {
        const { text, note } = pick(m);
        const row = node('div', 'flex justify-start');
        const bub = node('div', 'max-w-[92%] rounded-2xl rounded-bl-md border border-slate-200 bg-white px-3.5 py-2.5 shadow-sm');
        bub.appendChild(node('div', 'text-[0.6875rem] font-medium text-slate-500', `${LANGS[m.from] ? LANGS[m.from].name : ''} · ${new Date(m.ts).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`));
        bub.appendChild(node('div', 'mt-0.5 whitespace-pre-wrap break-words text-lg font-semibold leading-snug text-brand-900', text));
        if (note) bub.appendChild(node('div', 'text-[0.6875rem] italic text-slate-400', note));
        if (m.src !== text) bub.appendChild(node('div', 'mt-1 border-t border-slate-100 pt-1 text-xs text-slate-500', m.src));
        row.appendChild(bub);
        el.hist.appendChild(row);
      }
      if (nearBottom) scrollChat();
    }
    let ended = false;
    // Bản "đang nói" của chủ phòng: hiện ngay khi họ còn đang nói; ẩn khi câu đã được chốt thành tin nhắn
    const lives = { now: null, co: null };
    function renderLive() {
      document.querySelectorAll('.viewerLive').forEach(n => n.remove());
      if (ended) return;
      const recent = msgs.slice(-6);
      for (const slot of ['now', 'co']) {
        const live = lives[slot];
        if (!live || !live.src || Date.now() - live.ts > 20000 || recent.some(m => m.utt && m.utt === live.utt)) continue;
        const text = lang === live.from ? live.src : live.out;
        const note = lang !== live.from && lang !== live.to ? `(bản dịch sang ${LANGS[live.to] ? LANGS[live.to].name : ''})` : '';
        const row = node('div', 'viewerLive flex justify-start');
        const bub = node('div', 'max-w-[92%] rounded-2xl rounded-bl-md border border-dashed border-brand-200 bg-brand-50/60 px-3.5 py-2.5');
        bub.appendChild(node('div', 'text-[0.6875rem] font-medium text-brand-700', 'Đang nói…'));
        bub.appendChild(node('div', 'mt-0.5 whitespace-pre-wrap break-words text-lg font-semibold leading-snug text-brand-900/80', text || '…'));
        if (note) bub.appendChild(node('div', 'text-[0.6875rem] italic text-slate-400', note));
        row.appendChild(bub);
        el.hist.appendChild(row);
      }
      scrollChat();
    }
    const baseRender = render;
    render = () => { baseRender(); renderLive(); };
    for (const slot of ['now', 'co']) kit.subscribeLive(id, slot, l => { lives[slot] = l; renderLive(); });

    // Đọc bản dịch bằng tai nghe: chỉ đọc tin mới, bỏ qua lời cùng ngôn ngữ của người xem
    const EAR_WAIT_MS = 6000;
    let earOn = false, earSeen = null, earBusy = false;
    const earQ = [];
    el.chkEar.checked = false; // luôn tắt khi mở lại: iOS yêu cầu phát âm đầu tiên phải từ thao tác chạm
    // Giọng đọc của người xem (thu gọn mặc định): chọn giọng, tốc độ, độ cao; dùng cho phần đọc bằng tai nghe
    const vBox = $('viewerVoice'), vPanel = $('voiceBox'), vSel = $('selViewerVoice');
    const vRate = $('inVRate'), vPitch = $('inVPitch');
    const vTwoDec = n => (+n).toFixed(2).replace('.', ',');
    function updateVoiceSummary() {
      const cur = vSel.selectedOptions[0];
      const name = cur && cur.value ? cur.textContent.replace(/\s*\(.*\)\s*$/, '') : 'Mặc định';
      $('voiceSummary').textContent = '· ' + name + ', ' + vTwoDec(state.rate) + '×';
    }
    function fillViewerVoices() {
      const list = voicesFor(lang);
      vSel.innerHTML = '';
      if (!list.length) { const o = document.createElement('option'); o.value = ''; o.textContent = 'Mặc định của thiết bị'; vSel.appendChild(o); }
      for (const v of list) { const o = document.createElement('option'); o.value = v.name; o.textContent = v.name; vSel.appendChild(o); }
      if (list.length) vSel.value = store.get('voice_' + lang, '') || list[0].name;
      updateVoiceSummary();
    }
    vRate.value = state.rate; vPitch.value = state.pitch;
    $('lblVRate').textContent = vTwoDec(state.rate) + '×'; $('lblVPitch').textContent = vTwoDec(state.pitch);
    vSel.onchange = () => { store.set('voice_' + lang, vSel.value); updateVoiceSummary(); };
    vRate.oninput = () => { state.rate = +vRate.value; store.set('rate', String(state.rate)); $('lblVRate').textContent = vTwoDec(state.rate) + '×'; updateVoiceSummary(); };
    vPitch.oninput = () => { state.pitch = +vPitch.value; store.set('pitch', String(state.pitch)); $('lblVPitch').textContent = vTwoDec(state.pitch); };
    $('btnVTest').onclick = () => { unlockTTS(); speak(TEST_TEXT[lang] || TEST_TEXT.en, lang); };
    $('btnVoiceToggle').onclick = () => {
      const open = vPanel.classList.toggle('hidden') === false;
      $('btnVoiceToggle').setAttribute('aria-expanded', String(open));
      $('voiceChevron').style.transform = open ? 'rotate(180deg)' : '';
    };
    if ('speechSynthesis' in window) speechSynthesis.addEventListener('voiceschanged', fillViewerVoices);
    fillViewerVoices();
    el.chkEar.onchange = () => {
      vBox.classList.toggle('hidden', !el.chkEar.checked);
      earOn = el.chkEar.checked;
      if (earOn) { unlockTTS(); earQ.length = 0; if (earSeen) msgs.forEach(m => earSeen.add(m.id)); }
      else { earQ.length = 0; cancelSpeech(); }
    };
    function earText(m) {
      if (lang === m.from) return '';
      if (lang === m.to) return m.out;
      return (m.tr && m.tr[lang]) || null; // null: chưa có bản dịch
    }
    async function earPump() {
      if (earBusy || !earOn) return;
      earBusy = true;
      try {
        while (earOn && earQ.length) {
          const item = earQ[0];
          const m = msgs.find(x => x.id === item.id);
          const t = m ? earText(m) : '';
          if (t === null) {
            if (Date.now() - item.at < EAR_WAIT_MS) { setTimeout(earPump, 700); break; }
            earQ.shift(); continue;
          }
          earQ.shift();
          if (t) await speakAndWait(t, lang);
        }
      } finally { earBusy = false; }
    }
    const onMsgs = list => {
      if (earSeen === null) earSeen = new Set(list.map(m => m.id)); // tin cũ khi mới vào: không đọc
      else for (const m of list) {
        if (earSeen.has(m.id)) continue;
        earSeen.add(m.id);
        if (earOn) { earQ.push({ id: m.id, at: Date.now() }); while (earQ.length > 3) earQ.shift(); }
      }
      if (earOn) earPump();
    };
    kit.subscribeMessages(id, list => { msgs = list; onMsgs(list); if (!ended) el.viewerStatus.textContent = 'Đang xem trực tiếp'; render(); },
      e => { el.viewerStatus.textContent = 'Mất kết nối: ' + (e.code || e.message); });
    kit.subscribeRoom(id, r => {
      if (!r) { ended = true; el.viewerStatus.textContent = 'Chủ phòng đã kết thúc và xóa phòng họp'; }
      else if (r.status === 'closed') { ended = true; el.viewerStatus.textContent = 'Chủ phòng đã kết thúc phòng họp'; }
    }, () => {});
  }


  // Phía máy laptop thứ hai (liên kết có ?room=...&co=...): ghi âm và dịch bằng ngôn ngữ cố định của máy này
  async function startCohost(id, code) {
    el.coBar.classList.remove('hidden');
    const say = t => { el.coStatus.textContent = t; };
    say('Đang kết nối…');
    if (!roomEnabled) { say('Chưa cấu hình phòng họp'); return; }
    let kit, info;
    try { kit = await getKit(); info = await kit.getRoom(id); } catch (e) { say('Không kết nối được: ' + (e.code || e.message)); return; }
    if (!info || info.expiresAtMs < Date.now() || info.status !== 'open') { say('Phòng không tồn tại, đã đóng hoặc hết hạn'); return; }
    try { await kit.joinAsCohost(id, info.expiresAtMs, code); }
    catch (e) { say('Không vào được với tư cách máy thứ hai: mã mời sai hoặc quy tắc Firestore chưa cập nhật (' + (e.code || e.message) + ')'); return; }
    room.kit = kit; room.id = id; room.expiresAtMs = info.expiresAtMs; room.role = 'co'; room.active = true;
    if (LANGS[info.hostTgt] && LANGS[info.hostSrc]) setLangs(info.hostTgt, info.hostSrc, false); // máy này nói ngôn ngữ đích của máy chủ phòng
    enterTwoMode();
    say(`Đã kết nối phòng họp. Máy này nói ${LANGS[state.src].name}, dịch sang ${LANGS[state.tgt].name}. Bấm "Chế độ họp" để bắt đầu ghi.`);
    kit.subscribeRoom(id, r => {
      if (!r || r.status === 'closed') { room.active = false; say('Chủ phòng đã kết thúc phòng họp'); }
    }, () => {});
  }

  // ---------- Khởi tạo ----------
  applyScale();
  fillSelect(el.selVoiceLang, state.tgt);
  fillSelect(el.selSrc, state.src);
  fillSelect(el.selTgt, state.tgt);
  syncLangUI();
  renderGUsage();
  updateCounter();
  if (!SR) el.micHint.textContent = 'Trình duyệt chưa hỗ trợ nhận diện giọng nói - bạn vẫn có thể gõ văn bản';
  // ----- Tài khoản: áp dụng quyền, đăng nhập/đăng ký, theo dõi hồ sơ, báo sử dụng, quản trị -----
  const vipOnly = () => toast('Tính năng dành cho tài khoản VIP. Vào Cài đặt → Đổi tài khoản để đăng nhập VIP.');
  const fmtDay = ms => new Date(ms).toLocaleDateString('vi-VN');
  const daysLeft = ms => Math.max(0, Math.ceil((ms - Date.now()) / 86400000));
  const setHint = v => store.set('acct', v);
  const planName = () => { const p = (CFG.plans || []).find(x => x && x.name); return p ? p.name : 'VIP'; };
  const noViewerGate = () => !!(viewerRoomId && !new URLSearchParams(location.search).get('co')); // người xem qua QR không cần chọn tài khoản

  function fbErr(e) {
    const c = String((e && e.code) || '');
    const map = {
      'auth/invalid-credential': 'Sai email hoặc mật khẩu', 'auth/wrong-password': 'Sai email hoặc mật khẩu', 'auth/user-not-found': 'Sai email hoặc mật khẩu',
      'auth/invalid-email': 'Email không hợp lệ', 'auth/email-already-in-use': 'Email này đã được đăng ký, hãy đăng nhập',
      'auth/weak-password': 'Mật khẩu quá yếu', 'auth/too-many-requests': 'Thử quá nhiều lần, vui lòng chờ ít phút rồi thử lại',
      'auth/network-request-failed': 'Không kết nối được mạng', 'auth/user-disabled': 'Tài khoản đã bị vô hiệu hóa',
      'auth/operation-not-allowed': 'Chưa bật đăng nhập Email/Mật khẩu trong Firebase (xem hướng dẫn thiết lập)',
      'permission-denied': 'Không đủ quyền: quản trị viên cần cập nhật quy tắc Firestore theo hướng dẫn thiết lập',
      'unavailable': 'Không kết nối được máy chủ'
    };
    return map[c] || (e && e.message) || 'Lỗi không rõ';
  }

  let profUnsub = null, usageTimer = 0, sharedWarned = false, lapsedToast = false;

  // VIP thường chỉ thấy số ký tự đã dùng so với mức quản trị viên đặt (không có đơn giá, hạn mức miễn phí hay ước tính phí)
  function renderVipUse() {
    const box = el.vipUse;
    const show = isVip() && !isAdminAcct();
    box.classList.toggle('hidden', !show);
    box.textContent = '';
    if (!show) return;
    const rows = [['Dịch bằng Google', 'tr'], ['Đọc bằng giọng WaveNet', 'tts']];
    const tbl = node('table', 'w-full overflow-hidden rounded-lg border border-slate-200 text-xs');
    const head = node('tr', 'border-b border-slate-200 bg-slate-50 font-medium text-slate-700');
    head.appendChild(node('td', 'px-2 py-1', 'Mức dùng tháng này'));
    head.appendChild(node('td', 'px-2 py-1 text-right', 'Đã dùng / giới hạn (ký tự)'));
    tbl.appendChild(head);
    for (const [label, kind] of rows) {
      const used = userUsed(kind), lim = state.userLimit[kind];
      const pct = lim > 0 ? Math.min(100, Math.round(used * 100 / lim)) : 0;
      const tr = node('tr', 'border-b border-slate-200 last:border-b-0');
      tr.appendChild(node('td', 'px-2 py-1', label));
      const v = node('td', 'px-2 py-1 text-right tabular-nums' + (lim > 0 && used >= lim ? ' text-red-600' : lim > 0 && pct >= 80 ? ' text-amber-600' : ''),
        lim > 0 ? `${fmtN(used)} / ${fmtN(lim)} (${pct}%)` : `${fmtN(used)} (không giới hạn)`);
      tr.appendChild(v); tbl.appendChild(tr);
    }
    box.appendChild(tbl);
  }

  function applyAcct() {
    const vip = isVip(), info = state.acctInfo;
    if (!vip) { state.engine = 'mymemory'; state.ttsMode = 'device'; state.conf = false; }
    el.btnExport.classList.toggle('hidden', !vip);
    el.btnConf.classList.toggle('hidden', !vip);
    el.chkConf.closest('label').classList.toggle('hidden', !vip);
    el.chkConf.checked = state.conf;
    const admin = isAdminAcct();
    el.rowGKey.classList.toggle('hidden', !admin); el.noteGKey.classList.toggle('hidden', !admin); // VIP thường không thấy ô nhập khóa
    el.rowTtsKey.classList.toggle('hidden', !admin); el.noteTts.classList.toggle('hidden', !admin);
    el.boxGAdmin.classList.toggle('hidden', !admin); el.boxTtsAdmin.classList.toggle('hidden', !admin); // bảng đo, hạn mức và ước tính phí: chỉ quản trị viên
    if (vip && !admin) { state.ttsKey = ''; if (state.sharedKey) state.gkey = state.sharedKey; else if (state.gkey && state.gkey !== state.sharedKey) state.gkey = ''; } // bỏ khóa tự nhập, chỉ dùng khóa dùng chung
    el.rowFallback.classList.toggle('hidden', !admin);
    el.rowEngine.classList.toggle('hidden', !vip); // tài khoản thường chỉ có MyMemory nên không cần chọn nguồn dịch
    if (!vip) el.selEngine.value = 'mymemory';
    el.selEngine.querySelector('option[value="google"]').disabled = !vip;
    el.selTtsMode.querySelector('option[value="cloud"]').disabled = !vip;
    el.rowTtsMode.classList.toggle('hidden', !vip); // tài khoản thường chỉ có giọng thiết bị nên không cần chọn nguồn
    el.acctName.textContent = vip ? (info && info.admin ? 'Quản trị viên' : 'VIP') + (info && info.email ? ' (' + info.email + ')' : '') : (state.acct === 'free' ? 'Miễn phí' : 'Chưa chọn');
    // Thời gian dùng VIP trong tháng và mức dùng của riêng tài khoản này
    let meta = '', warn = false;
    if (vip && info) {
      if (info.admin) meta = 'Tài khoản quản trị: không giới hạn thời gian';
      else if (info.expiresAtMs) { const n = daysLeft(info.expiresAtMs); meta = `Còn ${n} ngày dùng VIP (hết hạn ${fmtDay(info.expiresAtMs)})`; warn = n <= 3; }
    }
    renderVipUse();
    el.acctMeta.textContent = meta;
    el.acctMeta.classList.toggle('hidden', !meta);
    el.acctMeta.classList.toggle('text-amber-600', warn);
    el.acctMeta.classList.toggle('text-slate-600', !warn);
    const uid = info && info.uid ? info.uid : '';
    el.acctUid.textContent = uid;
    el.acctUidRow.classList.toggle('hidden', !uid);
    el.acctUidRow.classList.toggle('flex', !!uid);
    el.btnAdmin.classList.toggle('hidden', !(vip && info && info.admin));
    el.freeNote.classList.toggle('hidden', vip);
    renderGUsage(); syncAccentUI(); syncConfBtn();
  }

  // Nâng lên VIP (đăng nhập lần đầu hoặc vừa được duyệt/gia hạn)
  function becomeVip() {
    const wasVip = isVip();
    state.acct = 'vip'; setHint('vip');
    if (!wasVip) { // mặc định VIP: Google Cloud Translation + giọng WaveNet
      state.engine = 'google'; state.ttsMode = 'cloud';
      store.set('engine', 'google'); store.set('ttsMode', 'cloud');
      state.conf = store.get('conf', '0') === '1';
      state.log = loadLog();
      cache.clear();
    }
    applyAcct(); renderAll(); closeGate();
  }
  // keep=true: bị hạ quyền (hết hạn/bị khóa): vẫn theo dõi hồ sơ và giữ dấu "đã có tài khoản VIP" để tự lên lại khi được gia hạn
  function becomeFree(msg, keep) {
    state.acct = 'free';
    if (!keep) { setHint('free'); if (profUnsub) { profUnsub(); profUnsub = null; } }
    if (cfgUnsub) { cfgUnsub(); cfgUnsub = null; }
    state.log = []; state.sharedKey = ''; state.userLimit = { tr: 0, tts: 0 };
    if (!store.get('gkey', '')) state.gkey = '';
    applyAcct(); renderAll(); closeGate();
    if (msg) toast(msg);
  }

  // Khóa Google dùng chung và giới hạn mỗi VIP: chỉ Firestore trả về cho VIP đang còn hạn (kiểm tra ở quy tắc bảo mật).
  // Theo dõi trực tiếp: quản trị viên đổi giới hạn hoặc khóa là có hiệu lực ngay, không cần tải lại; bị thu quyền thì mất khóa ngay.
  let cfgUnsub = null;
  const blockedNow = () => { const L = state.userLimit; return (L.tr > 0 && userUsed('tr') >= L.tr) || (L.tts > 0 && userUsed('tts') >= L.tts); };
  function applyGoogleCfg(g) {
    state.sharedKey = (g && g.key) || '';
    state.userLimit = { tr: (g && g.userTr) || 0, tts: (g && g.userTts) || 0 };
    if (!(isAdminAcct() && store.get('gkey', ''))) state.gkey = state.sharedKey;
    if (!isAdminAcct()) state.ttsKey = '';
    renderGUsage(); applyAcct();
    if (limitBlocked && !isAdminAcct() && !blockedNow()) { limitBlocked = false; toast('Đã được cấp thêm giới hạn ký tự, đang dùng lại Google'); }
    if (!state.gkey && !sharedWarned) { sharedWarned = true; toast('Chưa có khóa Google dùng chung. Vào Cài đặt để nhập API key, hoặc liên hệ quản trị viên'); }
  }
  function watchGoogleCfg(kit) {
    if (cfgUnsub) return;
    cfgUnsub = kit.acct.subscribeGoogleConfig(applyGoogleCfg, () => { // mất quyền (hết hạn/bị khóa) hoặc lỗi: dùng bản miễn phí
      if (cfgUnsub) { cfgUnsub(); cfgUnsub = null; }
      state.sharedKey = ''; state.userLimit = { tr: 0, tts: 0 };
      if (!(isAdminAcct() && store.get('gkey', ''))) state.gkey = '';
      renderGUsage(); applyAcct();
    });
  }

  function reportUsage(kind, n) {
    if (!isVip() || !state.acctInfo || !state.acctInfo.uid || !n) return;
    pendingUse[kind] += n;
    if (!usageTimer) usageTimer = setTimeout(flushUsage, 20000);
  }
  async function flushUsage() {
    clearTimeout(usageTimer); usageTimer = 0;
    const d = { tr: pendingUse.tr, tts: pendingUse.tts };
    if (!d.tr && !d.tts) return;
    pendingUse.tr = pendingUse.tts = 0;
    try { const kit = await getKit(false); await kit.acct.reportUsage(monthKey(), d); }
    catch (_) { pendingUse.tr += d.tr; pendingUse.tts += d.tts; }
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushUsage(); });

  // Hồ sơ thay đổi (được duyệt, gia hạn, khóa, hết hạn): cập nhật ngay không cần đăng nhập lại
  function onProfile(kit, u, p, admin) {
    if (!p) { kit.acct.ensureProfile('').catch(() => {}); return; }
    const info = { uid: u.uid, email: u.email, name: p.name, status: p.status, expiresAtMs: p.expiresAtMs, admin, usage: p.usage };
    state.acctInfo = info;
    store.set('acctInfo', JSON.stringify(info));
    const valid = vipValid(info);
    if (valid) {
      const was = isVip();
      becomeVip();
      if (!was) toast(admin ? 'Đã đăng nhập tài khoản quản trị' : 'Tài khoản VIP đã được kích hoạt');
      watchGoogleCfg(kit);
      if (!admin && daysLeft(info.expiresAtMs) <= 3 && store.get('expWarn', '') !== todayKey()) { store.set('expWarn', todayKey()); toast(`Tài khoản VIP còn ${daysLeft(info.expiresAtMs)} ngày, vui lòng gia hạn`); }
    } else {
      if (isVip()) becomeFree(info.status === 'blocked' ? 'Tài khoản VIP đã bị khóa, đang dùng bản Miễn phí' : 'Tài khoản VIP đã hết hạn, đang dùng bản Miễn phí. Vui lòng gia hạn', true);
      applyAcct();
      if (!el.gate.hidden) renderGateStatus(info);
      else if (!lapsedToast) { // mở lại ứng dụng khi VIP đã hết hạn / chưa được duyệt: báo lý do đang dùng bản Miễn phí
        lapsedToast = true;
        toast(info.status === 'blocked' ? 'Tài khoản VIP đang bị khóa, đang dùng bản Miễn phí' : info.status === 'active' ? 'Tài khoản VIP đã hết hạn, đang dùng bản Miễn phí. Vui lòng gia hạn' : 'Tài khoản VIP đang chờ quản trị viên cấp quyền, tạm dùng bản Miễn phí');
      }
    }
  }
  async function watchAccount() {
    const kit = await getKit(false);
    const u = kit.acct.user();
    if (!u) { // phiên đăng nhập đã mất
      setHint(''); store.set('acctInfo', ''); state.acctInfo = null;
      if (isVip()) becomeFree();
      state.acct = null; applyAcct();
      if (!noViewerGate()) openGate('login');
      return;
    }
    if (profUnsub) { profUnsub(); profUnsub = null; }
    const admin = await kit.acct.isAdmin(u.uid);
    profUnsub = kit.acct.subscribeProfile(u.uid, p => onProfile(kit, u, p, admin), e => { if (!el.gate.hidden) el.gateErr.textContent = fbErr(e); });
  }

  // ----- Màn hình chọn tài khoản -----
  function showView(v) {
    el.gateForm.hidden = v !== 'login'; el.regForm.hidden = v !== 'reg'; el.gateStatus.hidden = v !== 'status';
    el.gateErr.textContent = ''; el.regErr.textContent = '';
  }
  function openGate(view) { el.gate.hidden = false; showView(view || 'login'); }
  function closeGate() { el.gate.hidden = true; }

  function renderGateStatus(info) {
    showView('status');
    const now = Date.now();
    const blocked = info.status === 'blocked';
    const expired = info.status === 'active' && info.expiresAtMs <= now;
    el.gsTitle.textContent = blocked ? 'Tài khoản đang bị khóa' : expired ? 'Tài khoản VIP đã hết hạn' : 'Đang chờ quản trị viên cấp quyền';
    el.gsText.textContent = blocked ? 'Vui lòng liên hệ quản trị viên để được mở khóa.'
      : expired ? `Đã hết hạn ngày ${fmtDay(info.expiresAtMs)}. Vui lòng gia hạn và chờ quản trị viên cấp quyền.`
      : `Tài khoản ${info.email} đã được đăng ký. Sau khi thanh toán, quản trị viên sẽ cấp quyền VIP (dùng theo tháng). Màn hình này tự cập nhật khi bạn được duyệt.`;
    el.gsPay.textContent = '';
    el.gsPay.hidden = blocked;
    if (!blocked) {
      const plan = (CFG.plans || []).find(x => x && x.name);
      const d = CFG.donate || {}, b = d.bank || {};
      const line = (label, val, code) => { if (!val) return; const p = node('div', 'mt-1'); p.appendChild(document.createTextNode(label + ': ')); p.appendChild(node(code ? 'code' : 'b', '', val)); el.gsPay.appendChild(p); };
      el.gsPay.appendChild(node('b', '', 'Thanh toán gói VIP'));
      if (plan) line('Gói', plan.name + (plan.price ? ' · ' + plan.price : ''));
      line('Ngân hàng', b.bankName); line('Số tài khoản', b.accountNumber); line('Chủ tài khoản', b.accountName);
      line('Nội dung chuyển khoản', info.email, true);
      line('Mã tài khoản', info.uid, true);
      if (d.qrImage) { const img = node('img'); img.src = d.qrImage; img.alt = 'Mã QR chuyển khoản'; el.gsPay.appendChild(img); }
    }
  }

  el.gateFree.onclick = () => becomeFree('Đang dùng tài khoản Miễn phí');
  el.gateToReg.onclick = () => showView('reg');
  el.regToLogin.onclick = () => showView('login');
  el.gsFree.onclick = () => becomeFree('Đang dùng tài khoản Miễn phí (tạm thời)');
  el.gsLogout.onclick = async () => {
    try { const kit = await getKit(false); await kit.acct.signOut(); } catch (_) {}
    if (profUnsub) { profUnsub(); profUnsub = null; }
    setHint(''); store.set('acctInfo', ''); state.acctInfo = null; state.acct = null; applyAcct(); showView('login');
  };
  el.gsRecheck.onclick = async () => {
    try {
      const kit = await getKit(false), u = kit.acct.user();
      if (!u) { showView('login'); return; }
      const p = await kit.acct.getProfile(u.uid);
      onProfile(kit, u, p, await kit.acct.isAdmin(u.uid));
      if (!isVip()) toast('Chưa được duyệt, vui lòng kiểm tra lại sau');
    } catch (e) { toast(fbErr(e)); }
  };

  async function afterSignIn() { setHint('vip'); await watchAccount(); }
  el.gateForm.onsubmit = async e => {
    e.preventDefault();
    const email = el.gateEmail.value.trim(), pass = el.gatePass.value;
    el.gateErr.textContent = '';
    if (!email || !pass) { el.gateErr.textContent = 'Vui lòng nhập email và mật khẩu'; return; }
    el.gateLogin.disabled = true;
    try {
      const kit = await getKit(false);
      await kit.acct.signIn(email, pass);
      el.gatePass.value = '';
      await afterSignIn();
    } catch (err) { el.gateErr.textContent = fbErr(err); }
    finally { el.gateLogin.disabled = false; }
  };
  el.regForm.onsubmit = async e => {
    e.preventDefault();
    const name = el.regName.value.trim(), email = el.regEmail.value.trim(), p1 = el.regPass.value, p2 = el.regPass2.value;
    const err = t => { el.regErr.textContent = t; };
    err('');
    if (!name) { err('Vui lòng nhập họ và tên'); return; }
    if (!email) { err('Vui lòng nhập email'); return; }
    if (p1.length < 8) { err('Mật khẩu tối thiểu 8 ký tự'); return; }
    if (p1 !== p2) { err('Hai mật khẩu không khớp'); return; }
    el.regSubmit.disabled = true;
    try {
      const kit = await getKit(false);
      await kit.acct.signUp(email, p1, name);
      el.regPass.value = el.regPass2.value = '';
      await afterSignIn();
    } catch (ex) { err(fbErr(ex)); }
    finally { el.regSubmit.disabled = false; }
  };
  el.gateForgot.onclick = async () => {
    const email = el.gateEmail.value.trim();
    if (!email) { el.gateErr.textContent = 'Nhập email vào ô phía trên rồi bấm "Quên mật khẩu"'; return; }
    try { const kit = await getKit(false); await kit.acct.resetPassword(email); el.gateErr.textContent = ''; toast('Nếu email đã đăng ký, hệ thống đã gửi thư đặt lại mật khẩu'); }
    catch (ex) { el.gateErr.textContent = fbErr(ex); }
  };

  el.btnSwitchAcct.onclick = async () => {
    try { if (state.acctInfo && state.acctInfo.uid) { const kit = await getKit(false); await kit.acct.signOut(); } } catch (_) {}
    setHint(''); store.set('acctInfo', '');
    location.reload();
  };
  el.btnCopyUid.onclick = async () => {
    const t = el.acctUid.textContent;
    try { await navigator.clipboard.writeText(t); toast('Đã sao chép mã tài khoản'); }
    catch (_) { const r = document.createRange(); r.selectNodeContents(el.acctUid); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); toast('Hãy nhấn Ctrl+C để sao chép'); }
  };

  // ----- Quản trị: duyệt/gia hạn/khóa tài khoản và theo dõi hạn mức Google -----
  const addMonth = ms => { const d = new Date(ms); d.setMonth(d.getMonth() + 1); return d.getTime(); };
  const effStatus = p => p.status === 'blocked' ? 'blocked' : p.status === 'active' ? (p.expiresAtMs > Date.now() ? 'active' : 'expired') : 'pending';
  const STATUS_VI = { pending: 'Chờ duyệt', active: 'Đang hoạt động', expired: 'Hết hạn', blocked: 'Bị khóa' };
  const STATUS_COLOR = { pending: '#b45309', active: '#15803d', expired: '#b91c1c', blocked: '#475569' };
  let adminFilter = '';

  el.btnAdmin.onclick = () => { closeSheet(); openModal(el.sheetAdmin); loadAdmin(); };
  async function loadAdmin() {
    el.adminBody.textContent = 'Đang tải…';
    try {
      const kit = await getKit(false);
      const [users, g, bill] = await Promise.all([kit.acct.listUsers(), kit.acct.getGoogleConfig().catch(() => null), kit.acct.getBillingConfig().catch(() => null)]);
      renderAdmin(kit, users, g || {}, bill || {});
    } catch (e) { el.adminBody.textContent = 'Không tải được dữ liệu: ' + fbErr(e); }
  }
  function meter(label, used, limit) {
    const w = node('div', 'mt-2');
    const pct = limit > 0 ? Math.min(100, Math.round(used * 100 / limit)) : 0;
    const head = node('div', 'flex justify-between text-sm');
    head.appendChild(node('span', '', label));
    head.appendChild(node('span', 'tabular-nums', limit > 0 ? `${fmtN(used)} / ${fmtN(limit)} (${pct}%)` : `${fmtN(used)} (chưa đặt hạn mức)`));
    w.appendChild(head);
    const track = node('div', 'mt-1 h-2 w-full overflow-hidden rounded bg-slate-200');
    const fill = node('div', 'h-2');
    fill.style.width = pct + '%';
    fill.style.background = pct >= 100 ? '#dc2626' : pct >= 80 ? '#d97706' : '#0d4792';
    track.appendChild(fill); w.appendChild(track);
    return w;
  }
  function renderAdmin(kit, users, g, bill) {
    const body = el.adminBody;
    body.textContent = '';
    const m = monthKey();
    const sum = k => users.reduce((a, u) => a + ((u.usage && u.usage[m] && u.usage[m][k]) || 0), 0);

    // 1) Hạn mức Google
    body.appendChild(node('h3', 'mt-1 text-sm font-semibold', 'Hạn mức Google tháng này'));
    body.appendChild(meter('Google Cloud Translation (ký tự)', sum('tr'), g.trLimit || 0));
    body.appendChild(meter('Giọng Google WaveNet (ký tự)', sum('tts'), g.ttsLimit == null ? 4000000 : g.ttsLimit));
    body.appendChild(node('p', 'mt-1 text-xs text-slate-500', 'Số liệu cộng từ các thiết bị VIP tự báo, chỉ mang tính tham khảo (thiết bị không báo được thì không tính). Số liệu chính xác và tiền thực tế xem tại Google Cloud Console → Billing và APIs & Services → Quotas. Ưu đãi miễn phí của Translation tính theo tín dụng hằng tháng, không phải số ký tự cố định, nên hạn mức dịch do bạn tự đặt.'));
    const form = node('div', 'mt-2 rounded-lg border border-slate-200 p-3');
    const mkInput = (label, type, val, ph) => {
      form.appendChild(node('label', 'mt-2 block text-sm first:mt-0', label));
      const i = node('input', 'mt-1 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2'); i.type = type; i.value = val; if (ph) i.placeholder = ph; i.autocomplete = 'off';
      form.appendChild(i); return i;
    };
    const inTr = mkInput('Hạn mức dịch mỗi tháng (ký tự, 0 = chưa đặt)', 'number', String(g.trLimit || 0));
    const inTts = mkInput('Hạn mức giọng đọc mỗi tháng (ký tự)', 'number', String(g.ttsLimit == null ? 4000000 : g.ttsLimit));
    const inKey = mkInput('Khóa Google dùng chung cho VIP (Translation + Text-to-Speech)', 'password', '', g.key ? 'Đã lưu. Nhập khóa mới để thay thế' : 'Dán API key (AIza…)');
    form.appendChild(node('p', 'mt-1 text-xs text-slate-500', 'Khóa chỉ được máy chủ trả cho quản trị viên và VIP còn hạn. Nên giới hạn khóa theo tên miền và theo API trong Google Cloud Console, và đổi khóa khi có người hết hạn.'));
    const save = node('button', 'mt-3 w-full rounded-xl bg-brand-600 py-2 text-sm font-medium text-white', 'Lưu hạn mức và khóa');
    save.type = 'button';
    save.onclick = async () => {
      save.disabled = true;
      try {
        await kit.acct.saveGoogleConfig({ key: inKey.value.trim() || g.key || '', trLimit: Math.max(0, parseInt(inTr.value, 10) || 0), ttsLimit: Math.max(0, parseInt(inTts.value, 10) || 0), userTr: g.userTr || 0, userTts: g.userTts || 0 });
        toast('Đã lưu'); loadAdmin(); // cấu hình được theo dõi trực tiếp nên áp dụng ngay
      } catch (e) { toast(fbErr(e)); save.disabled = false; }
    };
    form.appendChild(save);
    body.appendChild(form);

    // 1b) Gói Google Cloud của bạn: tín dụng, thời hạn, ước tính đã dùng
    const B = {
      creditUsd: bill.creditUsd == null ? 300 : bill.creditUsd, vndPerUsd: bill.vndPerUsd == null ? 25970 : bill.vndPerUsd,
      trialEndMs: bill.trialEndMs == null ? Date.parse('2027-01-08T00:00:00') : bill.trialEndMs,
      trPrice: bill.trPrice == null ? 20 : bill.trPrice, ttsPrice: bill.ttsPrice == null ? 4 : bill.ttsPrice, ttsFree: bill.ttsFree == null ? 4000000 : bill.ttsFree
    };
    const months = {};
    for (const u of users) for (const [mk, v] of Object.entries(u.usage || {})) { const t = months[mk] || (months[mk] = { tr: 0, tts: 0 }); t.tr += (v && v.tr) || 0; t.tts += (v && v.tts) || 0; }
    let spent = 0;
    for (const v of Object.values(months)) spent += v.tr * B.trPrice / 1e6 + Math.max(0, v.tts - B.ttsFree) * B.ttsPrice / 1e6;
    const remain = Math.max(0, B.creditUsd - spent);
    const trialDays = B.trialEndMs > Date.now() ? daysLeft(B.trialEndMs) : 0;
    const usd = v => '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const vnd = v => '₫' + Math.round(v * B.vndPerUsd).toLocaleString('vi-VN');
    body.appendChild(node('h3', 'mt-5 text-sm font-semibold', 'Gói Google Cloud của bạn'));
    const plan = node('div', 'mt-2 rounded-lg border border-slate-200 p-3 text-sm');
    const prow = (label, val, warnRow) => { const r = node('div', 'flex justify-between gap-2 py-0.5'); r.appendChild(node('span', 'text-slate-600', label)); const v = node('span', 'text-right font-medium tabular-nums' + (warnRow ? ' text-red-600' : ''), val); r.appendChild(v); plan.appendChild(r); };
    prow('Tín dụng dùng thử', `${usd(B.creditUsd)} ≈ ${vnd(B.creditUsd)}`);
    prow('Ước tính đã dùng (theo số liệu VIP báo về)', `${usd(spent)} ≈ ${vnd(spent)}`);
    prow('Ước tính còn lại', `${usd(remain)} ≈ ${vnd(remain)}`, remain < B.creditUsd * 0.2);
    prow('Hết hạn dùng thử', `${fmtDay(B.trialEndMs)}${trialDays ? ` (còn ${trialDays} ngày)` : ' (đã hết hạn)'}`, trialDays <= 14);
    plan.appendChild(meter('Tín dụng đã dùng, ước tính (USD)', Math.round(Math.min(spent, B.creditUsd) * 100) / 100, B.creditUsd));
    body.appendChild(plan);
    body.appendChild(node('p', 'mt-1 text-xs text-slate-500', 'Ước tính dựa trên số ký tự các thiết bị VIP tự báo và đơn giá bạn nhập bên dưới, nên chỉ để tham khảo; không gồm các khoản khác trong dự án. Số liệu thật xem tại Google Cloud Console → Billing → Overview/Reports. Khi hết thời hạn dùng thử, Google dừng tài nguyên nếu bạn chưa nâng cấp lên tài khoản trả phí; hãy nâng cấp và đặt Budget alert trước ngày đó.'));
    const bf = node('div', 'mt-2 rounded-lg border border-slate-200 p-3');
    const mkB = (label, type, val, step) => {
      bf.appendChild(node('label', 'mt-2 block text-sm first:mt-0', label));
      const i = node('input', 'mt-1 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2'); i.type = type; i.value = val; if (step) i.step = step; i.autocomplete = 'off';
      bf.appendChild(i); return i;
    };
    const bCredit = mkB('Tín dụng dùng thử (USD)', 'number', String(B.creditUsd), 'any');
    const bRate = mkB('Tỷ giá quy đổi (đồng cho 1 USD)', 'number', String(B.vndPerUsd), 'any');
    const bEnd = mkB('Ngày hết hạn dùng thử', 'date', new Date(B.trialEndMs).toISOString().slice(0, 10));
    const bTr = mkB('Đơn giá dịch (USD cho 1 triệu ký tự)', 'number', String(B.trPrice), 'any');
    const bTts = mkB('Đơn giá giọng WaveNet (USD cho 1 triệu ký tự)', 'number', String(B.ttsPrice), 'any');
    const bFree = mkB('Giọng WaveNet miễn phí mỗi tháng (ký tự)', 'number', String(B.ttsFree), '1');
    bf.appendChild(node('p', 'mt-1 text-xs text-slate-500', 'Các giá trị mặc định (300 USD, 89 ngày, đơn giá 20 và 4 USD, 4 triệu ký tự miễn phí) lấy theo trang Billing của bạn và bảng giá tra cứu được, chưa được xác minh đầy đủ: hãy đối chiếu với Google Cloud Console rồi chỉnh nếu khác. Ưu đãi miễn phí hằng tháng của Translation (nếu có) chưa được tính, nên ước tính nghiêng về phía thận trọng.'));
    const bSave = node('button', 'mt-3 w-full rounded-xl border border-brand-600 py-2 text-sm font-medium text-brand-600', 'Lưu thông tin gói Google Cloud');
    bSave.type = 'button';
    bSave.onclick = async () => {
      bSave.disabled = true;
      const end = Date.parse(bEnd.value + 'T00:00:00');
      try {
        await kit.acct.saveBillingConfig({ creditUsd: Math.max(0, +bCredit.value || 0), vndPerUsd: Math.max(1, +bRate.value || 1), trialEndMs: isNaN(end) ? B.trialEndMs : end, trPrice: Math.max(0, +bTr.value || 0), ttsPrice: Math.max(0, +bTts.value || 0), ttsFree: Math.max(0, parseInt(bFree.value, 10) || 0) });
        toast('Đã lưu thông tin gói'); loadAdmin();
      } catch (e) { toast(fbErr(e)); bSave.disabled = false; }
    };
    bf.appendChild(bSave);
    body.appendChild(bf);

    // 1c) Giới hạn ký tự mỗi tài khoản VIP + gợi ý
    body.appendChild(node('h3', 'mt-5 text-sm font-semibold', 'Giới hạn mỗi tài khoản VIP (mỗi tháng)'));
    const uf = node('div', 'mt-2 rounded-lg border border-slate-200 p-3');
    const mkU = (label, val) => {
      uf.appendChild(node('label', 'mt-2 block text-sm first:mt-0', label));
      const i = node('input', 'mt-1 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2'); i.type = 'number'; i.min = '0'; i.step = '10000'; i.value = String(val); i.autocomplete = 'off';
      uf.appendChild(i); return i;
    };
    const uTr = mkU('Dịch bằng Google (ký tự mỗi VIP mỗi tháng, 0 = không giới hạn)', g.userTr || 0);
    const uTts = mkU('Đọc bằng giọng WaveNet (ký tự mỗi VIP mỗi tháng, 0 = không giới hạn)', g.userTts || 0);
    uf.appendChild(node('label', 'mt-3 block text-sm', 'Số tài khoản VIP dự kiến để tính gợi ý'));
    const nVip = node('input', 'mt-1 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2'); nVip.type = 'number'; nVip.min = '1'; nVip.step = '1';
    nVip.value = String(Math.max(5, users.filter(u => effStatus(u) === 'active').length));
    uf.appendChild(nVip);
    const sug = node('p', 'mt-2 rounded-lg bg-slate-50 p-2 text-xs text-slate-700');
    uf.appendChild(sug);
    let cur = { tr: 0, tts: 0 };
    const recalc = () => {
      const n = Math.max(1, parseInt(nVip.value, 10) || 1);
      const monthsLeft = Math.max(1, Math.ceil(trialDays / 30));
      const perUser = remain * 0.8 / monthsLeft / n;           // chừa 20% dự phòng
      const perMillion = B.trPrice + 2 * B.ttsPrice;           // giả định mỗi ký tự dịch kèm đọc gấp đôi số ký tự
      const tr = Math.max(0, Math.floor(perUser / perMillion * 1e6 / 10000) * 10000);
      cur = { tr, tts: tr * 2 };
      const worst = n * (parseInt(uTr.value, 10) || 0) * B.trPrice / 1e6 + n * (parseInt(uTts.value, 10) || 0) * B.ttsPrice / 1e6;
      sug.textContent = `Gợi ý: còn ${usd(remain)}, dành 80% (${usd(remain * 0.8)}) cho khoảng ${monthsLeft} tháng còn lại của gói, chia cho ${n} VIP ≈ ${usd(perUser)} mỗi VIP mỗi tháng. ` +
        `Với đơn giá hiện tại và giả định đọc gấp đôi số ký tự dịch: dịch ${fmtN(cur.tr)} ký tự, đọc ${fmtN(cur.tts)} ký tự mỗi VIP mỗi tháng. ` +
        `Nếu mọi VIP dùng hết giới hạn đang nhập: tối đa ≈ ${usd(worst)} mỗi tháng (${vnd(worst)}), chưa trừ phần WaveNet miễn phí.`;
    };
    [nVip, uTr, uTts].forEach(i => i.addEventListener('input', recalc));
    recalc();
    const row = node('div', 'mt-2 flex gap-2');
    const apply = node('button', 'flex-1 rounded-lg border border-slate-300 py-2 text-sm', 'Áp dụng gợi ý vào ô nhập'); apply.type = 'button';
    apply.onclick = () => { uTr.value = String(cur.tr); uTts.value = String(cur.tts); recalc(); };
    const uSave = node('button', 'flex-1 rounded-lg bg-brand-600 py-2 text-sm font-medium text-white', 'Lưu giới hạn mỗi VIP'); uSave.type = 'button';
    uSave.onclick = async () => {
      uSave.disabled = true;
      try {
        await kit.acct.saveGoogleConfig({ key: g.key || '', trLimit: g.trLimit || 0, ttsLimit: g.ttsLimit == null ? 4000000 : g.ttsLimit, userTr: Math.max(0, parseInt(uTr.value, 10) || 0), userTts: Math.max(0, parseInt(uTts.value, 10) || 0) });
        toast('Đã lưu giới hạn mỗi VIP'); loadAdmin();
      } catch (e) { toast(fbErr(e)); uSave.disabled = false; }
    };
    row.appendChild(apply); row.appendChild(uSave); uf.appendChild(row);
    uf.appendChild(node('p', 'mt-2 text-xs text-slate-500', 'Giới hạn tính theo số liệu hồ sơ trên máy chủ (gộp mọi thiết bị của cùng tài khoản). Khi hết giới hạn, ứng dụng của VIP tự chuyển sang MyMemory (dịch) hoặc giọng thiết bị (đọc). Quản trị viên không bị giới hạn. Việc áp dụng do ứng dụng trên thiết bị thực hiện nên chỉ là giới hạn "mềm", người rành kỹ thuật có thể vượt qua.'));
    body.appendChild(uf);

    // 2) Danh sách tài khoản
    const counts = { pending: 0, active: 0, expired: 0, blocked: 0 };
    users.forEach(u => counts[effStatus(u)]++);
    if (!adminFilter) adminFilter = counts.pending ? 'pending' : 'all';
    body.appendChild(node('h3', 'mt-5 text-sm font-semibold', `Tài khoản (${users.length})`));
    const bar = node('div', 'mt-2 flex flex-wrap gap-1.5');
    const chips = [['pending', `Chờ duyệt (${counts.pending})`], ['active', `Đang hoạt động (${counts.active})`], ['expired', `Hết hạn (${counts.expired})`], ['blocked', `Bị khóa (${counts.blocked})`], ['all', 'Tất cả']];
    for (const [k, label] of chips) {
      const b = node('button', 'rounded-full border px-2.5 py-1 text-xs ' + (adminFilter === k ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 text-slate-700'), label);
      b.type = 'button'; b.onclick = () => { adminFilter = k; renderAdmin(kit, users, g, bill); };
      bar.appendChild(b);
    }
    const reload = node('button', 'rounded-full border border-slate-300 px-2.5 py-1 text-xs text-slate-700', 'Tải lại'); reload.type = 'button'; reload.onclick = loadAdmin;
    bar.appendChild(reload);
    body.appendChild(bar);

    const act = async (fn, okMsg) => { try { await fn(); toast(okMsg); loadAdmin(); } catch (e) { toast(fbErr(e)); } };
    const list = users.filter(u => adminFilter === 'all' || effStatus(u) === adminFilter)
      .sort((a, b) => (b.requestedAt || 0) - (a.requestedAt || 0));
    if (!list.length) body.appendChild(node('p', 'mt-3 text-sm text-slate-500', 'Không có tài khoản nào trong mục này.'));
    for (const u of list) {
      const st = effStatus(u);
      const card = node('div', 'mt-2 rounded-xl border border-slate-200 p-3');
      const top = node('div', 'flex items-start justify-between gap-2');
      const who = node('div', 'min-w-0');
      who.appendChild(node('div', 'truncate text-sm font-semibold', u.name || '(chưa có tên)'));
      who.appendChild(node('div', 'truncate text-xs text-slate-500', u.email));
      top.appendChild(who);
      const badge = node('span', 'shrink-0 text-xs font-medium', STATUS_VI[st]); badge.style.color = STATUS_COLOR[st];
      top.appendChild(badge); card.appendChild(top);
      const use = (u.usage && u.usage[m]) || {};
      const lines = [];
      if (u.expiresAtMs) lines.push(`Hạn: ${fmtDay(u.expiresAtMs)}${st === 'active' ? ` (còn ${daysLeft(u.expiresAtMs)} ngày)` : ''}`);
      lines.push(`Tháng này: dịch ${fmtN(use.tr || 0)} · đọc ${fmtN(use.tts || 0)} ký tự`);
      if (u.requestedAt) lines.push(`Đăng ký: ${fmtDay(u.requestedAt)}`);
      if (u.lastSeen) lines.push(`Dùng gần nhất: ${fmtDay(u.lastSeen)}`);
      card.appendChild(node('div', 'mt-1 text-xs text-slate-600', lines.join(' · ')));
      const idr = node('div', 'mt-1 break-all text-[0.6875rem] text-slate-400', 'Mã: ' + u.uid); card.appendChild(idr);
      const acts = node('div', 'mt-2 flex flex-wrap gap-1.5');
      const btn = (label, primary, fn) => { const b = node('button', 'rounded-lg px-2.5 py-1 text-xs font-medium ' + (primary ? 'bg-brand-600 text-white' : 'border border-slate-300 text-slate-700'), label); b.type = 'button'; b.onclick = fn; acts.appendChild(b); };
      if (st === 'pending') btn('Duyệt 1 tháng', true, () => act(() => kit.acct.setUser(u.uid, { status: 'active', expiresAtMs: addMonth(Date.now()), plan: planName() }), 'Đã duyệt 1 tháng'));
      if (st === 'active' || st === 'expired') btn('Gia hạn +1 tháng', true, () => act(() => kit.acct.setUser(u.uid, { status: 'active', expiresAtMs: addMonth(Math.max(Date.now(), u.expiresAtMs || 0)), plan: planName() }), 'Đã gia hạn 1 tháng'));
      if (st !== 'blocked') btn('Khóa', false, () => act(() => kit.acct.setUser(u.uid, { status: 'blocked' }), 'Đã khóa tài khoản'));
      else btn('Mở khóa (về chờ duyệt)', false, () => act(() => kit.acct.setUser(u.uid, { status: 'pending' }), 'Đã mở khóa'));
      btn('Xóa', false, () => { if (confirm(`Xóa hồ sơ của ${u.email}? Người này sẽ phải đăng ký lại.`)) act(() => kit.acct.deleteUser(u.uid), 'Đã xóa hồ sơ'); });
      card.appendChild(acts);
      body.appendChild(card);
    }
  }

  {
    const plan = (CFG.plans || []).find(p => p && p.name);
    el.gatePlan.textContent = plan ? `Gói VIP: ${plan.name}${plan.price ? ' · ' + plan.price : ''}. Đăng ký tài khoản, thanh toán và chờ quản trị viên cấp quyền.` : '';
  }
  applyAcct();
  if (store.get('acct', '') === 'vip' && !noViewerGate()) watchAccount().catch(() => {}); // khôi phục phiên VIP và theo dõi hồ sơ
  if (!state.acct && !noViewerGate()) openGate('login');

  const coCode = new URLSearchParams(location.search).get('co');
  if (viewerRoomId && coCode) startCohost(viewerRoomId, coCode);
  else if (viewerRoomId) startViewer(viewerRoomId);
  else resumeRoom();
})();
