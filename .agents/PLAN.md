# PLAN – Cải thiện bắt chữ khi thu MỘT thứ tiếng trong chế độ Họp

- Vai lập kế hoạch: A1 – Kiến trúc sư (`Claude Code/Claude Opus 5.5`)
- Nhánh: `sonadezilongthanh/fix/meeting-transcription-2`, tách từ nhánh phát hành `claude/realtime-translation-app-68o1ik` tại `03851d1`.
- Yêu cầu gốc (anh Hiếu): "Kiểm thử việc thu một thứ tiếng trong cuộc họp, bắt chữ chưa được tốt lắm, có thể cải thiện cho tốt hơn được không."
- Mốc kiểm tra trước khi sửa: `node cong-cu/kiem-tra-dich.js` → `KIEM TRA TU DONG: DAT`, kiểm thử đơn vị `67/67 đạt (6 tệp)`.
- Giới hạn của A1: phiên này không có micro hay thiết bị thật. Vì vậy "kiểm thử" ở đây gồm đọc mã luồng nghe và lập giả thuyết. Muốn xác nhận nguyên nhân, cần chạy kịch bản thử trên thiết bị ở mục 5.

## 1. Mục tiêu và phạm vi

**Mục tiêu:** áp dụng cho chế độ Họp, Hội nghị và Biên bản khi KHÔNG bật "Họp song ngữ". Ứng dụng phải giữ được nhiều chữ hơn:
- không làm rơi câu;
- không mất đoạn đang nói dở khi phiên nghe bị ngắt;
- cắt câu ít vụn hơn.

**Phạm vi "thu một thứ tiếng":** luồng nhận diện của trình duyệt (Web Speech API) trong `translator/app.js`:

| Hàm (app.js) | Dòng | Vai trò |
|---|---|---|
| `heard(result)` | 972–978 | Bỏ câu đã chốt có `confidence < MIN_CONF` |
| `beginSession()` | 1034–1101 | Tạo `SpeechRecognition`, đặt `continuous`, `interimResults`; `onend` tự mở lại phiên |
| `onMeetingResult(ev)` | 1418–1440 | Gom kết quả tạm (interim) và kết quả chốt (final), chốt câu, dịch dần |
| `forceCommit()`, `commitFinal()` | 1277–1299 | Chốt câu sớm hoặc chốt câu cuối; khử trùng bằng `utt.forced` |
| `drainSpeech()` | 1370–1408 | Đọc bản dịch; gọi `rec.abort()` để tạm nghỉ micro |
| `refreshSession()` | 1410–1416 | Mở phiên mới sau khi đọc (Hội nghị). Hàm này ĐÃ chốt phần dở trước khi hủy phiên |
| `setLangs()` | 233–235 | Đổi người nói (⇄, Space): gọi `resetUtt()` + `rec.abort()` |
| `queueMeeting()` | 1128–1131 | Khử lặp câu trong 4 giây |

Luồng Google Cloud STT (`translator/stt-cloud.js`) hiện chỉ chạy cho **Họp song ngữ**. Điều kiện: cặp ngôn ngữ gồm tiếng Việt và một trong các tiếng Anh, Trung, Nhật, Hàn, và tài khoản là Nội bộ. Mức 1 dưới đây KHÔNG chạm Cloud STT. Phương án dùng Cloud STT cho một ngôn ngữ nằm ở mục 3 (Mức 2) và chờ anh Hiếu quyết định.

## 2. Giả thuyết nguyên nhân bắt chữ kém (xếp theo khả năng)

| # | Giả thuyết | Bằng chứng trong mã | Hậu quả người dùng thấy |
|---|---|---|---|
| G1 | **Lọc độ tin cậy làm rơi cả câu.** `config.js` đặt `recognition.minConfidence: 0.3`. `heard()` trả `''` cho câu final có `0 < confidence < 0.3`. | `translator/config.js:16`, `app.js:972–978`; nơi dùng: `onMeetingResult`, `app.js:1425–1426` | Chữ hiện trong ô tạm rồi **biến mất**, không vào khung chat. Chrome thường chấm điểm thấp khi: nói tiếng Việt, giọng địa phương, micro xa, câu dài ở chế độ `continuous`. Khi đó cả câu dài bị bỏ. |
| G2 | **Mất phần đang nói dở khi tạm nghỉ micro để đọc bản dịch.** Ở chế độ Họp (không phải Hội nghị), app gọi `rec.abort()` rồi xóa `el.src` mà không gọi `forceCommit()`. `refreshSession()` đã làm đúng việc này, `drainSpeech()` thì chưa. | `app.js:1396–1397` so với `app.js:1411–1412` | Nếu người kế tiếp bắt đầu nói đúng lúc app đọc bản dịch, phần đầu câu của họ bị mất. |
| G3 | **Mất phần đang nói dở khi đổi người nói.** Trong họp, `setLangs()` gọi `resetUtt()` + `rec.abort()` trước khi chốt `utt.lastText`. | `app.js:235` | Bấm ⇄ hoặc Space giữa câu thì mất đoạn tạm chưa chốt. Tự đổi lượt ít bị hơn, vì nó chạy sau khi có final. |
| G4 | **Phiên nghe tự kết thúc khi kết quả tạm chưa thành final.** `onend` chỉ gán `committed` (dùng cho chế độ Hội thoại), không chốt `utt.lastText` khi họp. Phiên mới gán `utt.forced = ''` (`app.js:1036`). Mặc định `cutMs = 0` (`app.js:125`), nên không có hẹn giờ chốt dự phòng. | `app.js:1082–1098`, `1036`, `125` | Chrome hoặc Android có thể ngắt phiên (sau khoảng 60 giây, khi mạng chập chờn, khi báo `no-speech`). Đoạn cuối chưa final khi đó bị mất. |
| G5 | **Khoảng hở khi mở lại phiên.** App chờ 250 ms trước khi mở lại (khi có lỗi thì giãn tới 3 giây), cộng thêm thời gian `rec.start()`. Âm thanh trong khoảng này không được nghe. | `app.js:1093–1094` | Mất vài âm tiết đầu câu mỗi khi phiên tự khởi động lại. Đây là giới hạn của Web Speech, chỉ giảm được một phần. |
| G6 | **Trình duyệt không được báo trước tên riêng.** `sttPhrases`/`speechContexts` chỉ dùng cho Cloud STT. Web Speech chỉ có `applyGlossary` sửa chữ sau khi nghe, và glossary hiện chỉ là "ví dụ dự đoán". | `config.js:17–40` | Tên KCN và địa danh bị nghe sai. Cách cải thiện là bổ sung dữ liệu (glossary thật), không phải sửa mã. |
| G7 | **Giới hạn chất lượng của bộ nhận diện trình duyệt**, nhất là Safari iOS và micro phòng họp đặt xa. | Ngoài phạm vi mã | Chỉ khắc phục triệt để bằng Cloud STT (Mức 2) hoặc đặt micro gần người nói. |

## 3. Phương án

| Phương án | Nội dung | Ưu | Nhược | Chi phí Google Cloud |
|---|---|---|---|---|
| **Mức 1 (đề xuất làm ngay)** | Sửa G1–G4 trong luồng Web Speech, thêm logic thuần có kiểm thử | Không tốn phí, không đổi giao diện, rủi ro thấp, áp dụng cho mọi tài khoản | Không vượt được trần chất lượng của trình duyệt (G5–G7) | **Không** |
| Mức 2 (chờ quyết) | Cho tài khoản Nội bộ dùng Cloud STT khi họp một ngôn ngữ: chỉ gửi `languageCode`, không gửi `alternativeLanguageCodes`. Có thể thêm `model: 'latest_long'` | Chất lượng cao hơn rõ; có `speechContexts` cho tên riêng | **Tốn phí và trừ hạn mức STT VIP**. Cần ô bật/tắt trên giao diện (A4). Phải đổi `bilingualBlock` và `pairFromLangs` | **Có**: thêm phút STT bị tính tiền; đổi `model` có thể làm đổi đơn giá |
| Mức 3 (chờ quyết) | Đặt `noiseSuppression`/`autoGainControl` theo khuyến nghị của Google cho Cloud STT | Có thể tăng độ chính xác của Cloud STT | Chỉ ảnh hưởng luồng song ngữ hiện có; cần thử A/B trên thiết bị | Gián tiếp (không đổi tần suất gọi) |

**Kế hoạch này chỉ giao Mức 1.** Mức 2 và Mức 3 nằm trong câu hỏi ở mục 6. Nếu anh Hiếu duyệt, A1 sẽ lập PLAN bổ sung.

## 4. Các bước Mức 1 (giao A3 – Codex)

1. **G1 – Không làm rơi câu vì độ tin cậy thấp.** Sửa `heard()` (`app.js:972–978`) và `translator/config.js:16`:
   - Đổi mặc định `minConfidence` thành `0` (tắt lọc). Giữ tùy chọn trong `config.js`, kèm chú thích "chỉ bật khi có tạp âm bị nhận thành chữ".
   - Khi lọc vẫn bật, chế độ Họp không bỏ câu dài. Chỉ bỏ câu final vừa có độ tin cậy thấp vừa ngắn: dưới 3 từ, hoặc dưới 4 ký tự với zh/ja/ko. Viết quy tắc thành hàm thuần `shouldDropFinal(text, confidence, minConf, spaced)` trong tệp mới `translator/stt-browser.js` (có `module.exports`).
   - Ghi mỗi câu bị bỏ bằng `micLog('bỏ câu độ tin cậy thấp: …')` để chẩn đoán.
2. **G2 – Chốt phần dở trước khi tạm nghỉ micro để đọc.** Sửa `drainSpeech()`, nhánh không phải Hội nghị (`app.js:1396`). Trước `rec.abort()`, nếu `utt.lastText.trim()` có chữ thì gọi `forceCommit()`, giống `refreshSession()`.
3. **G3 – Chốt phần dở trước khi đổi người nói.** Sửa `setLangs()` (`app.js:235`). Khi `wasMeeting` và `utt.lastText.trim()` có chữ, gọi `forceCommit()` trước `resetUtt()`/`rec.abort()`. Câu dở sẽ được dịch theo hướng CŨ. Phải chốt trước khi đổi `state.src`, vì `queueMeeting` đọc `state.src/tgt` tại lúc được gọi.
4. **G4 – Chốt phần dở khi phiên tự kết thúc.** Sửa `rec.onend` (`app.js:1082`). Nếu `state.meeting` và `utt.lastText.trim()` có chữ, gọi `forceCommit()` trước khi mở lại phiên.
   - `forceCommit()` đã khử trùng qua `utt.forced`/`stripForced`, nên final đến muộn không gây lặp câu.
   - Giữ nguyên việc `beginSession()` xóa `utt.forced` (`app.js:1036`), vì phiên mới không trả lại văn bản của phiên cũ.
5. **Tăng cache và nạp tệp mới.**
   - `translator/service-worker.js`: đổi `CACHE = 'translator-v87'` thành `'translator-v88'`, thêm `stt-browser.js` vào `CORE`.
   - `translator/index.html`: thêm `<script src="stt-browser.js">` trước `app.js`.
6. **Kiểm thử** theo mục 5, rồi chạy `node cong-cu/kiem-tra-dich.js`.

**Không làm trong Mức 1:**
- Đổi `continuous`, `interimResults`, `maxAlternatives`.
- Đổi thời gian chờ khởi động lại (G5).
- Bổ sung glossary (G6): cần dữ liệu thật từ anh Hiếu.

## 5. Danh sách tệp ĐÓNG và kiểm thử

A3 chỉ được sửa các tệp sau:

| Tệp | Việc |
|---|---|
| `translator/app.js` | Bước 1–4, chỉ trong các hàm nêu ở mục 1 |
| `translator/stt-browser.js` (mới) | Hàm thuần `shouldDropFinal`, xuất qua `module.exports` và `window.BrowserSTT` |
| `translator/config.js` | `recognition.minConfidence` và chú thích |
| `translator/index.html` | Thêm một dòng `<script src="stt-browser.js">` |
| `translator/service-worker.js` | `CACHE` v87 → v88; thêm `stt-browser.js` vào `CORE` |
| `translator/tests/stt-browser.test.js` (mới) | Kiểm thử `node:test` |
| `translator/HUONG-DAN.md` | Một đoạn ngắn: cách bật lại lọc độ tin cậy, gợi ý bổ sung glossary |

**KHÔNG ĐỔI:**
- `translator/stt-cloud.js`, `translator/src/room.js`, `translator/room.bundle.js`, `translator/firebase/*`.
- `translator/styles.css`, `input.css`, `tailwind.config.js`, `translator/ui.css`.
- Mọi tệp của ứng dụng ở thư mục gốc: `index.html`, `sw.js`, `AppsScript-Code.gs`, `seed.js`, `manifest.webmanifest`, `giong-van-szl.md`.

### Kiểm thử `node:test` cần thêm (`translator/tests/stt-browser.test.js`)

- `minConf = 0`: `shouldDropFinal` không bỏ câu nào.
- `confidence = 0` (trình duyệt không báo điểm): giữ câu.
- Câu dài (≥ 3 từ) có độ tin cậy 0.1: giữ. Câu 1–2 từ có độ tin cậy 0.1 với `minConf = 0.3`: bỏ.
- Chuỗi CJK (`spaced = false`): ngưỡng tính theo số ký tự.
- Chuỗi rỗng hoặc chỉ có khoảng trắng: bỏ, không sinh tin rỗng.

Bước 2–4 phụ thuộc DOM và `SpeechRecognition`, nên không viết được `node:test`. Các bước này được kiểm bằng kịch bản thiết bị dưới đây.

### Kịch bản thử trên thiết bị (anh Hiếu hoặc A5 ghi kết quả)

| # | Thao tác | Kết quả mong đợi |
|---|---|---|
| T1 | Chrome Android/PC, Họp vi→en, nói 5 câu dài ở khoảng cách 1–2 m | Cả 5 câu vào khung chat; không câu nào hiện rồi biến mất |
| T2 | Bật đọc bản dịch; người thứ hai bắt đầu nói ngay khi app đang đọc | Phần nghe được trước khi đọc thành một tin riêng, không mất |
| T3 | Nói dở câu rồi bấm ⇄ | Phần dở thành tin theo hướng cũ; câu tiếp theo theo hướng mới |
| T4 | Nói liên tục hơn 60 giây | Không mất đoạn nào ở chỗ phiên tự khởi động lại (xem Nhật ký nghe/đọc trong Cài đặt) |
| T5 | Safari iOS: lặp lại T1–T3 | Không lặp câu, không kẹt micro |
| T6 | Từ chối quyền micro; ngắt mạng | Hành vi như cũ: báo lỗi, giữ cuộc họp, có nút "Mở lại micro" |

## 6. Câu hỏi còn bỏ ngỏ

1. **Anh Hiếu gặp hiện tượng cụ thể nào?**
   - (a) Câu hiện rồi biến mất.
   - (b) Mất đầu hoặc cuối câu.
   - (c) Nghe sai từ, nhất là tên riêng.
   - (d) Câu bị cắt vụn.

   Xin cho biết thêm trình duyệt, thiết bị và ngôn ngữ đang dùng; nếu có, gửi kèm "Nhật ký nghe/đọc" trong Cài đặt. Mức 1 xử lý (a) và (b). (c) cần Mức 2 hoặc bổ sung glossary. (d) liên quan cài đặt "tự chốt câu".
2. **Anh có đồng ý tắt lọc độ tin cậy theo mặc định không** (`minConfidence` 0.3 → 0)? Thay đổi này ảnh hưởng cả chế độ Hội thoại, không chỉ chế độ Họp.
3. **Anh có muốn làm Mức 2 không?** Mức 2 cho tài khoản Nội bộ dùng Google Cloud STT khi họp một ngôn ngữ. ⚠ **Tốn phí và trừ hạn mức STT VIP.** Nếu có, xin cho biết:
   - áp dụng cho ngôn ngữ nào (chỉ vi/en/zh/ja/ko như hiện nay?);
   - có đổi `model` (ví dụ `latest_long`) không.
4. **Anh có muốn làm Mức 3 không?** Mức 3 thử tắt `noiseSuppression`/`autoGainControl` cho Cloud STT ở luồng song ngữ hiện có. Cần thử A/B trên thiết bị thật trước khi phát hành.
5. **Anh có danh sách từ bị nghe sai trong thực tế không?** Danh sách này dùng để thay các mục "ví dụ dự đoán" trong `recognition.glossary` (G6).

## 7. Tiêu chí nghiệm thu

1. `node cong-cu/kiem-tra-dich.js` đạt. Số kiểm thử đơn vị lớn hơn `67` và tất cả đều đạt.
2. `git diff --name-only 03851d1` chỉ gồm các tệp trong danh sách ĐÓNG, cộng các tệp `.agents/*`.
3. `CACHE` = `translator-v88`; `stt-browser.js` có trong `CORE`.
4. Với `minConfidence` mặc định, `heard()` không trả `''` cho câu final có chữ.
5. Đọc mã thấy rõ: `drainSpeech()`, `setLangs()` (khi họp) và `rec.onend` (khi họp) đều chốt `utt.lastText` trước khi hủy hoặc mở lại phiên.
6. T1–T4 đạt trên Chrome; T5–T6 không hồi quy.
7. Không có `fetch` mới tới `speech.googleapis.com`; `stt-cloud.js` không đổi.

## 8. Bảng lớp ảnh hưởng

| Lớp ảnh hưởng | Có/Không | Việc cần làm nếu có |
|---|---|---|
| Tệp thuộc `CORE` hoặc `room.bundle.js` | **Có** (`app.js`, `config.js`, `index.html`, tệp mới) | Tăng `CACHE` v87 → v88 trong `translator/service-worker.js` |
| `translator/src/room.js` | Không | — |
| `translator/firebase/firestore.rules` | Không | — |
| Lớp Tailwind mới, `input.css`, `tailwind.config.js` | Không | — |
| Dịch vụ tốn phí Google Cloud (Translation, TTS, STT), đo mức dùng hoặc hạn mức VIP | **Không với Mức 1.** ⚠ **Có với Mức 2/3** | Mức 1 không đổi model, tham số hay tần suất gọi Cloud STT. **Lưu ý gián tiếp:** G1–G4 giữ thêm các câu trước đây bị rơi, nên số câu gửi **Google Translation** tăng nhẹ, đúng bằng số câu đó. Cách tính hạn mức không đổi. Mức 2/3 PHẢI qua cổng dừng của điều phối viên. |

**Phần giao diện cho A4:**
- Mức 1: **Không** (không thêm nút, không đổi CSS).
- Mức 2: **Có**, cần ô chọn "Nghe bằng đám mây cho một ngôn ngữ" trong bảng tùy chọn họp.

## 9. Rủi ro và trường hợp biên

- **Lặp câu.** Rủi ro: `forceCommit()` chạy ở `onend` hoặc `setLangs`, sau đó final muộn của phiên cũ vẫn tới. Không xảy ra vì:
  - ở `setLangs`, phiên cũ đã bị gỡ `onend`/`onresult` hoặc đã `abort()`;
  - ở `onend`, phiên đã kết thúc;
  - `queueMeeting` còn khử lặp trong 4 giây.
- **Tạp âm thành chữ khi tắt lọc độ tin cậy.** Khi lọc được bật lại, quy tắc "chỉ bỏ câu ngắn có độ tin cậy thấp" vẫn lọc tiếng "ừ", "à" lẻ. Nếu thử thực tế thấy nhiều chữ rác, đặt lại `minConfidence`.
- **Biên bản (`state.minutes`):** `forceCommit` → `queueMeeting` lưu nguyên văn, không dịch. Hành vi này đúng.
- **Tiếng Việt chủ đạo (`viMain`):** câu `vi` chỉ được ghi lại, không đổi.
- **Chuỗi rỗng:** mọi điểm chốt mới đều kiểm `trim()`.
- **Mất mạng, từ chối micro, Safari iOS:** nhánh xử lý lỗi không đổi. `forceCommit` chỉ chạy khi `utt.lastText` có chữ.
- **Hai thiết bị cùng phòng, phòng hết hạn, người xem chưa đăng nhập, hết hạn mức:** không liên quan, vì không chạm `room.js`, Firestore hay hạn mức.
