# Thiết lập phòng họp song ngữ: 2 laptop đối diện + điện thoại thành viên

Sơ đồ: [`so-do-phong-hop-2-laptop.svg`](so-do-phong-hop-2-laptop.svg) (mở bằng trình duyệt).

## 1. Phần cứng

| Vị trí | Thiết bị | Ghi chú |
|---|---|---|
| Bên Việt | Laptop 1 (chủ phòng) + micro riêng | Tai nghe có mic hoặc micro USB đặt gần người nói |
| Bên Anh | Laptop 2 + micro riêng | Như trên |
| Thành viên khác | Điện thoại cá nhân + tai nghe | Chỉ nghe/xem, không cần cài gì |
| Mạng | Wi-Fi ổn định cho cả laptop và điện thoại | Nhận diện giọng nói và dịch đều cần mạng |

Nguyên tắc: **mỗi laptop một micro riêng, đặt gần người nói của bên đó**. Hai máy đặt xa nhau, hạ âm lượng loa. Nếu hai bên đeo **tai nghe có mic**, tiếng đọc bản dịch không lọt sang micro máy kia (nên dùng nếu bật chức năng đọc bản dịch).

Lưu ý: cách bố trí này chưa được kiểm chứng ở phòng họp thật. Nên chạy thử trước buổi họp.

## 2. Chuẩn bị trước buổi họp (một lần)

1. Dùng **Chrome** trên cả hai laptop và trên điện thoại (Android). Trên iPhone dùng Safari (iOS 14.5 trở lên).
2. Mở ứng dụng bằng HTTPS (trang `sarcapteshieutd-web.github.io`). Khi trình duyệt hỏi, chọn **Cho phép micro**.
3. Trong Windows: Cài đặt → Hệ thống → Âm thanh, chọn đúng micro làm **thiết bị đầu vào** của từng laptop.
4. (Tùy chọn) Dịch bằng Google: ⚙ → *Google Cloud Translation* → dán khóa API; đặt giới hạn ký tự mỗi ngày. Nếu không, ứng dụng dùng MyMemory miễn phí.
5. Quy tắc Firestore phải đã được dán và Publish (đã làm khi phòng họp chạy được).

## 3. Thiết lập tại phòng họp

**Laptop 1 (bên Việt, chủ phòng)**
1. Mở ứng dụng. Chọn ngôn ngữ nguồn **Tiếng Việt**, đích **Tiếng Anh**.
2. Bấm biểu tượng **Phòng họp** (hình mã QR) → **Tạo phòng họp**.
3. Trong hộp này có hai mã:
   - **Mã QR người xem** (phần trên): dành cho điện thoại thành viên.
   - **Liên kết/QR "Laptop thứ hai"** (kéo xuống): chỉ dùng cho laptop 2. **Không chia sẻ cho người xem.**
4. Bấm **Chế độ họp**.

**Laptop 2 (bên Anh)**
1. Mở **liên kết Laptop thứ hai** (gửi qua email/chat, hoặc quét mã QR đó bằng điện thoại rồi chuyển liên kết sang máy).
2. Máy tự lấy ngôn ngữ ngược lại: nói **Tiếng Anh**, dịch sang **Tiếng Việt**.
3. Chọn **Giọng nói vào** phù hợp (US, UK, AU, ZA…) trong ô dưới thanh ngôn ngữ.
4. Bấm **Chế độ họp**.

**Điện thoại thành viên**
1. Quét **mã QR người xem** trên laptop 1.
2. Chọn ngôn ngữ muốn đọc.
3. Muốn nghe thay vì đọc: cắm tai nghe và bật **"Đọc bản dịch bằng tai nghe"**.

## 4. Trong buổi họp

- Nói từng người một; hết câu chờ khoảng 1 đến 2 giây.
- Laptop 1 chỉ nghe tiếng Việt, laptop 2 chỉ nghe tiếng Anh. Hai màn hình hiện chung một cuộc hội thoại.
- Nếu muốn mỗi bên nghe bản dịch lời bên kia qua tai nghe, bật **"Đọc bản dịch ra loa"** trong Chế độ họp.
- Khi cần kết thúc: bấm **Dừng họp**; ở laptop 1 có thể kết thúc phòng và xóa dữ liệu.

## 5. Xử lý sự cố nhanh

| Hiện tượng | Cách xử lý |
|---|---|
| Laptop 2 hiện chữ nhưng không lên khung chat | Tải lại trang để nhận bản mới; ứng dụng tự chốt câu sau khoảng 1,5 giây im lặng |
| Máy này dịch cả tiếng đọc của máy kia | Đeo tai nghe, hạ loa, đặt hai máy xa nhau |
| Tên công ty nhận diện sai | Báo chữ máy hiện ra để thêm vào bảng sửa lỗi trong `config.js` |
| Điện thoại không thấy nội dung | Kiểm tra mạng; quét lại QR người xem (không dùng liên kết máy thứ 2) |
| Dịch báo lỗi 403 (khi dùng Google) | Kiểm tra khóa API, đã bật Cloud Translation API, và khóa cho phép địa chỉ trang web |
