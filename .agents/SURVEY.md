# SURVEY – Khảo sát quy trình A1–A5 và điều phối tự động cho app dịch Live

- Vai thực hiện: A2 – Khảo sát (`Antigravity/Gemini 4 Neon`)
- Kho & nhánh: `sarcapteshieutd-web/Sonadezi`, nhánh `chore/agents-setup` (worktree Orca `Sonadezi/agents-setup`). Nhánh phát hành / đích PR: `claude/realtime-translation-app-68o1ik` (GitHub Pages).
- Tài liệu đã đọc: `AGENTS.md`, `CLAUDE.md`, `.agents/PLAN.md`, `translator/service-worker.js`, `cong-cu/kiem-tra-dich.js`, `.claude/settings.json`, `.claude/agents/planner|coder|tester|reviewer.md`, `.claude/commands/kehoach|tiep|ship.md`, `cong-cu/HUONG-DAN-DAY-CHUYEN.md`, `translator/index.html`, `translator/tailwind.config.js`, `translator/input.css`, `translator/firebase/firestore.rules`, `translator/firebase/rules-test*.js`, `translator/docs/FIREBASE-SETUP.md`, `.gitignore`, cùng bộ mẫu chỉ đọc bên `C:\SZL-Apps\SonadeziLongThanh` (`AGENTS.md`, `.claude/settings.json`, `.agents/roles/A1.md`–`A5.md`, `feat/dieu-phoi:.agents/roles/DIEU-PHOI.md` và `feat/dieu-phoi:.agents/SURVEY.md`).
- Kết quả chạy các lệnh chỉ đọc được phép trong `.agents/PLAN.md`:
  - `node cong-cu/kiem-tra-dich.js`: mã thoát `0`, **`KIEM TRA TU DONG: DAT`** — kiểm tra 21 tệp JS, 2 tệp HTML trong `translator/`; kiểm thử đơn vị **`67/67 đạt (6 tệp)`**; so sánh với `origin/claude/realtime-translation-app-68o1ik` (5 tệp thay đổi); có 1 cảnh báo: `[PHAM VI] Có tệp ngoài app dịch thay đổi: .agents/PLAN.md, .agents/REVIEW.md, .agents/SURVEY.md, AGENTS.md`.
  - `node --test translator/tests/`: **thất bại (mã thoát `1`) trên Node.js v24.14.1 (Windows)** với lỗi `MODULE_NOT_FOUND: Cannot find module '...\translator\tests'` (Node 24 trên Windows hiểu tham số đường dẫn thư mục không kèm glob là module CJS). Ngược lại, `cong-cu/kiem-tra-dich.js` (dòng 77–81) đọc danh sách tệp `*.test.js` truyền trực tiếp cho `node --test` nên chạy đạt `67/67`.
  - `orca orchestration --help` và `--help` của các lệnh con `run-create`, `task-create`, `worker-start`, `check`, `worker-show`, `worker-read`, `deny`: cú pháp và cờ tùy chọn khớp hoàn toàn với bản đã khảo sát trên Orca `1.4.272` tại `SonadeziLongThanh` (`feat/dieu-phoi:.agents/SURVEY.md`). Không tạo Run, Task hay Worker.

---

## 1. Quy tắc kỹ thuật app dịch mà các tệp vai trò phải mang theo

### 1.1. Hai ứng dụng độc lập và nhánh phát hành
- **Phạm vi hai ứng dụng** (`CLAUDE.md` dòng 6–11, 73; `AGENTS.md` dòng 9–10):
  - **App dịch thời gian thực** (PWA Anh/Trung/Nhật/Hàn ↔ Việt, dùng Firebase Auth + Firestore): nằm trong `translator/`.
  - **App tra cứu nhà xưởng KCN Long Thành**: nằm ở thư mục gốc (`index.html`, `sw.js`, `AppsScript-Code.gs`, `seed.js`, `manifest.webmanifest`, `giong-van-szl.md`) — **KHÔNG sửa** khi làm việc với app dịch, trừ khi người dùng yêu cầu rõ.
- **Nhánh phát hành GitHub Pages** (`CLAUDE.md` dòng 13–18; `AGENTS.md` dòng 11–18):
  - Kho đăng tĩnh trên GitHub Pages (`sarcapteshieutd-web.github.io`) từ nhánh **`claude/realtime-translation-app-68o1ik`**. Đẩy hoặc gộp vào nhánh này là phát hành ngay.
  - Nhánh `main` cũ hơn nhánh phát hành: **không dùng làm gốc**, **không tạo Pull Request vào `main`**.
  - Mọi tính năng/sửa lỗi làm trên nhánh riêng tách từ `claude/realtime-translation-app-68o1ik`, tạo PR nhắm vào `claude/realtime-translation-app-68o1ik` khi người dùng yêu cầu.

### 1.2. Kiến trúc mã, lệnh kiểm tra và lệnh build (`CLAUDE.md` dòng 20–65)
- **JavaScript thuần, không thêm framework hay bước build mới** (`CLAUDE.md` dòng 49–50). Ngoại lệ duy nhất là 2 tệp build sẵn:
  1. `translator/room.bundle.js` (từ `translator/src/room.js` — `CLAUDE.md` dòng 29, 43, 53; `translator/docs/FIREBASE-SETUP.md` dòng 56–62):
     ```powershell
     cd translator && npm i firebase qrcode-generator esbuild && npx esbuild src/room.js --bundle --minify --format=iife --target=es2020 --outfile=room.bundle.js
     ```
     Khi sửa `src/room.js`, **PHẢI** build lại `room.bundle.js` và đưa **cả hai tệp vào cùng một commit** (`CLAUDE.md` dòng 53).
  2. `translator/styles.css` (từ `input.css` + `tailwind.config.js` — `CLAUDE.md` dòng 33, 44):
     ```powershell
     cd translator && npx tailwindcss@3 -c tailwind.config.js -i input.css -o styles.css --minify
     ```
     Lưu ý từ mã nguồn thực tế: `translator/tailwind.config.js` (dòng 3) chỉ khai báo `content: ['./index.html', './app.js']` (chưa quét `dialogs.js`, `find.js`); CSS viết tay nằm trong `translator/ui.css` (`CLAUDE.md` dòng 33, nạp ở `translator/index.html` dòng 23) và khai báo font nằm ở `translator/fonts.css` (`index.html` dòng 21).
- **Lệnh kiểm tra tổng hợp bắt buộc trước khi bàn giao** (`CLAUDE.md` dòng 41, 74):
  `node cong-cu/kiem-tra-dich.js` (chạy tại thư mục gốc kho).
  *(Lưu ý: `CLAUDE.md` dòng 42 ghi `node --test translator/tests/`, nhưng trên Node v24.14.1 Windows lệnh này báo lỗi `MODULE_NOT_FOUND`; dùng `node cong-cu/kiem-tra-dich.js` để chạy trọn 67/67 phép thử đơn vị.)*
- **Quy tắc bảo mật Firestore (`translator/firebase/firestore.rules`)** (`CLAUDE.md` dòng 32, 45, 54–56):
  - Khi sửa `firestore.rules`, **PHẢI**: (a) cập nhật/bổ sung phép thử trong `translator/firebase/rules-test.js` (phòng họp, 51 phép thử) hoặc `translator/firebase/rules-test-vip.js` (tài khoản VIP, 59 phép thử), (b) ghi chú cập nhật trong `translator/docs/FIREBASE-SETUP.md`, và (c) nhắc người dùng dán lại toàn bộ quy tắc rồi bấm **Publish** trên Firebase Console. Quy tắc **không** tự cập nhật khi đẩy mã.
  - Chạy kiểm thử Emulator: cần Firebase Emulator **sạch** mỗi lần chạy (`rules-test.js` dòng 1–3, `rules-test-vip.js` dòng 1–3, `FIREBASE-SETUP.md` dòng 99): `npx firebase-tools emulators:start --only firestore,auth --project demo-sonadezi` trong `translator/firebase/`.
- **Chống XSS** (`CLAUDE.md` dòng 57–58): nội dung người dùng nhập hoặc đồng bộ từ Firestore (tin nhắn, tên, tóm tắt) **PHẢI** hiển thị bằng `textContent` hoặc được escape; cấm đưa dữ liệu chưa escape vào `innerHTML`.
- **Bảo mật khóa & thông tin nhạy cảm** (`CLAUDE.md` dòng 30, 59–60; `AGENTS.md` dòng 25–27): không ghi cứng khóa Google Cloud, mật khẩu, token hay bất kỳ bí mật nào vào mã, tệp cấu hình, commit hay tệp điều phối. Thông số Firebase công khai đã có sẵn trong `translator/config.js`; không thêm thông tin nhạy cảm vào đó. Khóa Google Cloud do người dùng nhập ở Cài đặt hoặc quản trị viên cấp qua `config/google`.
- **Micro, PWA và Safari iOS** (`CLAUDE.md` dòng 61–62): chỉ chạy trên HTTPS hoặc `localhost`; Safari iOS không tự phát âm thanh khi chưa có thao tác chạm và có thể xóa `localStorage` → luôn cần phương án dự phòng.
- **Logic thuần & phong cách mã** (`CLAUDE.md` dòng 24–28, 63–65): logic thuần không phụ thuộc DOM đặt trong module có `module.exports` (`stt-cloud.js`, `report.js`, `lang-guess.js`, `captions.js`, `presets.js`) để kiểm thử `node:test`; giữ chú thích tiếng Việt, tên hàm tiếng Anh kiểu `camelCase`.
- **Quy tắc Git và triển khai cho agent** (`CLAUDE.md` dòng 67–74; `AGENTS.md` dòng 15–19): KHÔNG `git push` lên nhánh phát hành `claude/realtime-translation-app-68o1ik` hoặc `main`; KHÔNG gộp nhánh, KHÔNG gộp Pull Request; KHÔNG chạy `firebase deploy`.

### 1.3. Service Worker (`translator/service-worker.js`, dòng 1–52)
- **Biến phiên bản cache hiện tại:** `const CACHE = 'translator-v87';` (**dòng 5**).
- **Cơ chế:** ưu tiên mạng (network-first) cho cùng nguồn gốc, mất mạng dùng bản đã lưu (dòng 31–51); tự xóa mọi cache khác `CACHE` khi `activate` (dòng 23–29).
- **Danh sách `CORE` (dòng 6–13, gồm 30 mục):**
  - Gốc & HTML (2): `'./'`, `'./index.html'` (dòng 7).
  - Tệp JS ứng dụng (9): `'./app.js'`, `'./dialogs.js'`, `'./find.js'`, `'./stt-cloud.js'`, `'./report.js'`, `'./lang-guess.js'`, `'./captions.js'`, `'./presets.js'`, `'./config.js'` (dòng 7). *(Lưu ý: `dialogs.js` và `find.js` đã nạp ở `translator/index.html` dòng 701–702 và có mặt trong `CORE`, dù `CLAUDE.md` dòng 22 chưa liệt kê. `room.bundle.js` không nằm trong `CORE` nhưng vẫn được `kiem-tra-dich.js` dòng 127 tính vào nhóm bắt buộc tăng `CACHE`.)*
  - CSS & ảnh thanh toán (4): `'./donate-qr.jpg'`, `'./styles.css'`, `'./ui.css'`, `'./fonts.css'` (dòng 7).
  - Phông chữ (8): `./fonts/be-vietnam-pro-latin-{400,500,600,700}.woff2` (dòng 8) và `./fonts/be-vietnam-pro-vietnamese-{400,500,600,700}.woff2` (dòng 9).
  - Manifest & biểu tượng (7): `'./manifest.json'` (dòng 9), `'./icons/icon-192.png'`, `'./icons/icon-512.png'` (dòng 10), `'./icons/icon-512-maskable.png'`, `'./icons/apple-touch-icon.png'` (dòng 11), `'./icons/logo-mark.png'`, `'./icons/logo-full.png'` (dòng 12).
- **Nghĩa vụ bắt buộc** (`CLAUDE.md` dòng 51–52): sửa bất kỳ tệp nào trong `CORE` (hoặc `room.bundle.js`) **PHẢI tăng số `CACHE`** (ví dụ `translator-v87` → `translator-v88`).

### 1.4. Các hạng mục kiểm tra của `cong-cu/kiem-tra-dich.js` (dòng 1–179)

| Mục | Dòng | Nội dung kiểm tra | Mức xử lý |
|---|---|---|---|
| 1. Cú pháp | 44–73 | `node --check` trên mọi `.js` trong `translator/` (trừ `node_modules`, mục ẩn) và kiểm tra `<script>` nội tuyến trong `.html` bằng `vm.Script` | **LỖI** `[CU PHAP]` (thoát `1`) |
| 2. Kiểm thử đơn vị | 75–92 | Chạy `node --test --test-reporter=tap` trên toàn bộ `translator/tests/*.test.js` (hiện 6 tệp, 67 phép thử) | **LỖI** `[KIEM THU]` nếu có phép thử rớt (thoát `1`) |
| 3. Tồn tại `CORE` | 94–103 | Đọc mảng `CORE` từ `service-worker.js`, xác nhận mọi tệp đều tồn tại trong `translator/` | **LỖI** `[SERVICE WORKER]` nếu thiếu tệp (thoát `1`) |
| 4. Nhánh so sánh | 105–120 | Chọn nhánh gốc theo thứ tự `origin/claude/realtime-translation-app-68o1ik` → `claude/realtime-translation-app-68o1ik` → `origin/main` → `main` (hoặc `argv[2]`), tìm `merge-base`, gom tệp đã sửa + tệp mới chưa theo dõi | Cảnh báo `[GIT]` nếu không thấy nhánh gốc |
| 5. Tăng `CACHE` | 122–136 | Nếu có tệp trong `CORE` hoặc `translator/room.bundle.js` thay đổi mà `CACHE` không đổi so với `base` | **LỖI** `[SERVICE WORKER]` (thoát `1`) |
| 6. `room.bundle.js` | 138–144 | Sửa `translator/src/room.js` mà chưa sửa `translator/room.bundle.js` → **LỖI** `[BUNDLE]`; sửa ngược lại (`room.bundle.js` đổi, `src/room.js` không đổi) → **CẢNH BÁO** | **LỖI** (thoát `1`) / **CẢNH BÁO** |
| 7. `styles.css` | 146–152 | Sửa `input.css` hoặc `tailwind.config.js` mà chưa sửa `styles.css` → **LỖI** `[TAILWIND]`; sửa `index.html` hoặc `app.js` mà không sửa `styles.css` → **CẢNH BÁO** nhắc build lại nếu có lớp Tailwind mới | **LỖI** (thoát `1`) / **CẢNH BÁO** |
| 8. Cảnh báo rủi ro & phạm vi | 154–165 | (a) Sửa `firestore.rules` → `[FIRESTORE]` (nhắc chạy Emulator, Publish, kiểm tra đã sửa `rules-test*.js` chưa); (b) sửa `config.js` → `[CONFIG]`; (c) sửa tệp ngoài danh sách trắng (`translator/`, `.bangiao/`, `.claude/`, `cong-cu/`, `CLAUDE.md`, `.gitignore`) → `[PHAM VI]` | **CẢNH BÁO** (vẫn thoát `0` / `DAT`) |

**Phát hiện quan trọng ở dòng 162–163:** Danh sách trắng của `cong-cu/kiem-tra-dich.js` **chưa có** `.agents/` và `AGENTS.md`. Do đó mọi nhánh làm việc theo quy trình A1–A5 đều xuất hiện cảnh báo `[PHAM VI]` liệt kê các tệp `.agents/*` (và `AGENTS.md` nếu có sửa), dù kết quả vẫn là `KIEM TRA TU DONG: DAT`. Vì `PLAN.md` khóa không sửa `cong-cu/*`, A3 và A5 cần biết trước cảnh báo này và chỉ kiểm tra xem trong danh sách cảnh báo có lẫn tệp ứng dụng ở thư mục gốc hay không.

---

## 2. Đối chiếu dây chuyền cũ (`.claude/agents/*`, `.claude/commands/*`, `.bangiao/`) với chuỗi A1–A5 (`.agents/`)

### 2.1. Bảng ánh xạ và điểm trùng

| Thành phần dây chuyền cũ | Tương ứng chuỗi mới | Điểm trùng | Điểm khác biệt chính |
|---|---|---|---|
| `.claude/agents/planner.md` | `.agents/roles/A1.md` (Claude Code) | Chỉ đọc, không viết code; xác định mục tiêu, danh sách đóng, mục `KHÔNG ĐỔI`, trường hợp biên, câu hỏi còn bỏ ngỏ | Cũ ghi `.bangiao/ke-hoach.md` (bị `.gitignore`); mới ghi `.agents/PLAN.md` (lưu Git), phân vai A2/A3/A4/A5, cho phép bỏ qua A1/A2 cho việc nhỏ |
| *(gộp trong `planner` / `coder`)* | `.agents/roles/A2.md`, `A4.md` (Antigravity) | — | Tách riêng khâu khảo sát mã (A2 → `.agents/SURVEY.md`) và khâu giao diện HTML/CSS/SVG/biểu tượng (A4) |
| `.claude/agents/coder.md` | `.agents/roles/A3.md` (Codex CLI) | Sửa có mục tiêu trong danh sách đóng; tuân thủ JS thuần, chống XSS, CACHE, `room.bundle.js`, `styles.css`, `firestore.rules` + `rules-test*.js` + `FIREBASE-SETUP.md`, logic thuần có test `node:test`; kiểm tra phạm vi bằng `git status` | Cũ chạy Claude (`sonnet`), ghi `.bangiao/thay-doi.md`, **không tự commit** (`coder.md` dòng 31); mới chạy Codex CLI, tự chạy `node cong-cu/kiem-tra-dich.js`, **tự commit từng bước** kèm `Agent: Codex/<mô hình>` |
| `.claude/agents/tester.md` | Phân bổ sang **A3** và **A5** | Chạy `node cong-cu/kiem-tra-dich.js`, viết kiểm thử `node:test`, soạn kịch bản kiểm thử trên thiết bị, hướng dẫn chạy Emulator | Viết test đơn vị + chạy kiểm tra tự động đưa về A3 (trước bàn giao) và A5 xác nhận lại; soạn kịch bản kiểm thử trên thiết bị chuyển vào A5 |
| `.claude/agents/reviewer.md` | `.agents/roles/A5.md` (Claude Code hoặc Codex CLI) | Chỉ đọc, đối chiếu `git diff` với kế hoạch và danh sách đóng, chạy lại `kiem-tra-dich.js`, kiểm tra các rủi ro riêng của app dịch, xuất phán quyết | Cũ chạy cùng công cụ Claude (`sonnet`), ghi `PHAN QUYET: CHOT / CAN SUA / CHAN` vào `.bangiao/danh-gia.md`; mới **bắt buộc khác công cụ/mô hình với mọi tác giả** (`AGENTS.md` mục 5), kiểm tra dòng `Agent:` từng commit, ghi `PHÁN QUYẾT: ĐẠT / CẦN SỬA` + dòng `Người viết \| Người rà soát \| Commit` vào `.agents/REVIEW.md` |
| `.claude/commands/kehoach\|tiep\|ship.md` | `.agents/roles/DIEU-PHOI.md` (Codex + Orca) | Chặn chạy trên `main` và `claude/realtime-translation-app-68o1ik` (`tiep.md` dòng 8, `ship.md` dòng 7); dừng khi còn câu hỏi bỏ ngỏ hoặc đụng `firestore.rules`/dịch vụ tốn phí (`ship.md` dòng 13–15); cấm push/gộp PR/`firebase deploy` | Cũ điều phối nội bộ subagent trong một phiên Claude Code; mới điều phối đa công cụ (Claude/Antigravity/Codex) qua `orca orchestration`, hỗ trợ vòng sửa tối đa 2 vòng |

### 2.2. Những điểm của dây chuyền cũ PHẢI giữ lại trong A1–A5 và DIEU-PHOI.md
1. **Checklist "CÁC LỚP BỊ ẢNH HƯỞNG" (`planner.md` dòng 26–33) → đưa vào `A1.md`:** đánh dấu Có/Không cho (i) tệp trong `CORE` của `service-worker.js` → tăng `CACHE`, (ii) `src/room.js` → build lại `room.bundle.js`, (iii) `firebase/firestore.rules` → thêm phép thử + cập nhật `FIREBASE-SETUP.md` + nhắc dán & Publish, (iv) lớp Tailwind mới → build lại `styles.css`, (v) dịch vụ tốn phí Google Cloud (Translate, TTS, STT) hoặc thay đổi đo mức dùng/hạn mức VIP.
2. **Các trường hợp biên đặc thù của app dịch (`planner.md` dòng 35–36) → đưa vào `A1.md` / `A5.md`:** mất mạng, từ chối quyền micro, Safari iOS, hai thiết bị cùng phòng, phòng hết hạn, người xem chưa đăng nhập, hết hạn mức, chuỗi rỗng.
3. **Kịch bản kiểm thử trên thiết bị (`tester.md` dòng 30–37, 27–28) → đưa vào `A5.md`:**
   - Phủ các nền tảng liên quan: Máy tính (Chrome), Android (Chrome), iPhone (Safari).
   - Gồm đường chạy thuận lợi, các trường hợp biên, ít nhất một trường hợp báo lỗi đúng cách (mất mạng, từ chối micro, hết hạn mức...), kịch bản hai thiết bị (chủ phòng + người xem quét QR) nếu đụng phòng họp, và bước xác nhận nạp `CACHE` mới.
   - Đúng mẫu từng bước: `Thao tác → Kết quả mong đợi → [ ] Đạt / [ ] Không đạt`.
   - Nếu `firestore.rules` thay đổi: kèm hướng dẫn chạy `rules-test*.js` bằng Firebase Emulator (agent không tự khởi động Emulator) và nhắc dán quy tắc + bấm Publish trên Firebase Console.
4. **Danh sách rủi ro riêng của app dịch (`reviewer.md` dòng 20–29) → đưa vào `A5.md`:**
   - Dữ liệu người dùng/Firestore đưa vào `innerHTML` chưa escape (XSS lan sang mọi người trong phòng họp).
   - Quy tắc Firestore bị nới lỏng (người lạ đọc/ghi phòng, VIP tự nâng quyền, đọc `config/google` khi không đủ điều kiện).
   - Khóa API hoặc thông tin nhạy cảm bị ghi cứng hoặc lộ ra người xem.
   - Phát sinh chi phí Google Cloud ngoài dự kiến hoặc bỏ qua hạn mức/đo mức dùng.
   - Quên tăng `CACHE`, quên build lại `room.bundle.js` hoặc `styles.css`.
   - Rò rỉ tài nguyên: micro, `AudioContext`, listener `onSnapshot` không được dừng.
   - Hỏng trên Safari iOS (âm thanh cần thao tác chạm, API không hỗ trợ, `localStorage` bị xóa).
   - Sửa nhầm tệp của ứng dụng tra cứu nhà xưởng ở thư mục gốc.
5. **Cổng dừng cho `firestore.rules` và dịch vụ tốn phí (`ship.md` dòng 14–15) → đưa vào cổng dừng (b) của `DIEU-PHOI.md`** (bổ sung cùng hạn mức VIP).

### 2.3. Nguy cơ xung đột khi `.agents/` và `.bangiao/` cùng tồn tại
1. **Lẫn sổ bàn giao và trạng thái Git (`.gitignore` dòng 2):** `.bangiao/` bị `.gitignore` bỏ qua và bị lệnh `/kehoach`, `/tiep`, `/ship` xóa sạch mỗi phiên, còn `.agents/PLAN.md`, `SURVEY.md`, `REVIEW.md` được theo dõi trong Git. Nếu người dùng chuyển đổi giữa hai dây chuyền trên cùng nhánh, agent có thể đọc nhầm kế hoạch cũ. **Cách tránh:** chọn duy nhất một dây chuyền cho mỗi yêu cầu; các tệp vai trò A1–A5 ghi rõ chỉ đọc `.agents/PLAN.md`, `.agents/SURVEY.md`, `.agents/REVIEW.md` (không đọc `.bangiao/`).
2. **Khác nhau về hành vi commit:** dây chuyền cũ (`coder.md` dòng 31, `tiep.md` dòng 24, `ship.md` dòng 23) không commit; quy trình A1–A5 yêu cầu mỗi vai commit riêng kèm dòng `Agent:`. Nếu nhánh đang có thay đổi chưa commit từ dây chuyền cũ thì Bước 0 của `DIEU-PHOI.md` (yêu cầu `git status` sạch) và bước 0 của `/ship` (`ship.md` dòng 8) đều sẽ dừng.
3. **Cảnh báo `[PHAM VI]` từ `cong-cu/kiem-tra-dich.js` (dòng 162–164):** do công cụ được viết cho dây chuyền cũ (chỉ whitelist `.bangiao/`, `.claude/`), mọi phiên theo quy trình A1–A5 sẽ sinh cảnh báo `[PHAM VI]` cho `.agents/*` (và `AGENTS.md`). Không được coi đó là lỗi `LOI`, nhưng A5 phải đọc kỹ danh sách tệp trong cảnh báo để chắc chắn không có tệp nào thuộc ứng dụng thư mục gốc.
4. **Chênh lệch lớp bảo vệ kỹ thuật giữa các công cụ:** `.claude/settings.json` chỉ có tác dụng với Claude Code; Codex CLI và Antigravity không đọc tệp này. Vì vậy quy trình mới buộc phải dựa vào khối **Quy tắc chung bắt buộc** trong mọi tệp vai trò và khâu kiểm chứng `git diff` + dòng `Agent:` của điều phối viên và A5.

---

## 3. Đề xuất bổ sung `permissions.deny` trong `.claude/settings.json`

Hiện trạng `.claude/settings.json` (dòng 11–26) đã chặn:
- `Bash(git push -u origin claude/realtime-translation-app-68o1ik:*)`, `Bash(git push origin HEAD:claude/realtime-translation-app-68o1ik:*)`, `Bash(git push origin claude/realtime-translation-app-68o1ik:*)`, `Bash(git push origin main:*)`
- `Bash(git push -f:*)`, `Bash(git push --force:*)`, `Bash(git merge:*)`, `Bash(git reset --hard:*)`
- `Bash(gh pr merge:*)`
- `Bash(firebase deploy:*)`, `Bash(npx firebase-tools deploy:*)`
- `Bash(rm -rf:*)`, `Read(./.env)`, `Read(./.env.*)`

Các mục **còn thiếu** so với quy tắc chung trong `AGENTS.md` (dòng 17–18), `CLAUDE.md` (dòng 69–70), `SonadeziLongThanh/.claude/settings.json` (dòng 8) và yêu cầu `PLAN.md` (bước A3-4) — *chỉ đề xuất để A3 bổ sung, không xóa/sửa mục cũ, không đổi `allow`*:

### Nhóm 1 — Bắt buộc tối thiểu theo `PLAN.md` A3-4
1. `"Bash(git rebase:*)"` — chặn rebase (bảo vệ lịch sử nhánh và tránh rebase vào `main`/nhánh phát hành; đồng bộ với repo Bản đồ KCN).
2. `"Bash(gh pr create --base main:*)"` — chặn tạo Pull Request nhắm vào `main` (`AGENTS.md` dòng 17).

### Nhóm 2 — Đề xuất bổ sung để bịt các biến thể lệnh dễ lọt qua quy tắc hiện có
3. `"Bash(gh pr create -B main:*)"` — cờ viết tắt `-B` tương đương `--base` của `gh pr create`.
4. `"Bash(git push --force-with-lease:*)"` — biến thể force-push không khớp mẫu `-f` hoặc `--force`.
5. `"Bash(git push -u origin main:*)"` và `"Bash(git push origin HEAD:main:*)"` — đối xứng với 2 biến thể đã có cho `claude/realtime-translation-app-68o1ik` (dòng 12–13).
6. `"Bash(npx firebase deploy:*)"` — phòng trường hợp gọi ngắn `npx firebase deploy` thay vì `npx firebase-tools deploy`.
7. `"Bash(orca orchestration approve:*)"` — ngăn chặn gọi lệnh tự duyệt hộp thoại quyền, đồng bộ với mục Cấm của `DIEU-PHOI.md`.

*(Lưu ý: không chặn `git push` tổng quát vì `CLAUDE.md` dòng 71 cho phép đẩy nhánh tính năng riêng khi người dùng yêu cầu.)*

---

## 4. Khác biệt điều phối (`DIEU-PHOI.md`) so với repo Bản đồ KCN

Cú pháp lệnh `orca orchestration` đã xác minh qua `--help` trùng khớp hoàn toàn với bản Orca **1.4.272** khảo sát ở repo `SonadeziLongThanh` (`feat/dieu-phoi:.agents/SURVEY.md` và `DIEU-PHOI.md` commit `67b7bba`/`6cad969`). Các khác biệt bắt buộc phải thay đổi khi áp dụng sang repo `Sonadezi`:

| Hạng mục | Repo Bản đồ KCN (`SonadeziLongThanh`) | Repo App dịch Live (`Sonadezi`) |
|---|---|---|
| **Thư mục chính không được sửa** | `C:\SZL-Apps\SonadeziLongThanh` | `C:\SZL-Apps\Sonadezi` |
| **Nhánh gốc tạo worktree yêu cầu** | `main` | Nhánh phát hành **`claude/realtime-translation-app-68o1ik`** (KHÔNG tạo từ `main` vì `main` cũ hơn) |
| **Kiểm tra ở Bước 0** | Nhánh hiện tại là `feat/…` hoặc `fix/…`, `git status` sạch, `orca status --json` sẵn sàng | Thêm yêu cầu: nhánh `feat/…` hoặc `fix/…` **tách từ `claude/realtime-translation-app-68o1ik`**, **không** đứng trên `main` và **không** đứng trên `claude/realtime-translation-app-68o1ik` |
| **`--base-branch` cho worktree con của Antigravity (A2/A4)** | `--worktree new-child --base-branch <nhánh-hiện-tại> --name <tên-ngắn>` | Giữ nguyên bắt buộc `--base-branch <nhánh-hiện-tại>` (là nhánh yêu cầu đang đứng). **Rủi ro cao hơn nếu bỏ sót:** nhánh mặc định có thể là `main` cũ hoặc nhánh phát hành, khiến worktree con thiếu cả `PLAN.md`, commit A3 và có thể mất phần lớn mã `translator/` mới nhất, gây xung đột khi `git cherry-pick`. Khi dùng `--worktree current` vẫn phải bỏ `--base-branch`, `--name`, `--repo`, `--display-name`, `--comment`, `--setup` (đã xác minh ở `worker-start --help`). |
| **Đích PR & nhánh cấm push** | Đích PR: `main`; cấm push `main` | Đích PR: **`claude/realtime-translation-app-68o1ik`**; **KHÔNG tạo PR vào `main`**; cấm push cả `main` lẫn `claude/realtime-translation-app-68o1ik` |
| **Lệnh triển khai bị cấm** | `clasp push`, `clasp deploy/redeploy/...`, `xoaCache()` | `firebase deploy`, `npx firebase-tools deploy` (bỏ toàn bộ quy tắc `clasp` và `xoaCache()`) |
| **Lệnh kiểm chứng tự động** | `node --check < <tệp>.gs` | `node cong-cu/kiem-tra-dich.js` |
| **Lệnh đối chiếu diff của A5** | `git diff main...HEAD` | `git diff claude/realtime-translation-app-68o1ik...HEAD` |
| **Cổng dừng (b)** | Thay đổi phân quyền, xác thực, triển khai | Bổ sung thêm: thay đổi **`translator/firebase/firestore.rules`**, **dịch vụ tốn phí Google Cloud** (Translation, TTS, STT), và **hạn mức VIP** |
| **Thiếu dòng `Agent:` (ghi nhận A5 bên Bản đồ KCN)** | Ghi nhận mức Thấp cần bổ sung | Bổ sung rõ trong `DIEU-PHOI.md`: **Commit thiếu dòng `Agent:` thì dừng và báo anh Hiếu.** |
| **Bước 1 – Phân loại & phạm vi A4** | A4 sửa HTML/CSS/SVG nhận diện SZL, kiểm tra 1920×1080 và điện thoại | A4 sửa `translator/index.html`, `styles.css`/`input.css`/`tailwind.config.js`, `ui.css`, biểu tượng (`translator/icons/*`); kiểm tra máy tính (Chrome), Android (Chrome), iPhone (Safari); nhớ build `styles.css` và tăng `CACHE` nếu sửa tệp `CORE` |

---

## 5. Ghi chú cho A3

1. **Khối `## Quy tắc chung bắt buộc` phải giống hệt nhau từng ký tự ở cả 6 tệp** (`.agents/roles/A1.md`–`A5.md` và `.agents/roles/DIEU-PHOI.md`):
   - Giữ đủ khung ý của mẫu Bản đồ KCN nhưng thay toàn bộ nội dung đặc thù sang repo `Sonadezi`:
     - Đọc `AGENTS.md` (và `CLAUDE.md`) trước khi làm; khi khác nhau, làm theo quy tắc chặt hơn.
     - Chỉ làm việc trong worktree Orca của yêu cầu hiện tại; không sửa thư mục chính `C:\SZL-Apps\Sonadezi`; không sửa ứng dụng ở thư mục gốc kho khi yêu cầu về app dịch.
     - KHÔNG gộp Pull Request, KHÔNG push lên `main` hoặc nhánh phát hành `claude/realtime-translation-app-68o1ik`, KHÔNG tạo Pull Request vào `main`, KHÔNG `git merge`/`git rebase` vào `main` hoặc nhánh phát hành, KHÔNG `git push --force`.
     - KHÔNG chạy `firebase deploy` hoặc `npx firebase-tools deploy`.
     - Không push nhánh, không tạo Pull Request nếu anh Hiếu chưa yêu cầu. Gộp nhánh và triển khai (kể cả dán và Publish quy tắc Firestore) do anh Hiếu thực hiện sau khi tự thử nghiệm.
     - Mỗi commit có dòng cuối: `Agent: <công cụ>/<mô hình>` (ví dụ `Agent: Codex/GPT-6.2-Sol`). Không thêm dòng `Co-Authored-By`.
     - Không ghi khóa Google Cloud, khóa bí mật, mật khẩu, token vào bất kỳ tệp nào (không đưa bí mật vào `translator/config.js`).
     - Báo cáo cuối phiên bằng tiếng Việt, văn phong hành chính: đã làm gì, tệp nào, đã kiểm tra gì (kèm kết quả thật), còn gì chưa làm.
   - Rà soát sau khi viết: bảo đảm trong cả 6 tệp **không còn sót** các chuỗi `clasp`, `xoaCache`, `Apps Script`, `GAS`, `SonadeziLongThanh`, `Script ID`.
2. **Chi tiết từng tệp vai trò (`A3-1`, đúng cấu trúc 4 phần: tiêu đề, `## Nhiệm vụ`, `## Đầu ra bàn giao`, `## Quy tắc chung bắt buộc`):**
   - **`A1.md`:** đọc `AGENTS.md` và `CLAUDE.md`; lập kế hoạch kèm danh sách đóng, mục `KHÔNG ĐỔI` (gồm ứng dụng ở thư mục gốc), bảng đánh dấu Có/Không cho 5 lớp ảnh hưởng (`CORE`/CACHE, `src/room.js`/`room.bundle.js`, `firestore.rules`, lớp Tailwind mới/`styles.css`, dịch vụ tốn phí Google Cloud / hạn mức VIP), trường hợp biên của app dịch, và quy tắc bỏ qua A1/A2 cho việc nhỏ.
   - **`A2.md`:** đọc `AGENTS.md`, `CLAUDE.md`, `.agents/PLAN.md` và mã nguồn liên quan; ghi tệp, hàm, số dòng, luồng dữ liệu, rủi ro và tài liệu chính thức cần tham khảo; chỉ sửa `.agents/SURVEY.md`.
   - **`A3.md`:** giữ quy tắc JavaScript thuần, chống XSS (`textContent`/escape), logic thuần có `module.exports` + viết kiểm thử `node:test`; chạy **`node cong-cu/kiem-tra-dich.js`** trước khi bàn giao (lưu ý không thay bằng `node --test translator/tests/` vì lỗi `MODULE_NOT_FOUND` trên Node 24 Windows); tăng `CACHE` trong `translator/service-worker.js` khi sửa tệp trong `CORE` hoặc `room.bundle.js`; build lại `room.bundle.js` và commit cùng `src/room.js`; build lại `styles.css` khi thêm lớp Tailwind mới hoặc sửa `input.css`/`tailwind.config.js`; khi sửa `firestore.rules` thì cập nhật `rules-test*.js` và `translator/docs/FIREBASE-SETUP.md`. Ghi rõ chỉ đọc `.agents/` (không trộn `.bangiao/`).
   - **`A4.md`:** phạm vi `translator/index.html`, `translator/styles.css`, `translator/input.css`, `translator/tailwind.config.js`, `translator/ui.css`, biểu tượng (`translator/icons/*`); giữ nhận diện màu thương hiệu `#0d4792` và các chế độ hiển thị sẵn có (`big`, `dual`, `viewer`, `minutes`, màn hình chờ); nếu thêm lớp Tailwind mới hoặc sửa `input.css`/`tailwind.config.js` thì build lại `styles.css`; nếu sửa tệp thuộc `CORE` thì tăng `CACHE` trong `translator/service-worker.js` và chạy `node cong-cu/kiem-tra-dich.js`; kiểm tra trên máy tính (Chrome), Android (Chrome), iPhone (Safari).
   - **`A5.md`:** đối chiếu `git diff claude/realtime-translation-app-68o1ik...HEAD` (không dùng `main...HEAD`); xác nhận dòng `Agent:` của mọi commit không trùng công cụ với mình (thiếu dòng `Agent:` thì dừng báo); chạy lại `node cong-cu/kiem-tra-dich.js`; kiểm tra đủ các rủi ro riêng của app dịch (XSS qua `innerHTML`, quy tắc Firestore bị nới, lộ khóa, chi phí Google Cloud/hạn mức VIP, quên `CACHE`/`room.bundle.js`/`styles.css`, rò rỉ micro/`AudioContext`/`onSnapshot`, Safari iOS, sửa nhầm ứng dụng ở thư mục gốc); giữ đúng 2 dòng mở đầu theo mẫu (`PHÁN QUYẾT: ĐẠT` hoặc `PHÁN QUYẾT: CẦN SỬA` và `Người viết: ... | Người rà soát: ... | Commit: ...`), liệt kê lỗi Cao/Trung bình/Thấp kèm tệp và số dòng; cuối `REVIEW.md` soạn **kịch bản kiểm thử trên thiết bị** (`Thao tác → Kết quả mong đợi → [ ] Đạt / [ ] Không đạt`, có kịch bản 2 thiết bị nếu đụng phòng họp, bước kiểm tra `CACHE` mới, và hướng dẫn chạy Emulator + dán Publish nếu đổi `firestore.rules`).
3. **Chi tiết cho `DIEU-PHOI.md` (`A3-2`):**
   - Giữ nguyên toàn bộ khối lệnh `orca orchestration` đã xác minh trên Orca `1.4.272` từ mẫu `SonadeziLongThanh` (`--environment local`, `--spec-file "$env:TEMP\..."`, cấm `<<`/`<<<`, bỏ cờ tạo worktree khi dùng `--worktree current`, `check` không cần `--ack`, `--types "worker_done,question,escalation"` có ngoặc kép trên PowerShell, `worker-show`/`worker-read --source auto`, xử lý `permission prompt` bằng `deny`/mời anh Hiếu bấm Allow/Deny, cấm `approve` và `Nested worker depth`).
   - Áp dụng trọn bộ các khác biệt ở Mục 4: nhánh gốc `claude/realtime-translation-app-68o1ik`, Bước 0 chặn `main` và `claude/realtime-translation-app-68o1ik`, `--base-branch <nhánh-hiện-tại>` cho `new-child`, cổng dừng (b) thêm `firestore.rules`/dịch vụ tốn phí Google Cloud/hạn mức VIP, quy tắc "Commit thiếu dòng `Agent:` thì dừng và báo anh Hiếu", và khối Quy tắc chung khớp từng ký tự với `A1.md`.
4. **Chỉnh `AGENTS.md` (`A3-3`) và `.claude/settings.json` (`A3-4`):**
   - `AGENTS.md`: chỉ thêm mục `## 7. Vai trò agent và phương án điều phối` ở cuối tệp (sau dòng 50), đủ mọi ý trong `PLAN.md` A3-3; không sửa nội dung dòng 1–50.
   - `.claude/settings.json`: chỉ thêm các mục vào `permissions.deny` (tối thiểu Nhóm 1 ở Mục 3, cân nhắc thêm Nhóm 2), giữ nguyên `allow` và 14 mục `deny` hiện có, xác minh JSON hợp lệ.
5. **Tự kiểm tra (`A3-5`):**
   - Khi chạy `node cong-cu/kiem-tra-dich.js`, kết quả kỳ vọng là `KIEM TRA TU DONG: DAT` (mã thoát `0`) kèm cảnh báo `[PHAM VI]` cho `.agents/*` và `AGENTS.md` (do `kiem-tra-dich.js` dòng 162–163 chưa whitelist 2 mục này và `cong-cu/*` nằm ngoài phạm vi sửa). Xác nhận không có tệp ứng dụng ở thư mục gốc trong cảnh báo.
   - Xác nhận `git diff --stat claude/realtime-translation-app-68o1ik...HEAD` chỉ chứa tệp thuộc danh sách đóng mục 2 `PLAN.md` (cộng các tệp đã có từ `aeb23e6`, `4d4c81f`, `ee6ea37`).
   - Commit riêng 4 bước `A3-1`, `A3-2`, `A3-3`, `A3-4`, dòng cuối `Agent: Codex/<mô hình>`, không `Co-Authored-By`.
