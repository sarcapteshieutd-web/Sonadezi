# Ứng dụng Dịch Thời Gian Thực (PWA) – Anh / Trung / Việt

## 1. Cấu trúc thư mục

```
translator/
├── index.html           # Giao diện (Tailwind CSS, mobile-first)
├── app.js               # Logic: dịch, nhận diện giọng nói, đọc văn bản, cài đặt PWA
├── styles.css           # CSS Tailwind đã build sẵn (không cần mạng/CDN)
├── tailwind.config.js   # Bảng màu thương hiệu Sonadezi (chỉ cần khi sửa giao diện)
├── input.css
├── config.js            # Cấu hình nút Ủng hộ / gói sử dụng (sửa tệp này, không cần sửa mã)
├── manifest.json        # Khai báo PWA (tên, biểu tượng, màu, chế độ standalone)
├── service-worker.js    # Cache để cài được và chạy khi mạng yếu
├── HUONG-DAN.md         # Tài liệu này
└── icons/
    ├── logo-mark.png / logo-full.png   # Logo công ty
    ├── icon-192.png
    ├── icon-512.png
    ├── icon-512-maskable.png
    └── apple-touch-icon.png
```

Ứng dụng là HTML/CSS/JS thuần, không cần build, nên triển khai chỉ bằng cách tải thư mục lên hosting tĩnh.

## 2. Chạy thử trên máy

PWA và micro chỉ hoạt động trên **HTTPS** hoặc `localhost`:

```bash
cd translator
python3 -m http.server 8080
# mở http://localhost:8080
```

## 3. Triển khai miễn phí

Lưu ý: kho mã hiện có sẵn một ứng dụng khác ở thư mục gốc. Nếu triển khai cả kho, ứng dụng dịch nằm tại `https://<tên-miền>/translator/`. Nếu muốn link riêng, hãy tạo kho GitHub mới và chép nội dung thư mục `translator/` vào gốc kho đó.

### Cách A – Netlify (nhanh nhất, không cần Git)
1. Truy cập https://app.netlify.com/drop và đăng nhập.
2. Kéo thả **thư mục `translator`** vào khung "Drag and drop".
3. Sau vài giây Netlify cấp link dạng `https://ten-ngau-nhien.netlify.app`. Có thể đổi tên tại *Site configuration → Change site name*.

### Cách B – Vercel
1. Đăng nhập https://vercel.com bằng GitHub, chọn *Add New → Project*, chọn kho chứa mã.
2. Mục *Root Directory* chọn `translator` (hoặc để trống nếu đã chép vào gốc kho riêng).
3. *Framework Preset*: **Other**; để trống Build Command và Output Directory; bấm *Deploy*.
4. Nhận link dạng `https://ten-du-an.vercel.app`.

### Cách C – GitHub Pages
1. Đưa mã lên GitHub (nhánh `main`).
2. Vào *Settings → Pages → Build and deployment*: Source = *Deploy from a branch*, chọn nhánh `main`, thư mục `/ (root)`, bấm *Save*.
3. Link: `https://<tài-khoản>.github.io/<tên-kho>/translator/` (hoặc không có `/translator/` nếu đã chép vào gốc kho riêng).

| Tiêu chí | Netlify | Vercel | GitHub Pages |
|---|---|---|---|
| Độ nhanh triển khai | Rất nhanh, kéo thả | Nhanh, cần Git | Trung bình, cần Git |
| Link ngắn, đổi tên | Có | Có | Gắn với tên tài khoản/kho |
| Tự cập nhật khi đẩy mã | Có (nếu nối Git) | Có | Có |
| Độ khó | Thấp nhất | Thấp | Thấp |

## 4. Cài ứng dụng ra màn hình điện thoại

- **Android (Chrome):** mở link, bấm nút **Cài app** trên đầu ứng dụng (hoặc menu ⋮ → *Cài đặt ứng dụng / Thêm vào màn hình chính*).
- **iPhone (Safari):** mở link bằng **Safari** → nút **Chia sẻ** → **Thêm vào Màn hình chính**. iOS không có popup tự động nên ứng dụng hiển thị khung hướng dẫn.

## 5. Cách sử dụng
- Khi mở ứng dụng có màn hình chờ khoảng 3 giây (vòng quỹ đạo xoay quanh logo Sonadezi Long Thành), chạm vào màn hình để vào ngay.
- Người xem quét QR: bật "Đọc bản dịch bằng tai nghe" sẽ hiện mục *Giọng đọc* (thu gọn mặc định) để chọn giọng, tốc độ, độ cao và nghe thử.
- Chọn cặp ngôn ngữ ở thanh trên hoặc bấm nhanh các nhãn *Anh → Việt*, *Trung → Việt*…; nút ⇄ đảo chiều và chuyển luôn bản dịch sang ô gốc.
- Gõ văn bản: bản dịch cập nhật sau khoảng 0,45 giây kể từ lần gõ cuối.
- Bấm micro lớn ở giữa để nói; vừa nói vừa dịch; bấm lần nữa để dừng, ứng dụng tự đọc bản dịch (tắt được bằng ô *Tự động đọc bản dịch*).

## 6. Dịch thuật: MyMemory và Google Cloud

Mặc định dùng **MyMemory** (miễn phí, không cần khóa; khoảng 5.000 ký tự/ngày theo IP, khoảng 50.000 nếu khai báo email trong *Cài đặt*).

Để dùng **Google Cloud Translation** (chất lượng ổn định hơn, tính phí theo ký tự):
1. Tạo dự án tại https://console.cloud.google.com, bật *Cloud Translation API*, bật thanh toán.
2. *APIs & Services → Credentials → Create credentials → API key*.
3. Hạn chế khóa: *Application restrictions = Websites*, thêm tên miền của bạn; *API restrictions* = Cloud Translation API.
4. Trong ứng dụng: biểu tượng bánh răng → *Google Cloud Translation* → dán khóa → *Lưu*.

### Giọng đọc Google Cloud WaveNet (tùy chọn, có giọng nam/nữ ổn định)
Mặc định ứng dụng đọc bằng giọng có sẵn trên thiết bị (miễn phí, nhưng số giọng nam/nữ tùy thiết bị). Muốn giọng giống nhau trên mọi thiết bị:
1. Trong cùng dự án Google Cloud, bật thêm *Cloud Text-to-Speech API* (đã bật thanh toán ở bước trên).
2. Có thể dùng chung khóa Translation (thêm *Cloud Text-to-Speech API* vào phần *API restrictions* của khóa) hoặc tạo khóa riêng.
3. Trong ứng dụng: bánh răng → *Giọng đọc* → *Nguồn giọng đọc* = *Google Cloud WaveNet* → (dán khóa nếu dùng khóa riêng) → chọn giọng nam/nữ → *Nghe thử* → *Lưu*.
4. Chi phí theo bảng giá Google tại thời điểm tra cứu: WaveNet miễn phí 4 triệu ký tự/tháng, sau đó khoảng 4 USD cho 1 triệu ký tự. Vui lòng đối chiếu lại bảng giá hiện hành và đặt cảnh báo ngân sách (Budget alert) trong Google Cloud.
5. Câu đã đọc được lưu tạm trong phiên làm việc để không bị tính phí lại khi bấm *Đọc lại*. Nếu gọi Google lỗi (mạng, khóa, hạn mức), ứng dụng báo lỗi và tự dùng giọng thiết bị.
6. Danh sách giọng được lấy trực tiếp từ Google theo từng ngôn ngữ; nếu Google chưa có giọng WaveNet cho ngôn ngữ nào thì ngôn ngữ đó dùng giọng thiết bị.
7. **Bảng đo giọng đọc Google** (trong ⚙ → Giọng đọc, khi chọn Google Cloud WaveNet): hiển thị số ký tự và số lượt gọi *hôm nay* và *tháng này*, mức đã dùng so với hạn mức miễn phí 4 triệu ký tự/tháng, và ước tính phí vượt hạn mức (đơn giá tham khảo 4 USD cho 1 triệu ký tự, cần đối chiếu lại với Google). Có ô *Giới hạn ký tự mỗi tháng* (mặc định 4.000.000, đặt 0 để không giới hạn): đạt giới hạn thì ứng dụng tự đọc bằng giọng thiết bị và báo một lần khi đạt 80%. Bộ đo chỉ tính các lần gọi Google thành công (câu lấy từ bộ nhớ đệm hoặc lần gọi lỗi không tính), tính riêng trên từng thiết bị và chỉ mang tính tham khảo, không thay số liệu tính phí của Google. Nút *Đặt lại bộ đo* xóa số liệu trên thiết bị này.

Bộ đếm ký tự: khi dùng Google, ứng dụng đếm số ký tự đã gửi dịch trong ngày và hiện dưới thanh ngôn ngữ (ví dụ "Google hôm nay: 12.345 / 200.000 ký tự"). Đặt giới hạn trong *Cài đặt* (0 = không giới hạn); đạt giới hạn thì tự chuyển sang MyMemory hoặc tạm dừng dịch tùy lựa chọn. Bộ đếm tính riêng trên từng thiết bị, chỉ mang tính tham khảo, không thay số liệu tính phí của Google; nên đặt thêm ngân sách cảnh báo trong Google Cloud (Billing → Budgets & alerts).

Cảnh báo bảo mật: khóa nhập trên trình duyệt chỉ lưu tại thiết bị đó, nhưng nếu dùng chung cho nhiều người thì nên đặt qua máy chủ trung gian (Netlify/Vercel Functions) để không lộ khóa.

## 6b. Tài khoản Miễn phí và VIP
Khi mở ứng dụng lần đầu (hoặc sau khi chọn *Cài đặt → Đổi tài khoản*), ứng dụng hiện màn hình chọn loại tài khoản. Lựa chọn được nhớ trên thiết bị.

| | Miễn phí | VIP |
|---|---|---|
| Nguồn dịch | MyMemory (cố định) | Google Cloud Translation (mặc định) |
| Giọng đọc | Chỉ giọng của thiết bị (không có lựa chọn nguồn) | Chọn tự do giữa giọng Google WaveNet (mặc định) và giọng của thiết bị |
| Lưu và xuất đoạn chat | Không (chỉ giữ trong phiên đang mở) | Có |
| Chế độ hội nghị | Không | Có |
| Thời gian dùng | Không giới hạn | Theo tháng, quản trị viên cấp và gia hạn |

Người xem phòng họp qua mã QR không phải chọn tài khoản.

VIP và quản trị viên chọn nguồn giọng đọc ở hai nơi, luôn đồng bộ với nhau: ô **Giọng đọc ra** ngoài màn hình (hai nhóm "Giọng Google WaveNet" và "Giọng của thiết bị", chọn giọng nào là chuyển luôn sang nguồn đó) và mục **Nguồn giọng đọc** trong Cài đặt. Tài khoản thường chỉ thấy danh sách giọng thiết bị.

### Dành cho người dùng VIP
1. Ở màn hình chọn tài khoản, chọn **Đăng ký tài khoản VIP**, nhập họ tên, email và mật khẩu (tối thiểu 8 ký tự).
2. Màn hình **chờ duyệt** hiện thông tin thanh toán (gói, ngân hàng, mã QR, nội dung chuyển khoản là email của bạn). Chuyển khoản theo hướng dẫn rồi chờ quản trị viên cấp quyền.
3. Khi quản trị viên duyệt, màn hình tự cập nhật và bạn vào luôn bản VIP. Có thể bấm **Dùng bản Miễn phí tạm thời** trong lúc chờ.
4. *Cài đặt* hiển thị **số ngày còn lại** của gói, ngày hết hạn và mức bạn đã dùng trong tháng. Còn 3 ngày trở xuống, ứng dụng nhắc gia hạn.
5. Hết hạn hoặc bị khóa: ứng dụng tự chuyển về bản Miễn phí. Gia hạn bằng cách thanh toán và báo quản trị viên; được gia hạn là tự lên lại VIP, không cần đăng nhập lại.
6. Quên mật khẩu: nhập email vào ô đăng nhập rồi bấm **Quên mật khẩu** để nhận thư đặt lại.

### Dành cho quản trị viên
Thiết lập một lần (chi tiết ở `docs/FIREBASE-SETUP.md`, mục "Tài khoản VIP và quản trị"): bật đăng nhập Email/Mật khẩu, dán lại quy tắc bảo mật, rồi cấp quyền quản trị cho tài khoản của bạn bằng **mã tài khoản (UID)** hiển thị trong ứng dụng.

Sau đó, trong *Cài đặt → Quản trị tài khoản và hạn mức*:
- **Duyệt 1 tháng** cho người chờ duyệt; **Gia hạn +1 tháng** (cộng thêm từ ngày hết hạn nếu còn hạn, hoặc từ hôm nay nếu đã hết hạn); **Khóa / Mở khóa**; **Xóa** hồ sơ.
- **Hạn mức Google tháng này:** tổng số ký tự dịch và đọc do các thiết bị VIP báo về, so với hạn mức bạn đặt. Số liệu do thiết bị tự báo nên chỉ mang tính tham khảo; số liệu và chi phí chính xác xem tại Google Cloud Console (Billing, APIs & Services → Quotas).
- **Khóa Google dùng chung:** nhập một lần, VIP còn hạn tự nhận khóa này (khóa chỉ được máy chủ trả cho VIP còn hạn và quản trị viên). VIP vẫn có thể tự nhập khóa riêng trong Cài đặt.

**Giới hạn cần biết về an toàn:**
- Việc **cấp khóa Google** được máy chủ kiểm soát thật sự theo trạng thái và hạn dùng, nhưng khi VIP đã nhận khóa thì khóa nằm trong trình duyệt của họ, nên người có kỹ thuật vẫn có thể lấy ra. Hãy giới hạn khóa theo tên miền và theo API, đặt ngân sách cảnh báo, và **đổi khóa định kỳ** (đặc biệt khi có người hết hạn).
- Các tính năng cục bộ (xuất chat, chế độ hội nghị) được khóa ở giao diện và trong mã ứng dụng, nhưng chạy trên trình duyệt nên người rành kỹ thuật có thể vượt qua; chúng không tốn chi phí Google.
- Số liệu sử dụng và nhật ký hồ sơ (email, họ tên, hạn dùng) được lưu trên Firebase; hãy đối chiếu quy định bảo mật dữ liệu của công ty.

## 7. Giới hạn cần biết
- **Nhận diện giọng nói** phụ thuộc trình duyệt: Chrome Android hoạt động tốt; Safari iOS (14.5 trở lên) hỗ trợ nhưng ổn định kém hơn, có thể ngắt sau thời gian im lặng. Firefox không hỗ trợ.
- Trong ứng dụng đã cài trên iOS (chế độ standalone), nhận diện giọng nói có thể không khả dụng tùy phiên bản iOS; khi đó hãy dùng Safari. Tôi chưa kiểm thử trên thiết bị iOS thực tế nên không thể khẳng định.
- **Đọc văn bản** cần thiết bị có giọng đọc tiếng tương ứng (cài thêm trong cài đặt hệ thống nếu thiếu, nhất là tiếng Trung/Việt).
- Cần mạng để dịch và (trên Chrome) để nhận diện giọng nói; service worker chỉ giúp mở giao diện khi mất mạng.
- Khi cập nhật mã, tăng số phiên bản `CACHE` trong `service-worker.js` (ví dụ `translator-v2`) để thiết bị nhận bản mới.

## 8. Sửa giao diện
Nếu thay đổi class Tailwind trong `index.html` hoặc `app.js`, build lại CSS bằng Node.js:
```bash
npx tailwindcss@3 -c tailwind.config.js -i input.css -o styles.css --minify
```
Sau đó tăng số phiên bản `CACHE` trong `service-worker.js`.

## 9. Lưu đoạn chat
- Hội thoại tự được lưu trên thiết bị (tối đa 300 lượt gần nhất) nên tải lại trang vẫn còn; nút thùng rác xóa toàn bộ.
- Nút **tải xuống** ở đầu trang mở hộp thoại lưu tệp: **.txt** (đọc nhanh) hoặc **.csv** (mở bằng Excel, đủ cột thời gian, ngôn ngữ, văn bản gốc và bản dịch). Trên điện thoại có thêm nút **Chia sẻ** (gửi qua Zalo, email…).
- Dữ liệu chỉ nằm trên thiết bị người dùng, không gửi lên máy chủ nào ngoài dịch vụ dịch (MyMemory/Google).

## 10. Nút Ủng hộ và gói sử dụng
Nút trái tim ở đầu trang mở cửa sổ ủng hộ. Nội dung lấy từ `config.js`: QR chuyển khoản, thông tin tài khoản, liên kết thanh toán (chỉ nhận `https://`) và danh sách gói. Để trống thì mục tương ứng không hiện.

Hạn chế quan trọng: ứng dụng chỉ chạy trên trình duyệt, không có máy chủ, nên **không thể tự xác nhận thanh toán, cấp hay khóa gói**. Các nút chỉ chuyển người dùng sang trang thanh toán của bạn. Nếu cần bán gói thật (chỉ người đã trả tiền mới dùng được), phải bổ sung máy chủ có đăng nhập và cổng thanh toán (ví dụ PayOS, Stripe) và dịch vụ dịch trả phí; việc này cần thiết kế riêng.

## 11. Chế độ họp
Nút **Chế độ họp** (góc phải phía dưới) chỉ cần bấm một lần: ứng dụng tự nghe liên tục, mỗi câu nói xong được dịch và đưa lên khung chat (bong bóng bên trái), **không đọc bản dịch**, không cần chạm lại. Bấm **Dừng họp** (hoặc nút micro) để kết thúc; sau đó dùng nút tải xuống để lưu biên bản `.txt`/`.csv`.

Giới hạn:
- Nghe theo **một ngôn ngữ nguồn** tại một thời điểm; nếu người nói đổi ngôn ngữ, bấm ⇄ hoặc chọn lại ngôn ngữ (chế độ họp vẫn tiếp tục).
- Chỉ ghi **chữ**, không lưu tệp âm thanh.
- Trình duyệt ngừng nghe khi tắt màn hình hoặc chuyển sang ứng dụng khác; ứng dụng xin giữ màn hình sáng (nếu thiết bị hỗ trợ) nhưng nên để ứng dụng ở phía trước, cắm sạc nếu họp lâu.
- Nhận diện giọng nói của trình duyệt cần mạng và độ chính xác giảm khi nhiều người nói chồng, ở xa micro hoặc ồn.

## 12. Cải thiện độ chính xác nhận diện giọng nói
Trong `config.js`, mục `recognition`:
- `minConfidence` (0–1, mặc định 0,3): bỏ qua câu đã chốt có độ tin cậy thấp hơn mức này, giúp loại câu vô nghĩa do tiếng ồn. Tăng lên (ví dụ 0,5) nếu còn nhiều câu rác; giảm xuống hoặc đặt 0 nếu app bỏ sót câu đúng. Trình duyệt không báo độ tin cậy (giá trị 0) thì câu được giữ lại.
- `glossary`: từ điển sửa lỗi, gặp cách nghe sai (`variants`) thì thay bằng từ đúng (`to`); không phân biệt hoa/thường, khớp nguyên cụm từ. Các cách nghe sai có sẵn chỉ là dự đoán; hãy ghi lại những câu app nghe sai thực tế rồi bổ sung vào danh sách.

Cách này chỉ sửa kết quả sau khi nhận diện, không cải thiện chất lượng thu âm gốc. Nên kết hợp với micro ngoài và môi trường yên tĩnh.

## 13. Bảng thuật ngữ dịch và chế độ màn hình lớn
- **`terms` trong `config.js`:** danh sách cụm từ (tên dự án, thuật ngữ thuê đất, giới thiệu dự án, bảo trì bảo dưỡng) theo ba ngôn ngữ `vi`, `en`, `zh`. Khi câu nói chứa cụm ở ngôn ngữ nguồn, bản dịch dùng đúng cụm ở ngôn ngữ đích để các cuộc họp nhất quán. Ô để trống thì bỏ qua cặp ngôn ngữ đó. Nếu dịch vụ dịch làm mất ký hiệu thay thế, app tự quay về dịch bình thường.
- **Bản Anh và Trung chưa được chuyên gia xác nhận.** Phải do Pháp chế hoặc phiên dịch kiểm tra trước khi dùng cho thương thảo hợp đồng; tên tiếng Trung chính thức của các khu công nghiệp đang để trống.
- **Màn hình lớn:** nút phóng to ở góc phải khung chat, phóng chữ 1,5 lần, ẩn ô nhập và thanh chọn ngôn ngữ, vào toàn màn hình nếu trình duyệt cho phép; bấm lại hoặc nhấn Esc để thoát. Dùng khi chiếu khung chat lên TV hoặc máy chiếu trong phòng họp.

## 14. Họp luân phiên hai ngôn ngữ
Trong **Chế độ họp**, thanh đỏ hiển thị rõ **ngôn ngữ đang nghe**. Có hai cách đổi người nói:
- **Tự đổi sau mỗi lượt** (ô tích trên thanh đỏ, mặc định bật): sau mỗi câu đã chốt, app chuyển sang ngôn ngữ còn lại, giả định hai bên nói xen kẽ.
- **Đổi tay:** bấm ⇄ hoặc nhấn phím **Space** (khi con trỏ không nằm trong ô nhập). Dùng khi một bên nói hai lượt liên tiếp hoặc app đổi sai.

Bong bóng của bên đầu tiên nói nằm bên phải, bên còn lại nằm bên trái. Mỗi câu được dịch theo đúng chiều của lượt nói đó, kể cả khi ngôn ngữ đã đổi trước lúc dịch xong.

Giới hạn: app không tự nhận biết ngôn ngữ người nói; nếu để sai ngôn ngữ, câu sẽ bị nghe sai. Mỗi lần đổi, bộ nghe khởi động lại nên có thể mất vài từ đầu của lượt kế tiếp. Muốn nhận diện ngôn ngữ tự động cần chuyển sang dịch vụ nhận diện giọng nói trả phí.

## 15. Đọc bản dịch trong Chế độ họp (micro hội nghị vừa thu vừa phát)
Trong Chế độ họp, tích **"Đọc bản dịch ra loa"** để mỗi bản dịch được đọc ra đầu ra âm thanh của laptop:
- Bản dịch được **xếp hàng và đọc lần lượt**, không cắt nhau. Hàng chờ chỉ giữ **3 bản dịch mới nhất**; các câu quá cũ bị bỏ qua phần đọc (chữ vẫn hiện đầy đủ trên khung chat).
- Khi đang đọc, app **tạm dừng nghe** (hiện nhãn "Đang đọc · micro tạm nghỉ") để không thu lại tiếng dịch, đọc xong tự nghe lại. **Lời nói trong lúc đang đọc sẽ không được ghi nhận**, nên cần người nói chờ bản dịch đọc xong.
- Dùng micro hội nghị làm cả **đầu vào lẫn đầu ra mặc định** của laptop (Windows: Cài đặt → Hệ thống → Âm thanh), cắm USB.
- Giọng đọc mặc định là giọng có sẵn trên laptop (hoặc Google Cloud WaveNet nếu đã bật), chọn và chỉnh trong ⚙ → Giọng đọc.
- Với thương thảo hợp đồng nên **tắt** tùy chọn này và chỉ đọc chữ trên màn hình để không mất lời nói.

## 16. Phòng họp xem chung bằng mã QR
Chủ phòng bấm biểu tượng mã QR ở góc khung chat → **Tạo phòng họp**; người trong phòng quét mã để xem chữ gốc và chữ dịch theo thời gian thực, tự chọn ngôn ngữ hiển thị (chỉ đọc). Cần thiết lập Firebase một lần; xem hướng dẫn chi tiết, quy tắc bảo mật, TTL, chi phí và quyền riêng tư tại **`docs/FIREBASE-SETUP.md`**.

## 17. Giảm độ trễ trong Chế độ họp
Độ trễ từ lúc người nói dứt câu đến lúc có bản dịch gồm: (1) trình duyệt xác nhận kết thúc câu, (2) gọi dịch, (3) hiển thị và đọc. Các tùy chọn trong ⚙ → **Chế độ họp: giảm độ trễ** (mặc định đều tắt):
- **Dịch tăng dần:** khi đang nói, cứ khoảng 6 từ ổn định (giữ lại 3 từ cuối vì trình duyệt còn có thể sửa) app dịch ngay một cụm và hiện bản dịch tạm; khi chốt câu chỉ dịch phần đuôi còn lại. Tổng số ký tự gửi dịch xấp xỉ bằng dịch cả câu. Đổi lại, dịch theo cụm kém ngữ cảnh nên có thể kém chính xác hơn, nhất là khi trật tự từ khác nhau.
- **Tự chốt câu sau khi im lặng (0,7 / 1 / 1,5 giây):** app chốt câu sớm, không chờ trình duyệt. Nếu trình duyệt sau đó báo thêm phần cuối, phần thêm hiện thành bong bóng riêng; nếu người nói ngừng giữa ý, câu bị cắt đôi.
- **Hiện độ trễ trên từng bong bóng:** hiển thị số giây từ lúc chữ ngừng thay đổi (xấp xỉ lúc dứt câu) đến khi có bản dịch, để đo và so sánh các cấu hình trên thiết bị thật.

Ngữ cảnh nạp sẵn (từ điển sửa lỗi nghe sai và bảng thuật ngữ trong `config.js`) đã có từ trước. Muốn độ trễ thấp hơn nữa cần nhận diện giọng nói dạng luồng từ dịch vụ trả phí qua máy chủ trung gian.

## 18. Chế độ hai ô trái/phải và giao diện laptop
- **Hai ô ngang cấp nhau** (nút hình hai cột trên thanh công cụ khung chat; mặc định bật trên laptop): ô trái hiển thị cuộc họp bằng ngôn ngữ của **bên bạn** (ngôn ngữ nguồn khi chọn cặp ngôn ngữ), ô phải bằng ngôn ngữ **bên kia**. Mỗi lượt nói là một hàng, hai ô thẳng hàng. Ô của người đang nói có viền xanh và nhãn "Nói", ô còn lại là "Bản dịch". Mỗi bên chỉ nhìn ô của mình và đọc theo đúng thứ tự cuộc trò chuyện. Mỗi ô có nút đọc lại và sao chép. Dòng đang nói ở cuối cũng chia hai ô.
- **Giao diện laptop** (màn hình rộng từ 1024 px): khung nội dung dùng hết chiều rộng, cỡ chữ và khoảng cách tự phóng to theo kích thước cửa sổ (tối đa khoảng 1,4 lần), thanh chọn ngôn ngữ, thanh chế độ họp và nút công cụ nằm chung một hàng, ô nhập và micro nằm chung một hàng phía dưới để dành tối đa chiều cao cho nội dung.
- **A− / A+:** chỉnh cỡ chữ thêm theo ý bạn, lưu trên thiết bị.
- Chế độ màn hình lớn (chiếu TV) vẫn dùng được và phóng chữ lớn hơn nữa.
- Trên điện thoại, chế độ hai ô mặc định tắt vì màn hình hẹp; có thể bật bằng nút hai cột.

Xóa dữ liệu phòng: khi kết thúc phòng, chọn **Kết thúc và xóa nội dung ngay** (xóa toàn bộ tin nhắn, người xem và phòng khỏi Firebase, không hoàn tác) hoặc **Kết thúc, giữ nội dung đến khi hết hạn**. TTL tự động của Firestore chỉ dùng được khi dự án bật thanh toán (xem `docs/FIREBASE-SETUP.md`, mục 4).

## 19. Dịch chạy theo khi đang nói (mặc định bật)
Trong Chế độ họp, bản dịch hiện dần cùng lúc với chữ đang nói, không còn đợi dứt câu mới dịch cả câu:
- Cứ khoảng 4 từ ổn định, app dịch một cụm và giữ cố định; phần đuôi (các từ cuối còn có thể bị trình duyệt sửa) được dịch lại tối đa mỗi 0,4 giây và hiện kèm dấu "…".
- Khi dứt câu, app **dùng lại** các cụm đã dịch và bản dịch phần đuôi; chỉ dịch thêm nếu phần đuôi cuối cùng khác với bản đã dịch. Vì vậy bong bóng chốt hiện gần như ngay và không còn cảnh "gộp lại rồi dịch lại".
- Đổi lại: chi phí dịch tăng (thử nghiệm giả lập cho thấy khoảng 2 lần số ký tự; ước tính thực tế 2–4 lần), nhất là với Google Cloud Translation; MyMemory sẽ hết hạn mức nhanh hơn. Bản dịch tạm có thể đổi khi người nói nói thêm, và dịch theo cụm có thể kém chính xác hơn dịch cả câu.
- Tắt ở ⚙ → Chế độ họp: giảm độ trễ → bỏ chọn "Dịch chạy theo khi đang nói".

## 20. Giảm độ trễ phòng họp và nghe bản dịch bằng tai nghe
**Giảm độ trễ cho người xem:**
- Bản "đang nói": người xem thấy ngay chữ chủ phòng đang nói (khung nét đứt, nhãn "Đang nói…"), cập nhật tối đa mỗi 0,8 giây (`room.liveIntervalMs` trong `config.js`), tự ẩn khi câu được chốt. Chỉ ghi khi có người xem và nội dung thay đổi.
- Ngôn ngữ phụ được dịch **song song** và ghi **một lần** thay vì lần lượt từng ngôn ngữ.
- Hộp "Phòng họp" hiện độ trễ ghi lên máy chủ gần nhất để kiểm tra.
- Bản "đang nói" của ngôn ngữ phụ hiển thị theo bản dịch của chủ phòng; bản dịch riêng chỉ có sau khi câu được chốt.
- **Bắt buộc:** dán lại `firebase/firestore.rules` vào Firebase Console và bấm Publish (xem docs/FIREBASE-SETUP.md).

**Nghe bằng tai nghe trên điện thoại:** người xem mở liên kết phòng, chọn ngôn ngữ, cắm tai nghe và bật "Đọc bản dịch bằng tai nghe".
- Chỉ đọc bản dịch của câu mới; bỏ qua lời cùng ngôn ngữ của chính người xem; không đọc lại tin cũ khi mới vào.
- Tối đa 3 câu chờ đọc; câu chưa có bản dịch quá khoảng 6 giây sẽ bị bỏ qua.
- Cần giữ màn hình sáng và trang đang mở; tôi chưa kiểm chứng trên điện thoại thật khi khóa màn hình (nhiều trình duyệt tạm dừng đọc ở nền).

## 21. Phòng họp hai laptop (mỗi máy một ngôn ngữ cố định)
Dùng khi mỗi bên bàn có một laptop và một micro riêng (ví dụ bên Việt, bên Anh), thay cho việc dùng chung một micro và bấm đổi lượt.
1. Trên laptop thứ nhất (chủ phòng): chọn ngôn ngữ (ví dụ Việt → Anh), bấm biểu tượng Phòng họp → Tạo phòng họp.
2. Trong hộp Phòng họp, kéo xuống mục **Laptop thứ hai**: mở liên kết đó (hoặc quét mã QR) trên laptop thứ hai. Máy thứ hai tự lấy ngôn ngữ ngược lại (Anh → Việt). **Không chia sẻ liên kết này cho người xem**; người xem dùng mã QR phía trên.
3. Trên cả hai máy bấm **Chế độ họp** để bắt đầu ghi.
- Mỗi máy chỉ nghe một ngôn ngữ cố định nên không cần đoán ngôn ngữ hay bấm đổi lượt; nút đảo chiều và "Tự đổi sau mỗi lượt" bị ẩn.
- Hai màn hình hiện chung một cuộc hội thoại; chữ lớn là ngôn ngữ của máy đó, chữ nhỏ là bản gốc hoặc bản dịch. Có cả dòng "Đang nói…" của bên kia.
- Nếu bật "Đọc bản dịch ra loa", mỗi máy đọc **bản dịch lời của người bên kia** bằng ngôn ngữ của máy mình, không đọc lại lời bên mình.
- Người xem qua QR vẫn xem được cả hai bên; máy chủ phòng dịch thêm các ngôn ngữ phụ cho cả hai máy.
- Lưu ý: tiếng loa của máy này có thể lọt vào micro của máy kia. Đặt hai máy xa nhau, hạ âm lượng loa và theo dõi kết quả khi thử thực tế (tôi chưa kiểm chứng ở phòng họp thật).
- Bắt buộc dán lại `firebase/firestore.rules` vào Firebase Console và bấm Publish (có thêm quy tắc cho máy thứ hai).
- Xuất file chỉ chứa phần ghi trên máy đó, không gồm tin của máy kia.

## 22. Chế độ hội nghị (nghe bản dịch bằng tai nghe hoặc loa)
Dùng khi bạn đi dự hội nghị, người trình bày nói ngoại ngữ và bạn muốn nghe bản dịch liên tục bằng tai nghe.
1. Chọn ngôn ngữ nguồn là ngôn ngữ người nói (ví dụ Tiếng Anh) và ngôn ngữ đích của bạn (ví dụ Tiếng Việt).
2. Cắm hoặc ghép tai nghe (hoặc loa) với thiết bị, và chọn nó làm thiết bị phát âm thanh mặc định của hệ thống. Trình duyệt không tự chọn được thiết bị phát.
3. Bấm nút **🎧 Hội nghị** ở góc dưới bên phải (bật nhanh, không cần vào Chế độ họp). Bấm lại để dừng. Cũng có thể tích ô "Chế độ hội nghị" trong thanh Chế độ họp.
- Khác với chế độ họp thường: micro **không tắt** khi app đọc bản dịch, nên không mất lời người nói. Ngôn ngữ cố định, không tự đảo lượt.
- Nếu bản dịch dồn lại, app giữ tối đa 2 câu mới nhất và đọc nhanh hơn khoảng 25% để bắt kịp; câu cũ hơn có thể bị bỏ qua.
- Dùng **tai nghe** để tiếng đọc không lọt vào micro. Nếu phát ra loa ngoài, tiếng đọc có thể bị micro thu lại và dịch nhầm.
- Micro đặt gần nguồn âm (gần loa hội trường hoặc lấy tín hiệu từ bàn trộn âm thanh) cho kết quả tốt nhất. Chưa đo độ trễ thực tế tại hội nghị.
