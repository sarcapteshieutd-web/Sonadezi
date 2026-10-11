# Thiết kế: Họp song ngữ tự phát hiện Anh/Việt bằng nhận dạng đám mây

Ngày: 11/10/2026 · Phạm vi mã: `translator/` · Nhánh đăng GitHub Pages: `claude/realtime-translation-app-68o1ik`

## 1. Mục tiêu
Khi hai bên nói xen kẽ tiếng Anh và tiếng Việt trong cuộc họp, ứng dụng tự nhận biết **ngôn ngữ của từng câu**, đặt câu gốc vào đúng cột (Anh bên trái, Việt bên phải) và dịch sang ngôn ngữ còn lại, mà không ai phải bấm đổi người nói.

Nguyên nhân phải làm: nhận dạng giọng nói của trình duyệt chỉ nghe được **một ngôn ngữ mỗi lần** và không tự phát hiện ngôn ngữ; thử nghiệm trên iPad Chrome (trang `probe-stt.html`) cho thấy hai phiên song song **hủy lẫn nhau** (`aborted: Another request is started`). Vì vậy dùng dịch vụ nhận dạng đám mây hỗ trợ khai báo nhiều ngôn ngữ.

## 2. Phạm vi
**Trong phạm vi**
- Nút bật/tắt "Song ngữ (tự nhận Anh/Việt)" trong chế độ họp, chỉ cho tài khoản VIP và quản trị viên.
- Nhận dạng đám mây Google Speech-to-Text, cặp cố định Anh (en-US) – Việt (vi-VN).
- Ô chọn micro (để chọn loa họp EMEET M0 Plus thay vì micro laptop), nhớ lựa chọn.
- Đo số phút sử dụng, hạn mức tổng và hạn mức mỗi VIP do quản trị viên đặt, hành vi khi hết hạn mức (do quản trị viên chọn).
- Nút "Thử 5 giây" trong bảng quản trị để kiểm tra khóa API và dịch vụ.

**Ngoài phạm vi**
- Chế độ hội nghị: giữ nguyên nhận dạng trình duyệt, một ngôn ngữ cố định; nút song ngữ bị vô hiệu khi bật hội nghị.
- Cặp ngôn ngữ khác ngoài Anh–Việt; nhận diện danh tính người nói.
- Chữ hiện dần khi đang nói (dịch vụ chỉ trả kết quả sau khi người nói ngắt).
- Máy chủ trung gian; mọi thứ vẫn chạy hoàn toàn trên trình duyệt như hiện nay.

## 3. Quyết định đã chốt với người dùng
1. "Nhận diện giọng" = tự phát hiện ngôn ngữ nói, không phải nhận diện người nói.
2. Chỉ áp dụng cho họp song ngữ.
3. Dùng cho VIP và quản trị viên, giống Google dịch và giọng WaveNet hiện có.
4. Hết hạn mức: quản trị viên chọn một trong hai — **quay về nhận dạng trình duyệt (miễn phí, mặc định)** hoặc **cho dùng tiếp** (cảnh báo đỏ, ghi nhận phần vượt).
5. Thiết bị họp: laptop và loa EMEET M0 Plus; người dùng tự bật Speech-to-Text và nhập khóa API sau.

## 4. Kiến trúc

### 4.1. Tệp mới `translator/stt-cloud.js`
Đơn vị độc lập, nạp trước `app.js`, thêm vào `CORE` của `service-worker.js`. Không phụ thuộc `app.js`.

Giao diện công khai (`window.CloudSTT`):
```
CloudSTT.start({ deviceId, apiKey, onSegment, onLevel, onError })
  // onSegment({ text, lang: 'en'|'vi', seconds, confidence })
CloudSTT.pause() / CloudSTT.resume()   // tạm dừng khi ứng dụng đọc bản dịch ra loa
CloudSTT.stop()
CloudSTT.listDevices()                 // danh sách micro (cần quyền micro để có nhãn)
CloudSTT.probe({ apiKey, deviceId })   // thu 5 giây rồi gọi API, trả kết quả/ lỗi để hiện trong bảng quản trị
```
Các hàm thuần (cắt đoạn, mã hóa PCM, hạ tần số lấy mẫu, ánh xạ mã ngôn ngữ, tính giây tính phí) được tách riêng và xuất qua `module.exports` để kiểm thử bằng Node.

### 4.2. Thu âm và cắt đoạn
- `getUserMedia({ audio: { deviceId, echoCancellation: true, noiseSuppression: true, autoGainControl: true } })`.
- Ưu tiên `AudioWorklet`, dự phòng `ScriptProcessor`; hạ về PCM 16 kHz, 16 bit, đơn kênh (LINEAR16). Không dùng `MediaRecorder` vì Safari/Chrome trên iOS xuất AAC/MP4, định dạng mà API nhận dạng của Google không nhận (nhận định này chưa kiểm chứng trực tiếp; LINEAR16 là định dạng chắc chắn được hỗ trợ).
- Cắt đoạn theo năng lượng (RMS) với ngưỡng thích nghi theo mức ồn nền:
  - kết thúc đoạn sau **0,7 s** im lặng; giữ **0,3 s** đầu câu; bỏ đoạn ngắn hơn **0,4 s**; ép cắt ở **25 s**.
  - Các hằng số đặt ở đầu tệp để chỉnh; giá trị là khởi điểm, **chưa kiểm tra trong phòng họp thật**.
- Chỉ gửi đoạn có tiếng nói, nên số phút tính tiền thấp hơn thời lượng cuộc họp.

### 4.3. Gọi API
`POST https://speech.googleapis.com/v1/speech:recognize?key=<khóa>` (V1, đúng mô hình khóa API như Translation và Text-to-Speech hiện có):
```
config: { encoding: 'LINEAR16', sampleRateHertz: 16000, languageCode: 'en-US',
          alternativeLanguageCodes: ['vi-VN'], enableAutomaticPunctuation: true }
audio:  { content: <PCM base64> }
```
Kết quả: `results[0].alternatives[0].transcript`, `results[0].languageCode` (ánh xạ tiền tố `en`/`vi`; ngôn ngữ ngoài cặp thì bỏ qua đoạn đó). Mỗi đoạn tối đa 25 s ≈ 0,8 MB PCM, nằm trong giới hạn của API đồng bộ.

Khóa lấy từ `cloudKey()` hiện có (khóa dùng chung do quản trị viên nhập, hoặc khóa quản trị viên tự nhập). Khóa phải được bật cho dịch vụ Speech-to-Text trong phần "API restrictions".

Chưa xác nhận: V1 có hỗ trợ tốt cặp Anh–Việt qua `alternativeLanguageCodes` hay không (tài liệu nêu tối đa 3 ngôn ngữ phụ). "Thử 5 giây" sinh ra để phát hiện sớm vấn đề này; nếu V1 không đạt, thiết kế chuyển sang V2 (cần sửa cách xác thực).

### 4.4. Tích hợp `app.js`
- `startMeeting()`: nếu `state.bilingual` bật và đủ điều kiện (VIP/quản trị viên, không `state.conf`, có khóa, chưa chặn vì hạn mức) thì dùng `CloudSTT.start(...)` thay cho `beginSession()`; ngược lại giữ luồng cũ.
- Đặt `state.mine = 'en'` ở chế độ song ngữ để tiếng Anh nằm cột trái, tiếng Việt cột phải; mỗi mục lịch sử đã có `from/to` nên cột hiển thị theo từng câu (`renderDualItem` dùng `lang === item.from`).
- `queueMeeting(text, pre, from, to)`: thêm hai tham số tùy chọn (mặc định `state.src/state.tgt`), nên luồng cũ không đổi. Đoạn nhận dạng đám mây gọi với `from` là ngôn ngữ phát hiện, `to` là ngôn ngữ còn lại.
- Đọc bản dịch ra loa (`enqueueSpeech`) đã nhận ngôn ngữ đích qua tham số; khi đang đọc, gọi `CloudSTT.pause()` và `resume()` sau đó để không thu lại tiếng của chính ứng dụng.
- Không dùng nhận dạng trình duyệt khi chạy song ngữ (một micro, một nguồn nhận dạng).

### 4.5. Đo, hạn mức và hành vi khi hết hạn mức
- Loại đo mới `stt`, đơn vị **giây** (làm tròn lên 1 giây mỗi đoạn, như cách Google tính), hiển thị bằng phút. Báo lên hồ sơ bằng `reportUsage('stt', giây)` theo cơ chế gộp 20 giây hiện có.
- Cấu hình mới trong `config/google`: `sttLimit` (tổng, phút/tháng), `userStt` (mỗi VIP, phút/tháng), `sttOver` (`'fallback'` hoặc `'continue'`; mặc định `'fallback'`). `0` = không giới hạn.
- Cấu hình mới trong `config/billing`: `sttPrice` (USD/phút). Mặc định 0,016 và hiển thị rõ là **chưa xác minh**; quản trị viên sửa được.
- Kiểm tra trước mỗi đoạn gửi đi: dùng số liệu hồ sơ trên máy chủ (tính chung mọi thiết bị) cộng phần chưa báo.
  - 80%: cảnh báo một lần.
  - Hết hạn mức, `fallback`: dừng `CloudSTT`, thông báo, tự chuyển sang `beginSession()` (nhận dạng trình duyệt một ngôn ngữ; ngôn ngữ nghe là ngôn ngữ của đoạn cuối được phát hiện); người dùng vẫn đổi được bằng nút ⇄ như cũ.
  - Hết hạn mức, `continue`: vẫn gửi, đánh dấu đỏ, ghi nhận phần vượt, thông báo mỗi ngày một lần. Rủi ro chi phí không có trần; tài liệu hướng dẫn nhắc đặt Budget alert trong Google Cloud.
- Bảng quản trị: thêm thước đo "Google Speech-to-Text (phút)" cạnh các thước đo hiện có, ô hạn mức tổng và mỗi VIP, lựa chọn `sttOver`, đơn giá và ước tính chi phí.
- Giống phần dịch và đọc hiện nay: số liệu do thiết bị tự báo nên chỉ để tham khảo, không phải số đo của Google; giới hạn thực thi ở phía trình duyệt.

### 4.6. Thay đổi lớp Firebase
- `src/room.js`: `saveGoogleConfig` nhận thêm `sttLimit`, `userStt`, `sttOver`; `saveBillingConfig` nhận thêm `sttPrice`. Phải **xây lại `room.bundle.js`** bằng esbuild theo `docs/FIREBASE-SETUP.md` mục 7 (đã kiểm tra registry npm truy cập được).
- `firebase/firestore.rules`: bổ sung các khóa mới vào danh sách `hasOnly` của `config/google` và `config/billing`, kèm kiểm tra kiểu. Người dùng đã vận hành dự án thật **phải dán lại toàn bộ quy tắc và bấm Publish** (nêu rõ trong hướng dẫn, giống mục 9.4 hiện có).
- Mở rộng `firebase/rules-test-vip.js` cho các khóa mới.

### 4.7. Giao diện
- Thanh chế độ họp: ô chọn "Song ngữ (tự nhận Anh/Việt)" và danh sách micro; hiện thanh mức âm và trạng thái "Đang nghe (đám mây)"; hiện số phút đã dùng khi có hạn mức. Ô song ngữ bị vô hiệu cùng lời giải thích khi bật chế độ hội nghị hoặc khi tài khoản không phải VIP.
- Lưu `bilingual` và `micId` vào bộ nhớ cục bộ.

## 5. Xử lý lỗi
| Tình huống | Hành vi |
|---|---|
| Chưa có khóa | Nút song ngữ bị vô hiệu; thông báo hướng dẫn liên hệ quản trị viên |
| 400/403 (dịch vụ chưa bật, khóa bị hạn chế) | Thông báo rõ tiếng Việt, tự quay về nhận dạng trình duyệt |
| Mất mạng, 5xx | Thử lại một lần; nếu vẫn lỗi thì giữ đoạn đã thu, báo "Mất kết nối" và tiếp tục thu; không mất đoạn âm thanh đang chờ |
| Từ chối quyền micro / không có micro | Thông báo và quay về luồng cũ |
| Ngôn ngữ phát hiện ngoài Anh–Việt, văn bản rỗng | Bỏ qua đoạn nhưng vẫn tính phút (Google vẫn tính tiền) |

## 6. Kiểm thử
- **Tự động (Node):** cắt đoạn trên tín hiệu giả lập (im lặng, một câu, hai câu cách nhau, câu quá dài); mã hóa PCM và hạ tần số; ánh xạ mã ngôn ngữ; tính giây tính phí và logic hạn mức (80%, hết hạn mức ở hai chế độ).
- **Quy tắc Firestore:** mở rộng bộ kiểm thử; chỉ chạy được nếu môi trường có Firebase Emulator, nếu không sẽ ghi rõ là chưa chạy.
- **Cú pháp** mọi tệp thay đổi, và xây lại bundle thành công.
- **Thủ công (cần khóa thật và micro thật; tôi không thực hiện được):**
  1. Nút "Thử 5 giây" thành công; đo độ chính xác Anh/Việt.
  2. Họp thử với EMEET: nói xen kẽ Anh/Việt; câu vào đúng cột, dịch đúng chiều.
  3. Đo độ trễ từ lúc ngắt nói đến lúc hiện chữ.
  4. Hạn mức: đặt hạn mức nhỏ, kiểm tra cảnh báo 80%, hết hạn mức ở cả hai chế độ.
  5. Bật đọc bản dịch ra loa: kiểm tra không thu lại tiếng đọc.

## 7. Rủi ro và điều chưa xác định
- V1 có đủ tốt cho cặp Anh–Việt hay không (xem 4.3).
- Giá thực tế và gói miễn phí hằng tháng chưa xác minh (nguồn thứ cấp mâu thuẫn về việc 60 phút miễn phí có áp dụng cho V2 hay không).
- Độ trễ cao hơn hiện tại do phải chờ người nói ngắt; chưa đo.
- Chế độ `continue` không có trần chi phí.
- Khóa API đặt trong trình duyệt, giống Translation và Text-to-Speech hiện nay: có thể bị sao chép; giảm thiểu bằng giới hạn theo tên miền, giới hạn theo dịch vụ, Budget alert và đổi khóa định kỳ (đã nêu ở `docs/FIREBASE-SETUP.md` mục 9.3).

## 8. Bàn giao
- Mã đưa lên nhánh `claude/realtime-translation-app-68o1ik` (nhánh đăng GitHub Pages); tăng phiên bản cache service worker.
- Cập nhật `translator/HUONG-DAN.md` và `docs/FIREBASE-SETUP.md`: bật Speech-to-Text, quyền của khóa API, dán lại quy tắc Firestore, cách dùng nút song ngữ và chọn micro EMEET.
