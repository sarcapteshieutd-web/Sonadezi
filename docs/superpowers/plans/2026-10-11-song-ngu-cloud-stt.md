# Họp song ngữ tự phát hiện ngôn ngữ — Kế hoạch triển khai

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trong chế độ họp, tự phát hiện ngôn ngữ từng câu (Việt với Anh/Trung/Nhật/Hàn) bằng Google Speech-to-Text, kèm nút bật/tắt, chọn micro, đo phút và hạn mức do quản trị viên đặt.

**Architecture:** Tệp mới `translator/stt-cloud.js` (thu âm, cắt đoạn, gọi API; phần logic thuần được xuất để kiểm thử bằng Node) tích hợp vào `app.js` qua `startMeeting()` và `queueMeeting()`. Đo phút và hạn mức đi theo cơ chế `reportUsage`, `config/google`, `config/billing` hiện có; thay đổi lớp Firebase cần xây lại `room.bundle.js`.

**Tech Stack:** JavaScript thuần chạy trên trình duyệt, Web Audio API, Google Speech-to-Text REST V1 (khóa API), Firebase Firestore (qua `src/room.js` + esbuild), kiểm thử bằng `node --test`.

**Spec:** `docs/superpowers/specs/2026-10-11-song-ngu-cloud-stt-design.md`

## Global Constraints
- Nhánh làm việc và đăng GitHub Pages: `claude/realtime-translation-app-68o1ik` (không phải `main`).
- Cặp ngôn ngữ: ngoại ngữ ∈ {`en`, `zh`, `ja`, `ko`} cùng `vi`; mã nhận dạng `en-US`, `zh-CN`, `ja-JP`, `ko-KR`, `vi-VN`. Cặp không chứa `vi` thì nút song ngữ bị vô hiệu.
- Điểm cuối: `POST https://speech.googleapis.com/v1/speech:recognize?key=<khóa>`; `encoding: 'LINEAR16'`, `sampleRateHertz: 16000`, `languageCode` = ngoại ngữ, `alternativeLanguageCodes: ['vi-VN']`, `enableAutomaticPunctuation: true`; **không** đặt `model`, **không** bật chế độ nâng cao.
- Cắt đoạn: kết thúc sau **0,7 s** im lặng; giữ **0,3 s** đầu câu; bỏ đoạn ngắn hơn **0,4 s**; ép cắt ở **25 s**.
- Tính phút theo giây gửi lên, làm tròn lên 1 giây mỗi đoạn; loại đo `stt`, đơn vị giây trong hồ sơ, hiển thị bằng phút.
- Khóa cấu hình mới: `config/google` thêm `sttLimit` (phút, tổng), `userStt` (phút, mỗi VIP), `sttOver` (`'fallback'` mặc định hoặc `'continue'`); `config/billing` thêm `sttPrice` (USD/phút, mặc định 0.016, hiển thị là chưa xác minh). `0` = không giới hạn.
- Chỉ VIP và quản trị viên dùng được; chế độ hội nghị (`state.conf`) vô hiệu hóa nút song ngữ.
- Mọi chuỗi giao diện bằng tiếng Việt văn phong hành chính; không gửi khóa API vào nhật ký hay thông báo.
- Mỗi lần đẩy mã tăng `CACHE` trong `translator/service-worker.js` (hiện `translator-v52`).

## Review Focus
1. Đoạn chỉ có tiếng ồn hoặc im lặng: không được gọi API, không tính phút. (Task 1)
2. Văn bản rỗng hoặc ngôn ngữ ngoài cặp: bỏ qua đoạn nhưng vẫn tính phút. (Task 2, Task 5)
3. Hết hạn mức giữa cuộc họp ở chế độ `fallback`: chuyển sang nhận dạng trình duyệt, không mất đoạn đang xử lý; ở chế độ `continue`: tiếp tục và ghi nhận phần vượt. (Task 1, Task 5)
4. Lưu cấu hình từ một bảng quản trị không được xóa các trường `stt*` do bảng kia đặt (`saveGoogleConfig` dùng `setDoc` ghi đè). (Task 4, Task 6)
5. Khi ứng dụng đang đọc bản dịch ra loa: không thu lại tiếng đọc; sau đó tiếp tục thu. (Task 5)
6. Mất mạng hoặc API trả 5xx: thử lại đúng một lần, không tính phút hai lần. (Task 2)

---

### Task 1: Logic thuần của `stt-cloud.js`

**Files:**
- Create: `translator/stt-cloud.js`
- Test: `translator/tests/stt-cloud.test.js`

**Interfaces:**
- Produces (xuất qua `module.exports` và `window.CloudSTT`):
  - `SAMPLE_RATE: 16000`
  - `pairFromLangs(src: string, tgt: string): { foreign: string, primary: string, alt: 'vi-VN' } | null`
  - `langFromCode(code: string, pair: { foreign: string }): string | null` (trả `'vi'`, `pair.foreign` hoặc `null`)
  - `downsampleTo16k(input: Float32Array, inRate: number): Float32Array`
  - `floatToPcm16(f: Float32Array): Int16Array`
  - `pcm16ToBase64(pcm: Int16Array): string`
  - `billedSeconds(sampleCount: number): number` (làm tròn lên, tối thiểu 1)
  - `createSegmenter(opts?): { push(frame: Float32Array): Float32Array[], flush(): Float32Array[] }` (khung đã ở 16 kHz; trả các đoạn hoàn chỉnh)
  - `quotaDecision({ usedSec, addSec, limitMin, mode }): { allow: boolean, warn: boolean, over: boolean }`

- [ ] **Step 1: Viết bộ kiểm thử `node:test` (thất bại)** gồm các ca: `pairFromLangs('en','vi')` → `foreign:'en', primary:'en-US'`; `pairFromLangs('vi','ja')` → `primary:'ja-JP'`; `pairFromLangs('en','zh')` → `null`; `pairFromLangs('zht','vi')` → `null`. `langFromCode('vi-vn', pairJa)` → `'vi'`; `'ja-jp'` → `'ja'`; `'cmn-hans-cn'` với cặp `zh` → `'zh'`; `'en-us'` với cặp `ja` → `null`. `billedSeconds(1)` = 1, `billedSeconds(16000)` = 1, `billedSeconds(16001)` = 2. `downsampleTo16k` từ 48 kHz cho độ dài bằng một phần ba. `floatToPcm16` kẹp giá trị ±1 về 32767/-32768. `createSegmenter`: 2 giây im lặng → 0 đoạn; 1 giây tiếng (sin 440 Hz biên độ 0,3) rồi 1 giây im → đúng 1 đoạn dài ≥ 1 giây (cộng 0,3 s đầu); hai câu cách nhau 1 giây im → 2 đoạn; tiếng liên tục 60 giây → các đoạn không dài quá 25 giây; tiếng ngắn 0,2 giây → 0 đoạn; `flush()` trả đoạn đang dở nếu dài ≥ 0,4 s. `quotaDecision({usedSec:0,addSec:10,limitMin:0,mode:'fallback'})` → `{allow:true,warn:false,over:false}`; với `limitMin:10`, `usedSec:480`, `addSec:10` → `warn:true`; `usedSec:595`, `addSec:10` → `over:true`, `allow:false` ở `fallback`, `allow:true` ở `continue`.
- [ ] **Step 2: Chạy** `node --test translator/tests` — Expected: FAIL (module chưa có).
- [ ] **Step 3: Cài đặt các hàm trên trong `translator/stt-cloud.js`** (khối IIFE gán `window.CloudSTT` khi có `window`, ngược lại `module.exports`). Bộ cắt đoạn dùng RMS theo khung 20 ms, ngưỡng thích nghi = max(0,01, 3 × mức ồn nền ước lượng bằng trung bình trượt của các khung im lặng); các hằng số 700/300/400/25000 ms nằm ở đầu tệp.
- [ ] **Step 4: Chạy lại** `node --test translator/tests` — Expected: PASS.
- [ ] **Step 5: Commit** `git add translator/stt-cloud.js translator/tests && git commit -m "Thêm logic thuần cho nhận dạng đám mây: cặp ngôn ngữ, cắt đoạn, mã hóa PCM, hạn mức"`

### Task 2: Gọi API, thu âm, thử 5 giây

**Files:**
- Modify: `translator/stt-cloud.js`
- Test: `translator/tests/stt-cloud.test.js`

**Interfaces:**
- Consumes: các hàm của Task 1.
- Produces:
  - `recognize(pcm: Int16Array, opts: { apiKey: string, primary: string, alt: string, fetchImpl?: typeof fetch }): Promise<{ text: string, code: string, confidence: number }>`; lỗi ném `Error` có `.status` (số) và `.message` tiếng Việt cho 400/403/429/5xx/mạng.
  - `start(opts: { deviceId?: string, apiKey: string, pair: {primary,alt,foreign}, onSegment(seg: { text, lang, seconds, confidence }), onLevel(rms: number), onError(e: Error) }): Promise<void>`
  - `pause(): void`, `resume(): void`, `stop(): void`
  - `listDevices(): Promise<{ id: string, label: string }[]>`
  - `probe(opts: { deviceId?, apiKey, pair }): Promise<{ text, lang, seconds }>` (thu 5 giây, gọi `recognize`)

- [ ] **Step 1: Viết kiểm thử `recognize` với `fetchImpl` giả (thất bại):** thân yêu cầu đúng cấu hình của Global Constraints (kiểm `config.languageCode`, `alternativeLanguageCodes`, `encoding`, `sampleRateHertz`, không có `model`); phản hồi mẫu `{results:[{languageCode:'vi-vn',alternatives:[{transcript:'xin chào',confidence:0.9}]}]}` → `{text:'xin chào', code:'vi-vn', confidence:0.9}`; phản hồi `{}` → `text:''`; trạng thái 403 → ném lỗi có `.status === 403` và thông điệp nhắc bật Speech-to-Text; lần gọi đầu ném lỗi mạng, lần hai thành công → trả kết quả và `fetchImpl` được gọi đúng 2 lần; hai lần đều lỗi → ném lỗi; trạng thái 400 không thử lại (gọi đúng 1 lần).
- [ ] **Step 2: Chạy** `node --test translator/tests` — Expected: FAIL.
- [ ] **Step 3: Cài đặt `recognize`** (thử lại đúng một lần chỉ với lỗi mạng và 5xx; khóa không xuất hiện trong thông điệp lỗi). Cài đặt `start/pause/resume/stop/listDevices/probe` theo spec mục 4.2: `getUserMedia` với `echoCancellation`, `noiseSuppression`, `autoGainControl`; ưu tiên `AudioWorklet` (nạp từ `Blob URL`), dự phòng `ScriptProcessor`; khi `pause()` thì bỏ khung âm thanh và hủy đoạn đang dở; mỗi đoạn hoàn chỉnh gọi `recognize`, tính `billedSeconds`, ánh xạ `langFromCode`, rồi `onSegment` (đoạn ngôn ngữ ngoài cặp hoặc văn bản rỗng: không gọi `onSegment` nhưng vẫn báo giây qua `onSegment` với `text:''` và `lang:null` để bên gọi tính phút).
- [ ] **Step 4: Chạy lại** `node --test translator/tests` — Expected: PASS; `node --check translator/stt-cloud.js` không lỗi.
- [ ] **Step 5: Commit** `git commit -am "Thêm gọi Google Speech-to-Text, thu âm và thử 5 giây"`

### Task 3: Lớp Firebase (cấu hình, quy tắc, bundle)

**Files:**
- Modify: `translator/src/room.js` (hàm `saveGoogleConfig`, `saveBillingConfig`, quanh dòng 207–221), `translator/firebase/firestore.rules` (khối `match /config/{docId}`), `translator/firebase/rules-test-vip.js`, `translator/room.bundle.js` (sinh lại)

**Interfaces:**
- Produces: `acct.saveGoogleConfig({ key, trLimit, ttsLimit, userTr, userTts, sttLimit, userStt, sttOver })` (các trường `stt*` thiếu thì mặc định `0`, `0`, `'fallback'`); `acct.saveBillingConfig({ creditUsd, vndPerUsd, trialEndMs, trPrice, ttsPrice, ttsFree, sttPrice })`; `subscribeGoogleConfig` và `getBillingConfig` trả thêm các trường mới.

- [ ] **Step 1: Mở rộng `rules-test-vip.js` (thất bại):** quản trị viên ghi được `config/google` có `sttLimit`, `userStt`, `sttOver:'fallback'`; `sttOver:'xyz'` bị từ chối; `sttLimit:'5'` (chuỗi) bị từ chối; VIP còn hạn đọc được `sttLimit`, `userStt`, `sttOver`; người dùng thường không ghi được; `config/billing` nhận `sttPrice` số, từ chối chuỗi.
- [ ] **Step 2: Chạy kiểm thử quy tắc** theo hướng dẫn đầu tệp (cần Firebase Emulator). Expected: các ca mới FAIL. Nếu môi trường không chạy được emulator, ghi rõ "chưa chạy" trong thông báo commit và trong báo cáo cuối.
- [ ] **Step 3: Sửa `firestore.rules` và `room.js`:** thêm `'sttLimit','userStt','sttOver'` vào `hasOnly` của `config/google` với kiểm kiểu (`sttOver in ['fallback','continue']`); thêm `'sttPrice'` vào `config/billing`. Sinh lại bundle: `cd translator && npm i firebase qrcode-generator esbuild && npx esbuild src/room.js --bundle --minify --format=iife --target=es2020 --outfile=room.bundle.js`; không commit `node_modules` và `package*.json` (kiểm `.gitignore`).
- [ ] **Step 4: Chạy lại kiểm thử quy tắc** — Expected: PASS (hoặc ghi "chưa chạy"); kiểm `node --check translator/room.bundle.js`.
- [ ] **Step 5: Commit** `git add translator/src/room.js translator/room.bundle.js translator/firebase && git commit -m "Thêm cấu hình hạn mức Speech-to-Text vào quy tắc Firestore và lớp Firebase"`

### Task 4: Đo phút, hạn mức và cấu hình trong `app.js`

**Files:**
- Modify: `translator/app.js` (`pendingUse` ~dòng 426, `userUsed`/`userLimitHit` ~439–481, `blockedNow`/`applyGoogleCfg`/`becomeFree`/`watchGoogleCfg` ~2285–2316, `reportUsage`/`flushUsage` ~2318–2331, bảng quản trị ~2511–2630)

**Interfaces:**
- Consumes: `quotaDecision` (Task 1); `saveGoogleConfig`/`saveBillingConfig` mới (Task 3).
- Produces: `state.userLimit.stt: number` (phút), `state.sttLimit: number`, `state.sttOver: 'fallback'|'continue'`, `state.sttPrice: number`; `sttCharge(seconds: number): { allow: boolean, warn: boolean, over: boolean }` (cộng `pendingUse.stt` và gọi `reportUsage('stt', seconds)` khi `allow`; quản trị viên dùng `state.sttLimit` tại máy, VIP dùng `state.userLimit.stt` theo hồ sơ máy chủ).

- [ ] **Step 1: Cài đặt `sttCharge` và nối dữ liệu:** `pendingUse` thêm `stt: 0`; `flushUsage` và `becomeFree` gửi/đặt lại `stt`; `applyGoogleCfg` đọc `sttLimit`, `userStt`, `sttOver`; mọi nơi gọi `saveGoogleConfig` (hai nơi ~2529 và ~2624) phải truyền nguyên giá trị `stt*` hiện có để không bị ghi đè về mặc định.
- [ ] **Step 2: Bảng quản trị:** thước đo "Google Speech-to-Text (phút)" cạnh `sum('tr')`; ô nhập hạn mức tổng, hạn mức mỗi VIP, lựa chọn khi hết hạn mức (`Quay về nhận dạng trình duyệt` / `Cho dùng tiếp`), đơn giá `sttPrice` kèm chú thích "chưa xác minh"; ước tính chi phí = phút × `sttPrice`.
- [ ] **Step 3: Kiểm tra** `node --check translator/app.js`; chạy `grep -n "saveGoogleConfig" translator/app.js` và xác nhận mọi lời gọi đều có `sttLimit`, `userStt`, `sttOver`.
- [ ] **Step 4: Commit** `git commit -am "Đo phút Speech-to-Text, hạn mức tổng và mỗi VIP, lựa chọn khi hết hạn mức"`

### Task 5: Tích hợp chế độ họp song ngữ

**Files:**
- Modify: `translator/app.js` (`startMeeting` ~1251, `stopMeeting`, `queueMeeting` ~1002, `drainSpeech`, `syncConf`), `translator/index.html` (thanh chế độ họp; nạp `stt-cloud.js` trước `app.js`)

**Interfaces:**
- Consumes: `pairFromLangs`, `CloudSTT.start/pause/resume/stop/listDevices`, `sttCharge`.
- Produces: `state.bilingual: boolean` (lưu `store 'bilingual'`), `state.micId: string` (lưu `store 'micId'`); `queueMeeting(text: string, pre?: object, from?: string, to?: string)` (mặc định `state.src/state.tgt`, luồng cũ không đổi); các phần tử `chkBilingual`, `selMic`, `sttStatus` trong `index.html` và `el`.

- [ ] **Step 1: `index.html`:** thêm ô chọn "Song ngữ (tự nhận ngôn ngữ)", danh sách micro, nhãn trạng thái "Đang nghe (đám mây)" và số phút đã dùng; thêm `<script src="stt-cloud.js">` trước `app.js`.
- [ ] **Step 2: `queueMeeting`** nhận `from`, `to` tùy chọn và truyền vào `addHistory` và `enqueueSpeech` (đã nhận ngôn ngữ đích).
- [ ] **Step 3: `startMeeting`:** nếu `state.bilingual` và `bilingualAllowed()` (VIP/quản trị viên, không `state.conf`, `pairFromLangs` khác `null`, có khóa `cloudKey()`, `sttCharge` chưa chặn) thì đặt `state.mine = pair.foreign`, gọi `CloudSTT.start`; mỗi `onSegment`: tính phút qua `sttCharge(seg.seconds)` (`warn` → thông báo một lần "đã dùng 80% hạn mức nhận dạng đám mây"); `over` + `fallback` → `CloudSTT.stop()`, thông báo, `beginSession()` với ngôn ngữ của đoạn cuối phát hiện; `over` + `continue` → thông báo đỏ mỗi ngày một lần và tiếp tục; `text` rỗng hoặc `lang` null → bỏ qua; ngược lại `queueMeeting(seg.text, undefined, seg.lang, seg.lang === 'vi' ? pair.foreign : 'vi')`. `onError` (400/403/mạng bền): thông báo rõ và quay về `beginSession()`. Đổi cặp ngôn ngữ trong lúc họp thì khởi động lại `CloudSTT` với cặp mới.
- [ ] **Step 4: Dừng và đọc bản dịch:** `stopMeeting` gọi `CloudSTT.stop()`; `drainSpeech` (nhánh không phải hội nghị) gọi `CloudSTT.pause()` khi bắt đầu đọc và `CloudSTT.resume()` khi xong thay cho `rec.abort()`/`beginSession()` khi đang ở chế độ song ngữ; `syncConf` vô hiệu hóa `chkBilingual` khi `state.conf`.
- [ ] **Step 5: Kiểm tra** `node --check translator/app.js`; chạy `node --test translator/tests`; thử nạp trang bằng Chromium không giao diện (Playwright đã có sẵn) với `--use-fake-ui-for-media-stream --use-fake-device-for-media-stream`, chặn `speech.googleapis.com` bằng phản hồi mẫu, và xác nhận không có lỗi console khi tải trang. Nếu không thể giả lập tài khoản VIP trong môi trường này, ghi rõ phần luồng họp chưa được chạy thật.
- [ ] **Step 6: Commit** `git commit -am "Tích hợp họp song ngữ: phát hiện ngôn ngữ từng câu, chọn micro, tạm dừng khi đọc bản dịch"`

### Task 6: Nút "Thử 5 giây" trong bảng quản trị

**Files:**
- Modify: `translator/app.js` (bảng quản trị ~2511–2630)

**Interfaces:**
- Consumes: `CloudSTT.probe`, `pairFromLangs`.

- [ ] **Step 1: Thêm ô chọn cặp** (Anh–Việt, Trung–Việt, Nhật–Việt, Hàn–Việt) và nút "Thử 5 giây" vào bảng quản trị; kết quả hiển thị văn bản nhận được, ngôn ngữ phát hiện và số giây; lỗi hiển thị thông điệp tiếng Việt của `recognize`. Nút dùng khóa quản trị viên đang cấu hình (`cloudKey()`), không ghi khóa vào nhật ký.
- [ ] **Step 2: Kiểm tra** `node --check translator/app.js`.
- [ ] **Step 3: Commit** `git commit -am "Thêm nút thử 5 giây cho từng cặp ngôn ngữ trong bảng quản trị"`

### Task 7: Tài liệu, bộ nhớ đệm, đẩy mã

**Files:**
- Modify: `translator/service-worker.js` (thêm `./stt-cloud.js` vào `CORE`, `CACHE` → `translator-v53`), `translator/HUONG-DAN.md`, `docs/FIREBASE-SETUP.md` (mục 9)

- [ ] **Step 1: Cập nhật tài liệu:** cách bật Speech-to-Text trên dự án Google Cloud và cho phép dịch vụ này trong "API restrictions" của khóa; dán lại toàn bộ `firestore.rules` rồi bấm Publish (giống mục 9.4); cách dùng nút song ngữ và chọn micro EMEET M0 Plus; ý nghĩa hai lựa chọn khi hết hạn mức và rủi ro của "Cho dùng tiếp" (nên đặt Budget alert); giới hạn đã biết (chữ hiện sau khi người nói ngắt, chưa đo độ trễ và độ chính xác).
- [ ] **Step 2: Kiểm tra cuối:** `node --check translator/*.js`, `node --test translator/tests`, `grep -c "<<<<<<<" translator/app.js` = 0.
- [ ] **Step 3: Commit và đẩy** `git push -u origin claude/realtime-translation-app-68o1ik`; xác nhận lần build GitHub Pages mới xuất hiện và thành công (`actions_list`).
- [ ] **Step 4: Báo cáo** danh sách kiểm tra thủ công của spec mục 6 (cần khóa và micro thật) và nêu rõ điều chưa kiểm chứng.
