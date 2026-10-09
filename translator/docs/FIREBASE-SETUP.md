# Thiết lập "Phòng họp xem chung" (Firebase)

Tính năng: chủ phòng bấm biểu tượng mã QR trong khung chat để tạo phòng; người trong phòng họp quét mã bằng điện thoại và xem chữ gốc + chữ dịch theo thời gian thực, tự chọn ngôn ngữ hiển thị. Người xem chỉ đọc. TV hoặc máy tính khác cũng có thể mở liên kết đó rồi bật chế độ màn hình lớn.

Lưu ý: tên mục và giao diện của Firebase thay đổi theo thời gian; hãy đối chiếu theo ý nghĩa nếu không khớp từng chữ. Các bước dưới đây tôi chưa thực hiện trên tài khoản Firebase thật của bạn. Quy tắc bảo mật và luồng chạy đã được kiểm thử bằng Firebase Emulator trên máy phát triển.

## 1. Tạo dự án Firebase
1. Vào https://console.firebase.google.com bằng **tài khoản Google của công ty**, chọn **Add project** (Thêm dự án), đặt tên (ví dụ `sonadezi-phong-hop`). Có thể tắt Google Analytics.
2. **Build → Authentication → Get started → Sign-in method**, bật **Anonymous** (Ẩn danh) và, nếu dùng tài khoản VIP, bật thêm **Email/Password** (Email/Mật khẩu).
3. **Build → Firestore Database → Create database**, chọn chế độ **Production**, chọn vùng gần Việt Nam (ví dụ Singapore). Vùng không thể đổi sau khi tạo.
4. Tạo **Web app**: ở trang tổng quan dự án bấm biểu tượng `</>` (Web), đặt tên, **không cần** bật Firebase Hosting. Firebase hiện đoạn `firebaseConfig` gồm `apiKey`, `authDomain`, `projectId`, `appId`.

## 2. Dán quy tắc bảo mật
Vào **Firestore Database → Rules**, xóa nội dung cũ, dán toàn bộ nội dung tệp `translator/firebase/firestore.rules`, bấm **Publish**.

Quy tắc này bảo đảm:
- chỉ người đăng nhập ẩn danh mới đọc/ghi; **không ai liệt kê được danh sách phòng**, phải biết mã phòng (20 ký tự ngẫu nhiên) mới đọc được;
- **Cập nhật mới:** quy tắc nay có thêm trường `utt` và tài liệu `live/now` (bản "đang nói"). Nếu bạn đã dán quy tắc cũ, **phải dán lại và Publish**; chưa dán lại thì app vẫn chạy nhưng không có bản "đang nói";
- **Laptop thứ hai:** cần xuất bản lại quy tắc (thêm `cohosts`, `secret`, `live/co`). Máy thứ hai chỉ ghi được khi nhập đúng mã mời mà chủ phòng giữ riêng;
- **chỉ chủ phòng** ghi tin nhắn và bản dịch; người xem không gửi được nội dung;
- phòng tự **hết quyền truy cập sau tối đa 24 giờ** và chủ phòng không thể kéo dài hạn.

## 3. Điền cấu hình vào `translator/config.js`
```js
firebase: { apiKey: '...', authDomain: '...', projectId: '...', appId: '...' },
room: { ttlHours: 24, maxExtraLanguages: 3 },
```
Các giá trị Firebase là **định danh công khai** của ứng dụng web, không phải mật khẩu; bảo mật nằm ở quy tắc Firestore. Nên giới hạn thêm khóa API theo tên miền: Google Cloud Console → APIs & Services → Credentials → khóa "Browser key" → *Websites* → thêm `https://sarcapteshieutd-web.github.io/*`.

## 4. Xóa dữ liệu sau khi họp
Quy tắc ở bước 2 chặn đọc/ghi khi phòng hết hạn, nhưng dữ liệu vẫn nằm trong cơ sở dữ liệu cho tới khi bị xóa. Có hai cách dọn:

- **Xóa ngay khi kết thúc (không cần thanh toán, khuyến nghị):** trong cửa sổ phòng họp bấm **Kết thúc và xóa nội dung ngay**; app xóa toàn bộ tin nhắn, hồ sơ người xem và phòng khỏi Firestore (không hoàn tác được). Nút **Kết thúc, giữ nội dung đến khi hết hạn** chỉ đóng phòng, nội dung vẫn xem được đến hết hạn. Nếu chủ phòng quên bấm hoặc đóng trình duyệt giữa chừng, dữ liệu vẫn nằm lại (không ai đọc được sau khi hết hạn) và có thể xóa tay trong Firestore Console.
- **TTL tự động (cần bật thanh toán):** chính sách TTL của Firestore yêu cầu dự án có liên kết tài khoản thanh toán; nếu chưa, lệnh sẽ báo `billing disabled`. Khi đã bật thanh toán, trong Google Cloud Shell chạy:
```bash
gcloud config set project TEN_DU_AN
gcloud firestore fields ttls update expiresAt --collection-group=rooms --enable-ttl --async
gcloud firestore fields ttls update expiresAt --collection-group=messages --enable-ttl --async
gcloud firestore fields ttls update expiresAt --collection-group=viewers --enable-ttl --async
gcloud firestore fields ttls list
```
  Việc xóa theo TTL không đúng thời điểm hết hạn mà thường chậm hơn; hãy đặt ngân sách cảnh báo ở mục Billing.

## 5. Dùng thử
1. Merge thay đổi để GitHub Pages cập nhật; mở app, bấm biểu tượng mã QR ở góc khung chat, bấm **Tạo phòng họp**.
2. Dùng điện thoại quét mã, chọn ngôn ngữ hiển thị.
3. Bấm **Chế độ họp** hoặc gõ chữ ở laptop chủ phòng; điện thoại người xem hiện bản tin ngay.
4. Bấm **Kết thúc phòng** khi họp xong; người xem sẽ thấy thông báo phòng đã kết thúc (nội dung vẫn xem được tới khi hết hạn).

## 6. Cách hoạt động và chi phí
- **Chủ phòng giữ khóa Google Cloud Translation.** Khi người xem chọn ngôn ngữ khác với cặp ngôn ngữ của chủ phòng, **laptop chủ phòng dịch thêm** cho ngôn ngữ đó và ghi lên phòng. Mỗi ngôn ngữ phụ làm tăng số ký tự dịch, nên chi phí dịch nhân lên theo số ngôn ngữ phụ. Giới hạn `maxExtraLanguages` (mặc định 3) để kiểm soát. Nếu laptop chủ phòng tắt hoặc mất mạng, người xem chỉ thấy bản dịch của chủ phòng.
- **Firebase** tính phí theo số lần đọc/ghi và dung lượng. Mỗi tin nhắn gồm một lần ghi, cộng thêm một lần ghi cho mỗi ngôn ngữ phụ; mỗi người xem đọc lại mỗi thay đổi. Gói miễn phí (Spark) theo tài liệu Firebase tại thời điểm tra cứu: **1 GiB lưu trữ; 50.000 lượt đọc/ngày; 20.000 lượt ghi/ngày; 20.000 lượt xóa/ngày; 10 GiB dữ liệu ra/tháng**; bộ đếm ngày đặt lại khoảng nửa đêm giờ Thái Bình Dương. Hãy đối chiếu lại tại firebase.google.com/pricing vì hạn mức có thể thay đổi.
- **Ước tính (không phải số đo thực tế):** cuộc họp 2 giờ, 7 người xem, khoảng 150 câu: khoảng 4.000 lượt ghi (gồm bản "đang nói") và 30.000 lượt đọc, trong hạn mức miễn phí của một ngày. Có thể giảm bằng cách tăng `room.liveIntervalMs` trong `config.js` (ví dụ 2000; mặc định 800) hoặc dùng ít ngôn ngữ phụ.
- **Quyền riêng tư:** nội dung họp được lưu trên máy chủ Firebase đến khi hết hạn (tối đa 24 giờ). Hãy đối chiếu quy định bảo mật nội bộ của công ty trước khi dùng cho nội dung nhạy cảm. Chỉ người có mã QR/liên kết xem được, nên chỉ chia sẻ cho người được phép.

## 7. Build lại thư viện phòng họp (chỉ khi sửa `src/room.js`)
`room.bundle.js` được đóng gói từ `src/room.js` (Firebase SDK + thư viện tạo mã QR). Chỉ tải khi mở phòng họp hoặc khi người xem vào bằng liên kết, nên không làm chậm trang chính.
```bash
cd translator
npm i firebase qrcode-generator esbuild
npx esbuild src/room.js --bundle --minify --format=iife --target=es2020 --outfile=room.bundle.js
```

## 8. Kiểm thử quy tắc bảo mật
- `firebase/rules-test.js`: 51 kiểm tra cho phòng họp (người lạ, người xem, chủ phòng, phòng hết hạn…).
- `firebase/rules-test-vip.js`: 48 kiểm tra cho tài khoản VIP (tự nâng quyền, đọc khóa khi chờ duyệt/bị khóa/hết hạn, quyền quản trị…).
Cả hai chạy với Firebase Emulator, xem hướng dẫn ở đầu mỗi tệp.

## 9. Tài khoản VIP và quản trị
Tính năng: người dùng tự đăng ký, quản trị viên duyệt và cấp hạn dùng theo tháng, VIP nhận khóa Google dùng chung từ máy chủ, quản trị viên theo dõi mức sử dụng. Dùng chung dự án Firebase của phòng họp.

Lưu ý: các bước dưới đây tôi đã kiểm thử bằng Firebase Emulator (quy tắc bảo mật và luồng trên trình duyệt), **chưa** thực hiện trên dự án Firebase thật của bạn.

### 9.1. Thiết lập một lần
1. **Authentication → Sign-in method:** bật **Email/Password**.
2. **Firestore Database → Rules:** dán lại toàn bộ nội dung `translator/firebase/firestore.rules` (đã có thêm phần `users`, `admins`, `config`) và bấm **Publish**. Chưa dán lại thì đăng ký/đăng nhập VIP sẽ báo "Không đủ quyền".
3. **Đăng ký tài khoản của bạn** trong ứng dụng (màn hình chọn tài khoản → Đăng ký tài khoản VIP). Màn hình chờ duyệt hiện **Mã tài khoản**, hãy sao chép mã này.
4. **Cấp quyền quản trị:** Firestore Database → **Start collection** (hoặc **Add collection**) đặt tên `admins` → **Document ID** = mã tài khoản vừa sao chép → thêm một trường bất kỳ (ví dụ `role` = `admin`) → **Save**. Đây là cách duy nhất cấp quyền quản trị: ứng dụng không thể tự ghi vào `admins`, nên không ai tự nâng quyền được.
5. Bấm **Kiểm tra lại** (hoặc tải lại trang). Tài khoản của bạn thành *Quản trị viên*; *Cài đặt* có nút **Quản trị tài khoản và hạn mức**.
6. Trong bảng quản trị, nhập **Khóa Google dùng chung** (Cloud Translation + Cloud Text-to-Speech) và hạn mức dịch/đọc mỗi tháng, bấm **Lưu**. Nên giới hạn khóa theo tên miền (HTTP referrer) và theo API.
7. Điền thông tin nhận thanh toán trong `config.js` (`donate.bank`, `donate.qrImage`, `plans`): thông tin này hiện cho người chờ duyệt.

### 9.2. Vận hành hằng ngày
- Người dùng đăng ký và chuyển khoản; quản trị viên mở bảng quản trị, mục **Chờ duyệt**, bấm **Duyệt 1 tháng** sau khi đối chiếu tiền đã nhận (nội dung chuyển khoản là email của người dùng). Người dùng được kích hoạt ngay, không cần tải lại.
- Gia hạn: **Gia hạn +1 tháng**. Muốn thu quyền ngay: **Khóa** (VIP đang mở sẽ bị hạ về Miễn phí trong vài giây và không nhận lại khóa Google).
- Theo dõi: mục **Hạn mức Google tháng này** cộng số ký tự do các thiết bị VIP tự báo. Đây không phải số đo của Google; hãy đối chiếu với Google Cloud Console và đặt **Budget alert** trong Billing.

### 9.3. Cơ chế bảo vệ và giới hạn
- **Máy chủ kiểm soát:** quy tắc Firestore chỉ trả khóa Google (`config/google`) cho quản trị viên hoặc người có hồ sơ `active` và còn hạn (`expiresAt`). Chỉ quản trị viên đổi được trạng thái và hạn dùng; người dùng chỉ ghi được tên, số liệu tự báo và lần dùng gần nhất.
- **Giới hạn:** khóa đã được trả về trình duyệt thì người dùng có kỹ thuật vẫn có thể sao chép. Hết hạn chỉ chặn việc **nhận khóa lần sau**, không thu hồi khóa đã sao chép. Vì vậy hãy giới hạn khóa theo tên miền, đặt ngân sách cảnh báo và **đổi khóa Google định kỳ** (nhập khóa mới trong bảng quản trị; người dùng còn hạn tự nhận khóa mới ở lần mở sau).
- Số liệu sử dụng do thiết bị tự báo, người dùng có thể báo sai; chỉ dùng để tham khảo.
- **Chi phí Firebase:** mỗi lần mở ứng dụng VIP đọc hồ sơ và khóa; mỗi 20 giây hoạt động ghi một lần số liệu sử dụng. Với số người dùng nhỏ, thường nằm trong hạn mức miễn phí của Firestore (hãy đối chiếu bảng giá hiện hành).
- Quên mật khẩu dùng thư đặt lại của Firebase Authentication. Muốn đổi mẫu thư: Authentication → Templates.
