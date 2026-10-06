# Thiết lập "Phòng họp xem chung" (Firebase)

Tính năng: chủ phòng bấm biểu tượng mã QR trong khung chat để tạo phòng; người trong phòng họp quét mã bằng điện thoại và xem chữ gốc + chữ dịch theo thời gian thực, tự chọn ngôn ngữ hiển thị. Người xem chỉ đọc. TV hoặc máy tính khác cũng có thể mở liên kết đó rồi bật chế độ màn hình lớn.

Lưu ý: tên mục và giao diện của Firebase thay đổi theo thời gian; hãy đối chiếu theo ý nghĩa nếu không khớp từng chữ. Các bước dưới đây tôi chưa thực hiện trên tài khoản Firebase thật của bạn. Quy tắc bảo mật và luồng chạy đã được kiểm thử bằng Firebase Emulator trên máy phát triển.

## 1. Tạo dự án Firebase
1. Vào https://console.firebase.google.com bằng **tài khoản Google của công ty**, chọn **Add project** (Thêm dự án), đặt tên (ví dụ `sonadezi-phong-hop`). Có thể tắt Google Analytics.
2. **Build → Authentication → Get started → Sign-in method**, bật **Anonymous** (Ẩn danh).
3. **Build → Firestore Database → Create database**, chọn chế độ **Production**, chọn vùng gần Việt Nam (ví dụ Singapore). Vùng không thể đổi sau khi tạo.
4. Tạo **Web app**: ở trang tổng quan dự án bấm biểu tượng `</>` (Web), đặt tên, **không cần** bật Firebase Hosting. Firebase hiện đoạn `firebaseConfig` gồm `apiKey`, `authDomain`, `projectId`, `appId`.

## 2. Dán quy tắc bảo mật
Vào **Firestore Database → Rules**, xóa nội dung cũ, dán toàn bộ nội dung tệp `translator/firebase/firestore.rules`, bấm **Publish**.

Quy tắc này bảo đảm:
- chỉ người đăng nhập ẩn danh mới đọc/ghi; **không ai liệt kê được danh sách phòng**, phải biết mã phòng (20 ký tự ngẫu nhiên) mới đọc được;
- **chỉ chủ phòng** ghi tin nhắn và bản dịch; người xem không gửi được nội dung;
- phòng tự **hết quyền truy cập sau tối đa 24 giờ** và chủ phòng không thể kéo dài hạn.

## 3. Điền cấu hình vào `translator/config.js`
```js
firebase: { apiKey: '...', authDomain: '...', projectId: '...', appId: '...' },
room: { ttlHours: 24, maxExtraLanguages: 3 },
```
Các giá trị Firebase là **định danh công khai** của ứng dụng web, không phải mật khẩu; bảo mật nằm ở quy tắc Firestore. Nên giới hạn thêm khóa API theo tên miền: Google Cloud Console → APIs & Services → Credentials → khóa "Browser key" → *Websites* → thêm `https://sarcapteshieutd-web.github.io/*`.

## 4. Tự động xóa dữ liệu sau khi hết hạn (nên làm)
Quy tắc ở bước 2 đã chặn đọc khi hết hạn, nhưng dữ liệu vẫn nằm trong cơ sở dữ liệu cho tới khi bị xóa. Để tự xóa, bật **TTL** (Time-to-live) cho trường `expiresAt` ở các nhóm bộ sưu tập `rooms`, `messages` và `viewers`:
- Firebase Console → Firestore → tab **Time-to-live** (hoặc Google Cloud Console → Firestore → TTL), tạo chính sách cho trường `expiresAt` của từng nhóm.
- Tôi chưa xác nhận TTL có sẵn ở gói miễn phí hiện hành hay chỉ ở gói trả phí, và xóa theo TTL **không xảy ra đúng thời điểm** mà thường chậm hơn. Hãy đối chiếu tài liệu Firebase. Nếu không dùng TTL, vẫn có thể xóa thủ công trong Firestore Console.

## 5. Dùng thử
1. Merge thay đổi để GitHub Pages cập nhật; mở app, bấm biểu tượng mã QR ở góc khung chat, bấm **Tạo phòng họp**.
2. Dùng điện thoại quét mã, chọn ngôn ngữ hiển thị.
3. Bấm **Chế độ họp** hoặc gõ chữ ở laptop chủ phòng; điện thoại người xem hiện bản tin ngay.
4. Bấm **Kết thúc phòng** khi họp xong; người xem sẽ thấy thông báo phòng đã kết thúc (nội dung vẫn xem được tới khi hết hạn).

## 6. Cách hoạt động và chi phí
- **Chủ phòng giữ khóa Google Cloud Translation.** Khi người xem chọn ngôn ngữ khác với cặp ngôn ngữ của chủ phòng, **laptop chủ phòng dịch thêm** cho ngôn ngữ đó và ghi lên phòng. Mỗi ngôn ngữ phụ làm tăng số ký tự dịch, nên chi phí dịch nhân lên theo số ngôn ngữ phụ. Giới hạn `maxExtraLanguages` (mặc định 3) để kiểm soát. Nếu laptop chủ phòng tắt hoặc mất mạng, người xem chỉ thấy bản dịch của chủ phòng.
- **Firebase** tính phí theo số lần đọc/ghi và dung lượng. Mỗi tin nhắn gồm một lần ghi, cộng thêm một lần ghi cho mỗi ngôn ngữ phụ; mỗi người xem đọc lại mỗi thay đổi. Hạn mức miễn phí và giá hiện hành bạn kiểm tra tại trang giá Firebase; tôi chưa xác minh con số.
- **Quyền riêng tư:** nội dung họp được lưu trên máy chủ Firebase đến khi hết hạn (tối đa 24 giờ). Hãy đối chiếu quy định bảo mật nội bộ của công ty trước khi dùng cho nội dung nhạy cảm. Chỉ người có mã QR/liên kết xem được, nên chỉ chia sẻ cho người được phép.

## 7. Build lại thư viện phòng họp (chỉ khi sửa `src/room.js`)
`room.bundle.js` được đóng gói từ `src/room.js` (Firebase SDK + thư viện tạo mã QR). Chỉ tải khi mở phòng họp hoặc khi người xem vào bằng liên kết, nên không làm chậm trang chính.
```bash
cd translator
npm i firebase qrcode-generator esbuild
npx esbuild src/room.js --bundle --minify --format=iife --target=es2020 --outfile=room.bundle.js
```

## 8. Kiểm thử quy tắc bảo mật
`firebase/rules-test.js` chạy 26 kiểm tra (người lạ, người xem, chủ phòng, phòng hết hạn…) với Firebase Emulator. Xem hướng dẫn ở đầu tệp.
