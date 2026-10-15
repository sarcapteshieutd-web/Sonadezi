# Kho mã Sonadezi — Quy ước cho Claude Code

Claude Code tự đọc tệp này mỗi phiên. Trả lời và giải thích bằng tiếng Việt.

## 1. Kho mã có HAI ứng dụng độc lập

| Ứng dụng | Vị trí | Ghi chú |
|---|---|---|
| **App dịch thời gian thực** (PWA Anh/Trung/Nhật/Hàn ↔ Việt) | `translator/` | Đối tượng chính của dây chuyền agent |
| App tra cứu nhà xưởng KCN Long Thành | Thư mục gốc: `index.html`, `sw.js`, `AppsScript-Code.gs`, `seed.js`, `manifest.webmanifest`, `giong-van-szl.md` | KHÔNG sửa khi làm việc với app dịch, trừ khi người dùng yêu cầu rõ |

Toàn bộ kho được đăng tĩnh trên GitHub Pages (`sarcapteshieutd-web.github.io`) từ nhánh
**`claude/realtime-translation-app-68o1ik`** (nhánh phát hành). Mọi thay đổi đưa lên nhánh này được phát hành ngay
cho người dùng. Nhánh `main` cũ hơn nhánh phát hành, không dùng làm gốc.

- Mỗi tính năng làm trên nhánh riêng tách từ nhánh phát hành, tạo pull request vào nhánh
  phát hành; người dùng tự xem và gộp.

## 2. Cấu trúc app dịch (`translator/`)

- `index.html` — giao diện; nạp `config.js`, `stt-cloud.js`, `report.js`, `app.js`.
- `app.js` — logic chính (dịch, nhận diện giọng nói, đọc văn bản, phòng họp, VIP, quản trị).
- `stt-cloud.js` — nhận dạng giọng nói Google Cloud; phần logic thuần xuất qua `module.exports` để kiểm thử.
- `report.js` — báo cáo phòng họp; logic thuần, xuất qua `module.exports`.
- `src/room.js` — lớp Firebase (Auth + Firestore) + mã QR, đóng gói thành `room.bundle.js` bằng esbuild.
- `config.js` — cấu hình gói sử dụng, nút Ủng hộ, thông số Firebase (định danh công khai, không phải mật khẩu).
- `service-worker.js` — cache PWA, hằng `CACHE = 'translator-vNN'`.
- `firebase/firestore.rules` — quy tắc bảo mật; `firebase/rules-test*.js` — kiểm thử bằng Emulator.
- `styles.css` — Tailwind đã build từ `input.css` + `tailwind.config.js`; `ui.css` — CSS viết tay.
- `tests/*.test.js` — kiểm thử đơn vị bằng `node:test`.
- Tài liệu: `HUONG-DAN.md`, `docs/FIREBASE-SETUP.md`, `docs/SETUP-PHONG-HOP-2-LAPTOP.md`.

## 3. Lệnh kiểm tra và build

| Việc | Lệnh (chạy tại thư mục gốc kho) |
|---|---|
| Kiểm tra tổng hợp của dây chuyền | `node cong-cu/kiem-tra-dich.js` |
| Chỉ chạy kiểm thử đơn vị | `node --test translator/tests/` |
| Build lại `room.bundle.js` (khi sửa `src/room.js`) | `cd translator && npm i firebase qrcode-generator esbuild && npx esbuild src/room.js --bundle --minify --format=iife --target=es2020 --outfile=room.bundle.js` |
| Build lại `styles.css` (khi thêm lớp Tailwind mới) | `cd translator && npx tailwindcss@3 -c tailwind.config.js -i input.css -o styles.css --minify` |
| Kiểm thử quy tắc Firestore | Xem đầu tệp `translator/firebase/rules-test.js` (cần Emulator sạch) |

## 4. Quy tắc bắt buộc khi sửa app dịch

- JavaScript thuần chạy trực tiếp trên trình duyệt: không thêm framework, không thêm bước build
  mới. Ngoại lệ duy nhất là `room.bundle.js` và `styles.css` theo lệnh ở mục 3.
- Sửa bất kỳ tệp nào nằm trong danh sách `CORE` của `service-worker.js` thì PHẢI tăng số
  `CACHE` (ví dụ `translator-v70` → `translator-v71`), nếu không thiết bị đã cài vẫn chạy bản cũ.
- Sửa `src/room.js` thì PHẢI build lại `room.bundle.js` và đưa cả hai tệp vào cùng một commit.
- Sửa `firebase/firestore.rules` thì PHẢI: cập nhật/bổ sung phép thử trong `rules-test*.js`,
  ghi chú trong `docs/FIREBASE-SETUP.md`, và nhắc người dùng dán lại quy tắc rồi bấm Publish
  trên Firebase Console. Quy tắc KHÔNG tự cập nhật khi đẩy mã.
- Nội dung do người dùng nhập hoặc đồng bộ từ Firestore (tin nhắn, tên, tóm tắt) PHẢI hiển thị
  bằng `textContent` hoặc được escape. Không đưa dữ liệu chưa escape vào `innerHTML`.
- Không ghi cứng khóa Google Cloud hay mật khẩu vào mã. Khóa do người dùng nhập ở Cài đặt hoặc
  do quản trị viên cấp qua `config/google`.
- Micro và PWA chỉ chạy trên HTTPS hoặc `localhost`. Lưu ý Safari iOS: không tự bật âm thanh khi
  chưa có thao tác chạm, `localStorage` có thể bị xóa; luôn có phương án dự phòng.
- Logic thuần (không phụ thuộc DOM) nên đặt trong tệp có `module.exports` như `stt-cloud.js`,
  `report.js` để viết kiểm thử `node:test`.
- Giữ nguyên phong cách hiện có: chú thích tiếng Việt, tên hàm tiếng Anh theo kiểu `camelCase`.

## 5. Quy tắc cho agent

- KHÔNG đẩy mã (`git push`) lên nhánh phát hành `claude/realtime-translation-app-68o1ik` hay `main`; KHÔNG gộp nhánh,
  KHÔNG gộp pull request; KHÔNG chạy `firebase deploy`. Các việc này người dùng tự làm.
- Được phép (khi người dùng yêu cầu): commit, đẩy nhánh tính năng riêng, tạo pull request
  vào nhánh phát hành.
- KHÔNG sửa ứng dụng ở thư mục gốc khi yêu cầu là về app dịch.
- Chạy `node cong-cu/kiem-tra-dich.js` trước khi báo hoàn thành.

## 6. Dây chuyền agent

- `/kehoach <yêu cầu>` — chỉ lập kế hoạch (`.bangiao/ke-hoach.md`) để người dùng duyệt.
- `/tiep` — chạy coder → tester → reviewer theo kế hoạch đã duyệt.
- `/ship <yêu cầu>` — chạy trọn 4 chặng.
- Hướng dẫn chi tiết: `cong-cu/HUONG-DAN-DAY-CHUYEN.md`.
