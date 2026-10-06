# Ứng dụng Dịch Thời Gian Thực (PWA) – Anh / Trung / Việt

## 1. Cấu trúc thư mục

```
translator/
├── index.html           # Giao diện (Tailwind CSS, mobile-first)
├── app.js               # Logic: dịch, nhận diện giọng nói, đọc văn bản, cài đặt PWA
├── styles.css           # CSS Tailwind đã build sẵn (không cần mạng/CDN)
├── tailwind.config.js   # Bảng màu thương hiệu Sonadezi (chỉ cần khi sửa giao diện)
├── input.css
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
