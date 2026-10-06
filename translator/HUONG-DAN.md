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

Cảnh báo bảo mật: khóa nhập trên trình duyệt chỉ lưu tại thiết bị đó, nhưng nếu dùng chung cho nhiều người thì nên đặt qua máy chủ trung gian (Netlify/Vercel Functions) để không lộ khóa.

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
- Giọng đọc là giọng có sẵn trên laptop, chọn và chỉnh trong ⚙ → Giọng đọc.
- Với thương thảo hợp đồng nên **tắt** tùy chọn này và chỉ đọc chữ trên màn hình để không mất lời nói.

## 16. Phòng họp xem chung bằng mã QR
Chủ phòng bấm biểu tượng mã QR ở góc khung chat → **Tạo phòng họp**; người trong phòng quét mã để xem chữ gốc và chữ dịch theo thời gian thực, tự chọn ngôn ngữ hiển thị (chỉ đọc). Cần thiết lập Firebase một lần; xem hướng dẫn chi tiết, quy tắc bảo mật, TTL, chi phí và quyền riêng tư tại **`docs/FIREBASE-SETUP.md`**.
