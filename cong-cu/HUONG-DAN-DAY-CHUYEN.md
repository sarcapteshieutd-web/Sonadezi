# Hướng dẫn dây chuyền agent — App dịch thời gian thực

## A. Thành phần

| Tệp | Chức năng |
|---|---|
| `CLAUDE.md` (gốc kho) | Quy ước kho: hai ứng dụng, cấu trúc app dịch, lệnh build/kiểm tra, quy tắc bắt buộc |
| `.claude/agents/planner.md` | Lập kế hoạch, chỉ đọc mã, không sửa |
| `.claude/agents/coder.md` | Sửa mã theo kế hoạch, tự đối chiếu phạm vi trước khi bàn giao |
| `.claude/agents/tester.md` | Viết kiểm thử `node:test`, chạy kiểm tra tự động, soạn kịch bản kiểm thử trên thiết bị |
| `.claude/agents/reviewer.md` | Rà soát cuối, chỉ đọc; trọng tâm XSS, quy tắc Firestore, chi phí Google Cloud, CACHE |
| `.claude/commands/` | `/kehoach`, `/tiep`, `/ship` |
| `.claude/settings.json` | Chặn: đẩy lên nhánh phát hành `claude/realtime-translation-app-68o1ik` và `main`, push --force, gộp nhánh, gộp PR, `firebase deploy`, `rm -rf` |
| `cong-cu/kiem-tra-dich.js` | Kiểm tra tự động (cú pháp, 40+ kiểm thử đơn vị, CACHE, bundle, styles, phạm vi) |

Tất cả nằm trong kho Git, nên dùng được cả ở **Claude Code trên web** (claude.ai/code) lẫn
**ứng dụng Claude desktop → Code** trên máy.

## B. Quy trình mỗi lần thêm/sửa tính năng

| Bước | Thao tác | Ghi chú |
|---|---|---|
| 1 | Mở phiên Claude Code trên kho `sarcapteshieutd-web/sonadezi`, **chọn nhánh `claude/realtime-translation-app-68o1ik`** làm gốc | Tạo nhánh tính năng riêng: nhắn "tạo nhánh mới tên claude/ten-tinh-nang từ nhánh hiện tại" (trên máy: `git checkout claude/realtime-translation-app-68o1ik` → `git pull` → `git checkout -b claude/ten-tinh-nang`) |
| 2 | `/kehoach <yêu cầu cụ thể>` | Đọc kế hoạch, kiểm tra mục KHÔNG ĐỔI và CÁC LỚP BỊ ẢNH HƯỞNG |
| 3 | `/tiep <câu trả lời cho câu hỏi bỏ ngỏ, nếu có>` | Coder → Tester → Reviewer |
| 4 | Đọc `.bangiao/danh-gia.md` | CHỐT / CẦN SỬA / CHẶN |
| 5 | Chạy thử trên máy: `cd translator` → `python -m http.server 8080` → mở `http://localhost:8080` | Làm theo kịch bản trong `.bangiao/ket-qua-test.md` |
| 6 | Nếu có sửa `firestore.rules`: Firebase Console → Firestore Database → Rules → dán lại toàn bộ → **Publish** | Quy tắc không tự cập nhật theo mã |
| 7 | Commit, đẩy nhánh tính năng, tạo pull request **vào `claude/realtime-translation-app-68o1ik`**, rồi tự gộp trên GitHub | Có thể nhắn Claude "commit, đẩy nhánh và tạo pull request vào claude/realtime-translation-app-68o1ik" — **không** yêu cầu gộp |
| 8 | Kiểm tra lại trên trang thật sau khi GitHub Pages cập nhật (thường vài phút) | Tải lại trang 2 lần để service worker nạp CACHE mới |

## C. Mẫu câu lệnh

```
/kehoach Thêm nút sao chép toàn bộ bản dịch trong lịch sử chat. Chỉ hiện khi có ít nhất một tin nhắn. Sao chép xong hiện thông báo "Đã sao chép" 2 giây.
```
```
/kehoach Sửa lỗi trên iPhone: bấm micro lần đầu không nghe được. Chỉ sửa luồng micro chế độ thường, không đụng chế độ họp song ngữ.
```
```
/ship Đổi chữ "Ủng hộ" thành "Ủng hộ tác giả" trên nút ở đầu trang.
```

Yêu cầu càng ghi rõ **màn hình nào, chế độ nào (thường/họp/hội nghị), ai dùng (khách/VIP/quản trị),
hành vi khi lỗi**, kế hoạch càng chính xác.

## D. Xử lý tình huống

| Tình huống | Cách xử lý |
|---|---|
| Planner nêu CÂU HỎI CÒN BỎ NGỎ | Trả lời ngay sau lệnh: `/tiep Trả lời: ...` |
| KIEM TRA TU DONG: LOI về CACHE | Nhắn: "dùng subagent coder tăng CACHE trong service-worker.js", rồi `/tiep` |
| KIEM TRA TU DONG: LOI về BUNDLE | Nhắn: "dùng subagent coder build lại room.bundle.js theo CLAUDE.md", rồi `/tiep` |
| Kiểm thử đơn vị rớt | Không sửa test cho xanh; nhắn "dùng subagent coder sửa mã cho các phép thử rớt", rồi `/tiep` |
| CẦN SỬA / CHẶN | Đọc lý do; xử lý theo góp ý hoặc chỉnh yêu cầu rồi chạy lại từ `/kehoach` |
| Không ưng toàn bộ kết quả | Bỏ nhánh (web: đóng phiên/không tạo PR; máy: `git checkout main` → `git branch -D ten-tinh-nang`) |
| Hết hạn mức sử dụng giữa chừng | Chờ hạn mức làm mới, chạy lại `/tiep` |

## E. Lưu ý quan trọng

- **Gộp vào `claude/realtime-translation-app-68o1ik` = phát hành ngay** cho mọi người dùng (GitHub Pages phục vụ nhánh này).
  Trước đây Claude trên web làm việc trực tiếp trên nhánh này; từ nay mỗi tính năng làm trên nhánh
  riêng để có bước duyệt trước khi phát hành. Dây chuyền tự dừng nếu phát hiện đang đứng trên nhánh phát hành.
- Kho có thêm **app tra cứu nhà xưởng ở thư mục gốc**. Công cụ kiểm tra cảnh báo `[PHAM VI]` nếu tệp
  ngoài `translator/` bị sửa.
- Cả 4 agent mặc định dùng `sonnet`. Tính năng lớn hoặc liên quan quy tắc Firestore/VIP có thể đổi
  `model: sonnet` thành `model: opus` trong `planner.md` và `reviewer.md`.
