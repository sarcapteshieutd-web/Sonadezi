# SURVEY – Khảo sát mã nguồn cho Mức 1 (bắt chữ khi thu một ngôn ngữ trong chế độ Họp)

- **Vai thực hiện:** A2 – Khảo sát (`Antigravity/Gemini 4 Neon`)
- **Đầu vào:** `.agents/PLAN.md` (commit `895321c`) và quyết định của anh Hiếu ngày 24/11/2026: **chỉ làm Mức 1**, đồng ý đổi mặc định `minConfidence` từ `0.3` → `0` (áp dụng cả chế độ Hội thoại); **không** làm Mức 2/Mức 3; **không** chạm Google Cloud STT (`translator/stt-cloud.js`).
- **Nhánh & worktree:** nhánh `sonadezilongthanh/fix/meeting-transcription-2`, worktree `C:/Users/hieunn/orca/workspaces/Sonadezi/fix-meeting-transcription-2` (tách từ `claude/realtime-translation-app-68o1ik` tại `03851d1`).
- **Kết quả kiểm tra mốc hiện tại (chỉ đọc):**
  - `node cong-cu/kiem-tra-dich.js`: mã thoát `0`, **`KIEM TRA TU DONG: DAT`** — kiểm tra 21 tệp JS, 2 tệp HTML trong `translator/`; kiểm thử đơn vị **`67/67 đạt (6 tệp)`**; 1 cảnh báo `[PHAM VI]` cho `.agents/PLAN.md` (do danh sách trắng của công cụ chưa có `.agents/`).

---

## 1. Hiện trạng mã nguồn theo từng điểm sửa của Mức 1

### 1.1. `minConfidence` và hàm lọc `heard()` (G1)

| Thành phần | Tệp và dòng | Nội dung hiện tại |
|---|---|---|
| Giá trị mặc định | `translator/config.js:14–16` | `window.APP_CONFIG.recognition.minConfidence: 0.3` (kèm chú thích dòng 15: "Đặt 0 để tắt"). |
| Nơi đọc cấu hình | `translator/app.js:953–954` | `const RCFG = (window.APP_CONFIG && window.APP_CONFIG.recognition) || {};`<br>`const MIN_CONF = typeof RCFG.minConfidence === 'number' ? RCFG.minConfidence : 0;` |
| Nơi lọc độ tin cậy | `translator/app.js:972–978` | `function heard(result)` kiểm tra `if (result.isFinal && alt.confidence > 0)` → `if (MIN_CONF > 0 && alt.confidence < MIN_CONF) return '';`, ngược lại trả `alt.transcript`. Chưa gọi `micLog(...)` khi bỏ câu. |
| Nơi gọi `heard()` #1 (Hội thoại) | `translator/app.js:1048` | Trong `rec.onresult` (khi `!state.meeting`): `for (let i = 0; i < ev.results.length; i++) text += heard(ev.results[i]);` — duyệt lại **từ chỉ số `0`** trên mỗi sự kiện `onresult`. |
| Nơi gọi `heard()` #2 (Họp/Hội nghị/Biên bản) | `translator/app.js:1425` | Trong `onMeetingResult(ev)`: `const t = applyGlossary(heard(r).trim());` — duyệt từ `ev.resultIndex` (`app.js:1423`). |
| Cờ ngôn ngữ có dấu cách (`sp`) | `translator/app.js:7–26` | `LANGS[k].sp`: `false` cho `zh` (dòng 11), `zht` (dòng 12), `ja` (dòng 13), `th` (dòng 15); **`true` cho `ko` (dòng 14)** và các ngôn ngữ còn lại (`en`, `vi`, `fr`, `de`, `es`, `pt`, `it`, `ru`, `ar`, `hi`, `id`, `ms`). |
| Tài liệu hướng dẫn | `translator/HUONG-DAN.md:184–190` | Mục 12 đang ghi `minConfidence (0–1, mặc định 0,3)` và mô tả `glossary`. |

### 1.2. Luồng Web Speech final / interim và bộ đệm câu `utt` trong `translator/app.js`

- **Biến trạng thái liên quan:**
  - `state.meeting` (`app.js:121`), `state.incr` (`app.js:124`, mặc định `true`), `state.cutMs` (`app.js:125`, mặc định `0`), `state.meetingSpeak` (`app.js:127`), `state.speaking` (`app.js:128`), `state.autoTurn` (`app.js:129`), `state.conf` (`app.js:130`), `state.viMain` (`app.js:131`), `state.minutes` (`app.js:132`), `state.cloudActive` (`app.js:112`), `state.reading` (`app.js:112`).
  - `SR`, `rec`, `committed`, `wantListening`, `lastNetError`, `silenceTimer` (`app.js:981–986`); `micFail`, `sessionStartAt`, `MIC_MAX_FAIL = 6` (`app.js:1032–1033`).
  - `newUtt()` / `utt` / `resetUtt()` (`app.js:1204–1207`): `utt` giữ `{ consumed, parts, results, lastText, tLast, forced, timer, tail: { text, done, result, seq, at, timer } }`. `resetUtt()` hủy cả `utt.timer` và `utt.tail.timer` rồi tạo đối tượng rỗng mới.
- **Khởi tạo phiên nghe `beginSession()` (`app.js:1034–1101`):**
  - Tạo `rec = new SR()`, đặt `utt.forced = ''` (`app.js:1036`), `rec.lang = sttLocale(state.src)`, `continuous = true`, `interimResults = true`, `maxAlternatives = 1`.
  - `rec.onstart` (`app.js:1043`): ghi `sessionStartAt`, đặt `state.micGaveUp = false`, `setListeningUI(true)`.
  - `rec.onresult` (`app.js:1045–1056`): nếu `state.meeting` thì rẽ vào `onMeetingResult(ev)` (dòng 1046); nếu chế độ Hội thoại thì ghép toàn bộ `ev.results[0..n-1]` qua `heard()`, nối `committed`, cập nhật `el.src.value`, `translateDebounced()` và đặt `silenceTimer` (`SILENCE_MS = 1200`, gọi `stopListening_andTranslate`).
  - `rec.onerror` (`app.js:1058–1080`): giữ cuộc họp khi `network`/`audio-capture` (tăng `micFail`), dừng `wantListening` khi `not-allowed`/`service-not-allowed`.
  - `rec.onend` (`app.js:1082–1098`): hiện chỉ ghi `committed = el.src.value.trim()` (dòng 1085, dùng cho Hội thoại), kiểm tra `micFail >= MIC_MAX_FAIL` (dòng 1087–1090), hoặc đặt `setTimeout(..., delay)` để gọi `beginSession()` (dòng 1091–1094), hoặc gọi `finish()` (dòng 1096). **Chưa chốt `utt.lastText` khi `state.meeting`.**
- **Xử lý kết quả trong chế độ Họp `onMeetingResult(ev)` (`app.js:1418–1440`):**
  - Nếu `state.speaking` thì bỏ qua (dòng 1420).
  - Duyệt `i = ev.resultIndex .. ev.results.length - 1` (dòng 1423–1427): gọi `t = applyGlossary(heard(r).trim())`; nếu `r.isFinal` thì gọi `commitFinal(t)` (nếu trả `true` thì đặt `gotFinal = true`), ngược lại cộng dồn vào `interim`.
  - Nếu có `utt.forced && interim`, cắt bỏ phần đã chốt sớm bằng `stripForced(interim, utt.forced)` (dòng 1428).
  - Gán `el.src.value = interim; updateCounter();` (dòng 1429–1430).
  - Khi `interim && !gotFinal` (dòng 1431–1437): cập nhật `utt.lastText = interim; utt.tLast = Date.now();`, chạy dịch tăng dần `incrementalStep(interim)` nếu bật `state.incr` và không phải Biên bản / `viMain`, và hẹn giờ `utt.timer = setTimeout(forceCommit, cut)` nếu `state.cutMs > 0`.
  - Khi `gotFinal && state.autoTurn && !state.minutes` (dòng 1439): gọi `setLangs(state.tgt, state.src, false)`.
- **Chốt câu sớm và chốt câu cuối:**
  - `forceCommit()` (`app.js:1277–1287`): lấy `text = utt.lastText.trim()`; nếu `!text || !state.meeting` thì thoát; gọi `queueMeeting(text, snapshotUtt())`; lưu `prev = utt.forced`; gọi `resetUtt()` (xóa `utt.lastText`, hủy `utt.timer` và `utt.tail.timer`); cập nhật `utt.forced` để khử trùng phần đã chốt sớm; xóa `el.src.value`, `el.out.textContent`, gọi `updateCounter()`.
  - `commitFinal(f)` (`app.js:1288–1299`): nếu có `utt.forced` thì gọi `stripForced(f, utt.forced)` — nếu rỗng thì `resetUtt(); return false;` (bỏ câu trùng), nếu khác `null` thì chỉ lấy phần đuôi mới; gọi `queueMeeting(...)`, `resetUtt()`, xóa `el.out.textContent`, trả `true`.
  - `queueMeeting(text, pre, fromArg, toArg)` (`app.js:1128–1158`): khử lặp trong 4 giây khi `!fromArg && text === lastMeetingText && now - lastMeetingAt < 4000` (dòng 1130); đọc `from = fromArg || state.src, to = toArg || state.tgt` **ngay tại lúc gọi** (dòng 1132); đẩy tác vụ dịch/ghi lịch sử vào `meetingChain`; nếu cần đọc bản dịch thì gọi `enqueueSpeech(out, to, histItem)` (dòng 1156).
- **Tạm nghỉ micro khi đọc `drainSpeech()` (`app.js:1370–1408`) và `refreshSession()` (`app.js:1410–1416`):**
  - Nhánh Hội nghị (`state.conf`, dòng 1374–1391): micro vẫn mở trong lúc đọc; `finally` gọi `refreshSession()` (dòng 1389) — hàm `refreshSession()` **đã** gỡ `rec.onend = null; rec.onresult = null; rec.abort()` rồi gọi `if (utt.lastText && utt.lastText.trim()) forceCommit()` (dòng 1411–1412) trước khi hẹn `beginSession()` sau 150 ms (dòng 1415).
  - Nhánh Họp thường (`!state.conf`, dòng 1393–1407): đặt `setSpeakingUI(true)`; nếu `state.cloudActive` gọi `CloudSTT.pause()`, ngược lại `rec.onend = null; rec.abort()` (dòng 1396) rồi xóa `el.src.value = ''` (dòng 1397) mà **chưa gọi `forceCommit()`** và chưa gỡ `rec.onresult = null`. Khi đọc xong (`finally`, dòng 1406) gọi `CloudSTT.resume()` hoặc `beginSession()`.
- **Đổi ngôn ngữ / đổi người nói `setLangs(s, t, swapText)` (`app.js:233–248`):**
  - Dòng 234–237: nếu `wasMeeting` thì gọi `resetUtt(); if (rec) { rec.onend = null; try { rec.abort(); } catch (_) {} }` (dòng 235) — **chưa chốt `utt.lastText` trước `resetUtt()`** và chưa gỡ `rec.onresult = null`; nếu không phải họp mà đang nghe thì `stopListening()`. Sau đó gọi `archiveTurn()` (dòng 237), đổi `state.src = s; state.tgt = t;` (dòng 238–239), đồng bộ UI, rồi khởi động lại Cloud hoặc gọi `beginSession()` nếu `!state.speaking` (dòng 242–247).

---

## 2. Toàn bộ nơi gọi các hàm liên quan trong `translator/app.js`

| Hàm | Định nghĩa | Tất cả nơi gọi (tệp:dòng — ngữ cảnh) |
|---|---|---|
| `heard` | `app.js:972–978` | 1. `app.js:1048` (`rec.onresult` — chế độ Hội thoại, lặp `i = 0..n-1`)<br>2. `app.js:1425` (`onMeetingResult` — chế độ Họp/Hội nghị/Biên bản, lặp từ `ev.resultIndex`) |
| `forceCommit` | `app.js:1277–1287` | 1. `app.js:1412` (`refreshSession`, sau khi đọc ở chế độ Hội nghị)<br>2. `app.js:1436` (`onMeetingResult`, hẹn giờ `utt.timer` khi `state.cutMs > 0`) |
| `commitFinal` | `app.js:1288–1299` | 1. `app.js:1426` (`onMeetingResult`, khi `r.isFinal && t`) |
| `drainSpeech` | `app.js:1370–1408` | 1. `app.js:1360` (`enqueueSpeech`, được gọi duy nhất tại `app.js:1156` trong `queueMeeting`) |
| `refreshSession` | `app.js:1410–1416` | 1. `app.js:1389` (`drainSpeech`, khối `finally` của nhánh `state.conf`) |
| `setLangs` | `app.js:233–248` | 1. `app.js:1439` (`onMeetingResult`, tự đổi lượt `autoTurn`)<br>2. `app.js:1579` (`fallbackToBrowser`, rời Cloud STT về Web Speech)<br>3. `app.js:1697` (phím `Space` khi đang họp, `!state.minutes`)<br>4. `app.js:1842` (`endMinutes`, sau `stopMeeting`, `state.meeting === false`)<br>5. `app.js:1876` (`mi.start.onclick`, trước `startMeeting`, `state.meeting === false`)<br>6. `app.js:1884` (`mi.start.onclick` hoàn lại khi `!startMeeting()`)<br>7. `app.js:2009` (`el.selSrc.onchange`, chọn ngôn ngữ nguồn)<br>8. `app.js:2014` (`el.selTgt.onchange`, chọn ngôn ngữ đích)<br>9. `app.js:2017` (`el.btnSwap.onclick`, bấm nút ⇄) |
| `beginSession` | `app.js:1034–1101` | 1. `app.js:247` (`setLangs`, khi `wasMeeting && !state.speaking`)<br>2. `app.js:1014` (`startListening`, Hội thoại)<br>3. `app.js:1094` (`rec.onend`, tự mở lại sau `delay`)<br>4. `app.js:1406` (`drainSpeech`, sau khi đọc xong)<br>5. `app.js:1415` (`refreshSession`, sau 150 ms)<br>6. `app.js:1569` (`restartCloud`, khi không dùng Cloud)<br>7. `app.js:1580` (`fallbackToBrowser`, khi không đổi hướng)<br>8. `app.js:1618` (`el.chkBilingual.onchange`, tắt song ngữ)<br>9. `app.js:1632` (`el.btnReopenMic.onclick`, Mở lại micro)<br>10. `app.js:1658` (`startMeeting`, khi `!useCloud`) |
| `rec.onend` (kích hoạt gián tiếp qua `rec.abort`/`rec.stop` không gỡ `onend`) | `app.js:1082–1098` | 1. Trình duyệt tự kết thúc phiên (hết ~60 giây, `no-speech`, `network`, `audio-capture`)<br>2. `app.js:2035` (`stopListening_andTranslate`, Hội thoại — gọi `rec.stop()`, `wantListening = false`)<br>3. `app.js:2134` (`el.selSrcAcc.onchange`, đổi vùng giọng nói — gọi `rec.abort()` khi `wantListening` để tự mở lại phiên)<br>*(Các nơi khác: `setLangs:235`, `stopListening:1116`, `drainSpeech:1396`, `refreshSession:1411`, `startCloud:1549`, `stopMeeting:1675` đều gán `rec.onend = null` trước khi dừng.)* |

---

## 3. Service Worker (`translator/service-worker.js`) và cách nạp script (`translator/index.html`)

### 3.1. `translator/service-worker.js`
- **Hằng phiên bản cache (dòng 5):** `const CACHE = 'translator-v87';` → A3 phải tăng lên `'translator-v88'`.
- **Danh sách `CORE` (dòng 6–13, hiện 30 mục):**
  - Dòng 7: `'./'`, `'./index.html'`, `'./app.js'`, `'./dialogs.js'`, `'./find.js'`, `'./stt-cloud.js'`, `'./report.js'`, `'./lang-guess.js'`, `'./captions.js'`, `'./presets.js'`, `'./config.js'`, `'./donate-qr.jpg'`, `'./styles.css'`, `'./ui.css'`, `'./fonts.css'`
  - Dòng 8–9: 8 tệp phông `.woff2` (`be-vietnam-pro-latin-*`, `be-vietnam-pro-vietnamese-*`) + `'./manifest.json'`
  - Dòng 10–12: 6 tệp biểu tượng `.png` (`icon-192`, `icon-512`, `icon-512-maskable`, `apple-touch-icon`, `logo-mark`, `logo-full`)
- **Cần thêm cho Mức 1:** thêm `'./stt-browser.js'` vào mảng `CORE` (ngay cạnh `'./stt-cloud.js'` ở dòng 7).

### 3.2. Cách nạp script trong `translator/index.html`
- Dòng 694–702 (cuối `<body>`, thẻ `<script>` đồng bộ cổ điển, không `defer`/`module`):
  ```html
  694:   <script src="config.js"></script>
  695:   <script src="stt-cloud.js"></script>
  696:   <script src="report.js"></script>
  697:   <script src="lang-guess.js"></script>
  698:   <script src="captions.js"></script>
  699:   <script src="presets.js"></script>
  700:   <script src="app.js"></script>
  701:   <script src="dialogs.js"></script>
  702:   <script src="find.js"></script>
  ```
- **Cần thêm cho Mức 1:** chèn `<script src="stt-browser.js"></script>` **trước** `<script src="app.js"></script>` (nên đặt ngay sau dòng 695 `stt-cloud.js`).
- **Quy ước module thuần hiện có** (xem `translator/lang-guess.js:2–56`, `translator/captions.js:2–34`, `translator/presets.js:2–20`): bọc IIFE `(function (root) { 'use strict'; ... if (typeof module !== 'undefined' && module.exports) module.exports = api; root.BrowserSTT = api; })(typeof window !== 'undefined' ? window : globalThis);`. Trong `app.js`, nên kiểm tra phòng thủ `window.BrowserSTT` giống cách dùng `window.LangGuess` (`app.js:546, 2021`) và `window.Captions` (`app.js:1967, 1971`).

---

## 4. Kiểm thử hiện có trong `translator/tests/`

Tổng hiện tại: **6 tệp, 67 phép thử** (`node:test` + `node:assert/strict`), đều đạt qua `node cong-cu/kiem-tra-dich.js`:
- `captions.test.js` (7 phép thử) — `captions.js`
- `lang-guess.test.js` (9 phép thử) — `lang-guess.js`
- `presets.test.js` (2 phép thử) — `presets.js`
- `report.test.js` (10 phép thử) — `report.js`
- `stt-cloud.test.js` (29 phép thử) — `stt-cloud.js` (VAD, PCM, hạn mức, `speechContexts`, `levelWatch`)
- `stt-recognize.test.js` (10 phép thử) — `stt-cloud.js` (`recognize()` với `fetchImpl` giả lập)

**Chưa có tệp kiểm thử nào cho Web Speech / `minConfidence` / `shouldDropFinal`.** A3 tạo mới `translator/tests/stt-browser.test.js` theo đúng quy ước `node:test`.
*(Lưu ý công cụ trên Windows Node 24: lệnh `node --test translator/tests/` báo `MODULE_NOT_FOUND`; chạy kiểm thử bằng `node cong-cu/kiem-tra-dich.js` hoặc truyền đích danh tệp `node --test translator/tests/stt-browser.test.js`.)*

---

## 5. Rủi ro và trường hợp biên đã phát hiện khi đọc mã (ghi chú cụ thể cho A3)

1. **Rủi ro lớn — `rec.onend` gọi `forceCommit()` kích hoạt `drainSpeech()` trong lúc hẹn giờ `setTimeout(..., delay)` sắp mở lại micro (`app.js:1094`):**
   - Nếu đang bật "Đọc bản dịch ra loa" (`state.meetingSpeak && !state.conf`), `rec.onend` gọi `forceCommit()` → `queueMeeting()` có thể trả kết quả **ngay lập tức** (ví dụ trúng `cache` dịch ở `app.js:612` hoặc dịch xong trong < 250 ms) → `enqueueSpeech()` → `drainSpeech()` đặt `state.speaking = true` và tạm nghỉ micro để đọc.
   - 250 ms sau, callback `setTimeout(() => { if (wantListening) { try { beginSession(); } ... } }, delay)` ở **`app.js:1094`** vẫn chạy vì **chưa kiểm tra `!state.speaking` và `!state.cloudActive`** (khác với `refreshSession()` dòng 1415 vốn có đủ `if (state.meeting && wantListening && !state.cloudActive && !state.speaking)`). Hậu quả: micro bị bật lại ngay khi app đang đọc bản dịch, gây thu ngược tiếng loa!
   - **Khuyến nghị cho A3:** sửa điều kiện trong `setTimeout` ở `app.js:1094` thành `if (wantListening && !state.speaking && !state.cloudActive)` (khi đọc xong, khối `finally` của `drainSpeech()` dòng 1406 sẽ tự gọi `beginSession()`).

2. **Rủi ro ngập nhật ký `micEvents` ở chế độ Hội thoại nếu ghi `micLog` trực tiếp trong `heard()` (`app.js:1048` vs `1423`):**
   - Ở chế độ Hội thoại (`!state.meeting`), `rec.onresult` lặp từ **`i = 0`** đến cuối `ev.results` ở **mỗi sự kiện `onresult`** (`app.js:1048`), không phải từ `ev.resultIndex` như `onMeetingResult` (`app.js:1423`).
   - Nếu người dùng sau này đặt lại `minConfidence > 0` và `heard()` ghi `micLog('bỏ câu độ tin cậy thấp: …')` không điều kiện, cùng một câu final bị bỏ ở chỉ số `i` sẽ bị ghi lặp hàng chục lần trong cùng một lượt nói, đẩy mất lịch sử 60 dòng của `micEvents` (`app.js:1023`).
   - Ngoài ra, nếu `shouldDropFinal` trả `true` cho chuỗi rỗng / toàn khoảng trắng (`PLAN.md` dòng 99), **không** được ghi `micLog('bỏ câu độ tin cậy thấp: …')` khi chuỗi gốc rỗng (chỉ ghi log khi `rawText.trim()` có chữ và bị bỏ do độ tin cậy thấp).
   - **Khuyến nghị cho A3:** chỉ ghi `micLog` cho câu bị bỏ ở luồng Họp (`onMeetingResult`, hoặc truyền cờ `logDrop` vào `heard(r, true)` ở dòng 1425 và `false` ở dòng 1048), và chỉ log khi `transcript.trim()` khác rỗng.

3. **Sai lệch nhỏ về cờ `spaced` của tiếng Hàn (`ko`) giữa `PLAN.md` và `LANGS` (`app.js:14`):**
   - `PLAN.md` dòng 57 ghi "dưới 3 từ, hoặc dưới 4 ký tự với zh/ja/ko", nhưng trong `translator/app.js:11–15`, `LANGS` định nghĩa `sp = false` cho `zh`, `zht`, `ja`, `th`, còn **`ko` có `sp = true`** (vì tiếng Hàn có dấu cách giữa các cụm từ).
   - **Khuyến nghị cho A3:** truyền `LANGS[state.src].sp` vào `shouldDropFinal(text, confidence, minConf, spaced)`. Với `spaced = true` (kể cả `vi`, `en`, `ko`), đếm số từ tách theo khoảng trắng (`< 3` từ); với `spaced = false` (`zh`, `zht`, `ja`, `th`), đếm số ký tự không khoảng trắng (`< 4` ký tự).

4. **Chế độ Hội thoại (`!state.meeting`) khi `minConfidence` đổi từ `0.3` → `0` và khi bật lại lọc:**
   - Với mặc định mới `minConfidence: 0`: cả Hội thoại và Họp đều giữ mọi câu final có chữ (đúng quyết định câu 2 của anh Hiếu ngày 24/11/2026).
   - `rec.onend` (`app.js:1085`) gán `committed = el.src.value.trim()` chỉ dùng cho Hội thoại; cần đặt `if (state.meeting && !state.cloudActive && utt.lastText.trim()) forceCommit();` để **không** tác động chế độ Hội thoại và không chạm Cloud STT.
   - Khi người dùng tự bật lại `minConfidence > 0` trong `config.js`: cần xác định rõ `heard()` dùng `shouldDropFinal` cho cả hai chế độ hay riêng chế độ Họp (theo `PLAN.md` dòng 57: "Khi lọc vẫn bật, chế độ Họp không bỏ câu dài"; áp dụng chung `shouldDropFinal` trong `heard()` cũng an toàn cho Hội thoại vì câu dài ≥ 3 từ hiếm khi là tạp âm, hoặc giữ đúng `state.meeting ? shouldDropFinal(...) : alt.confidence < MIN_CONF` — A3 chọn nhất quán và ghi rõ trong chú thích/test).

5. **Thứ tự thao tác để tránh chốt trùng lặp và gọi `forceCommit()` hai lần:**
   - **Hàm `forceCommit()` (`app.js:1277–1287`) tự an toàn khi gọi lặp:** nó chạy `resetUtt()` đồng bộ tại dòng 1284 (xóa `utt.lastText = ''`, hủy `utt.timer` và `utt.tail.timer`) nên lần gọi thứ hai thấy `utt.lastText.trim() === ''` sẽ thoát ngay.
   - **Trong `setLangs()` (`app.js:235`):** **PHẢI** gọi `forceCommit()` **TRƯỚC** `resetUtt()` và **TRƯỚC** `state.src = s; state.tgt = t;` (vì `queueMeeting` đọc `state.src`/`state.tgt` đồng bộ tại dòng 1132). Đồng thời gỡ cả `rec.onend = null; rec.onresult = null;` trước `rec.abort()`, rồi mới `resetUtt()` để xóa sạch `utt.forced` của ngôn ngữ cũ (tránh `utt.forced` còn tồn nếu `state.speaking` đang `true` và `beginSession()` bị hoãn). Guard `!state.cloudActive` trước `forceCommit()`.
   - **Trong `drainSpeech()` nhánh `!state.conf` (`app.js:1395–1398`):** chỉ chạy cho nhánh `!state.cloudActive`; gỡ `rec.onend = null; rec.onresult = null;` rồi `rec.abort()` trước khi gọi `if (utt.lastText && utt.lastText.trim()) forceCommit();` (khớp mẫu đã kiểm chứng ở `refreshSession()` dòng 1411–1412). Khi `draining === true`, câu chốt mới đẩy vào `meetingChain` → `enqueueSpeech()` sẽ được vòng `while (speechQueue.length && state.meeting)` hiện tại đọc nối tiếp, không gây đệ quy `drainSpeech()`.
   - **Trong `archiveTurn()` (`app.js:251–255`):** gọi sau bước chốt ở `setLangs()` dòng 237; vì chế độ Họp không gán `state.translated` và `forceCommit()` đã xóa `el.src.value = ''`, nên `archiveTurn()` **không** ghi trùng tin vào lịch sử.
   - **Trong `stopMeeting()` (`app.js:1663–1677`):** đã gán `rec.onend = null` trước `rec.stop()`, nên không bị trùng với `rec.onend`.
   - **Biên lưu ý ở `onMeetingResult` (`app.js:1431`):** khi một sự kiện `onresult` chứa đồng thời cả `isFinal` và phần `interim` kế tiếp, dòng 1431 có điều kiện `if (interim && !gotFinal)` nên `utt.lastText` chưa cập nhật cho tới sự kiện `onresult` tiếp theo (chỉ `el.src.value` được gán ở dòng 1429). Đây là hành vi có sẵn, không gây trùng câu (đặc biệt khi `autoTurn` gọi `setLangs` ở dòng 1439).

6. **Cảnh báo dự kiến của `node cong-cu/kiem-tra-dich.js` sau khi A3 sửa xong:**
   - Công cụ sẽ báo `KIEM TRA TU DONG: DAT` (mã thoát `0`) kèm 3 cảnh báo hợp lệ (không phải lỗi):
     1. `[TAILWIND] index.html/app.js thay đổi` — Mức 1 không thêm lớp Tailwind mới nên không build lại `styles.css`.
     2. `[CONFIG] config.js thay đổi` — xác nhận không lộ bí mật, giữ nguyên khối `firebase`.
     3. `[PHAM VI] Có tệp ngoài app dịch thay đổi: .agents/PLAN.md, .agents/SURVEY.md` — xác nhận không lẫn tệp ứng dụng ở thư mục gốc.

---

## 6. Đối chiếu bảng lớp ảnh hưởng (`PLAN.md` mục 8) với mã thực tế

| Lớp ảnh hưởng | Đánh dấu ở `PLAN.md` | Đối chiếu mã thực tế |
|---|---|---|
| Tệp thuộc `CORE` hoặc `room.bundle.js` | **Có** (`app.js`, `config.js`, `index.html`, `stt-browser.js`) | **Khớp.** Cả 3 tệp cũ đều ở `service-worker.js:7`; cần thêm `'./stt-browser.js'` vào `CORE` và tăng `CACHE` từ `'translator-v87'` → `'translator-v88'`. |
| `translator/src/room.js` | Không | **Khớp.** Không chạm `src/room.js` hay `room.bundle.js`. |
| `translator/firebase/firestore.rules` | Không | **Khớp.** Không đổi quy tắc hay dữ liệu Firestore. |
| Lớp Tailwind mới, `input.css`, `tailwind.config.js` | Không | **Khớp.** Mức 1 không đổi giao diện, không cần A4 và không cần build `styles.css`. |
| Dịch vụ tốn phí Google Cloud, đo mức dùng / hạn mức VIP | Không đổi cho Mức 1 (gián tiếp giữ thêm câu trước đây bị rơi) | **Khớp.** `translator/stt-cloud.js`, `bilingualBlock()`, `startCloud()`, `gCharge()`, `userLimitHit()` giữ nguyên; câu được giữ thêm vẫn đi qua đúng cơ chế đo và chặn hạn mức hiện hành. |

---

## 7. Tài liệu chính thức tham khảo

- W3C Web Speech API Specification (`SpeechRecognition`, `SpeechRecognitionResult.isFinal`, `SpeechRecognitionAlternative.confidence`, `onresult`, `onend`, `abort()`): https://webaudio.github.io/web-speech-api/
- MDN Web Docs — `SpeechRecognition`: https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition
- MDN Web Docs — `SpeechRecognitionAlternative.confidence`: https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognitionAlternative/confidence
