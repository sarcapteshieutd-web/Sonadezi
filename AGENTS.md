# AGENTS.md — Quy ước chung cho mọi agent

Tệp này áp dụng cho mọi agent lập trình (Claude Code, Codex, Gemini...). Quy ước chi tiết
của kho nằm trong `CLAUDE.md`; tệp này chỉ bổ sung, không chép lại. Khi hai tệp khác nhau,
làm theo quy tắc chặt hơn.

## 1. Bối cảnh

- Đối tượng chính: **app dịch Live** (PWA dịch thời gian thực) trong `translator/`, dùng
  Firebase (Auth + Firestore).
- Kho được đăng tĩnh trên GitHub Pages từ nhánh phát hành
  **`claude/realtime-translation-app-68o1ik`**. Đẩy lên nhánh này là phát hành ngay.
- Cấu trúc thư mục, lệnh kiểm tra/build, quy tắc kỹ thuật: xem `CLAUDE.md` mục 1–4.

## 2. Nhánh và pull request

- KHÔNG tạo pull request vào `main`. Pull request (khi người dùng yêu cầu) chỉ nhắm vào
  nhánh phát hành.
- Các quy tắc push/merge/deploy còn lại: xem `CLAUDE.md` mục 5.

## 3. Sửa có mục tiêu

- Chỉ sửa đúng phần yêu cầu cần. Không dọn dẹp, đổi tên, định dạng lại hay "cải tiến"
  đoạn code ngoài phạm vi.
- Không đưa khóa Firebase, khóa Google Cloud, mật khẩu, token hay bất kỳ bí mật nào vào mã,
  tệp cấu hình, commit hay tệp điều phối. Thông số Firebase công khai đã có sẵn trong
  `translator/config.js`; không thêm gì nhạy cảm vào đó.

## 4. Tệp điều phối trong `.agents/`

| Tệp | Ai ghi | Nội dung |
|---|---|---|
| `.agents/SURVEY.md` | Agent khảo sát | Hiện trạng mã liên quan: tệp, hàm, dòng, rủi ro đã thấy |
| `.agents/PLAN.md` | Agent lập kế hoạch | Mục tiêu, danh sách tệp được sửa, kiểm thử, câu hỏi còn bỏ ngỏ |
| `.agents/REVIEW.md` | Agent rà soát | Phán quyết và các điểm cần sửa kèm tệp, dòng |

- Mỗi agent đọc tệp của chặng trước rồi mới làm việc của mình.
- Dây chuyền 4 agent sẵn có (`/kehoach`, `/tiep`, `/ship`) vẫn dùng `.bangiao/` như mô tả
  trong `CLAUDE.md` mục 6.

## 5. Rà soát

- Agent rà soát PHẢI chạy trên mô hình khác với agent đã viết mã (ví dụ người viết dùng
  Claude thì người rà soát dùng mô hình khác, hoặc ngược lại). Ghi rõ tên mô hình của
  người viết và người rà soát ở đầu `.agents/REVIEW.md`.

## 6. Báo cáo cuối

- Báo cáo cuối cho người dùng viết bằng tiếng Việt: đã đổi gì, đã kiểm tra gì (kèm kết quả
  thật), còn việc gì người dùng phải tự làm.

## 7. Vai trò agent và phương án điều phối

| Vai | Công cụ | Tệp vai trò |
|---|---|---|
| A1 – Kiến trúc sư | Claude Code | [.agents/roles/A1.md](.agents/roles/A1.md) |
| A2 – Khảo sát | Antigravity CLI | [.agents/roles/A2.md](.agents/roles/A2.md) |
| A3 – Lập trình viên chính | Codex CLI | [.agents/roles/A3.md](.agents/roles/A3.md) |
| A4 – Giao diện | Antigravity CLI | [.agents/roles/A4.md](.agents/roles/A4.md) |
| A5 – Rà soát chéo | Codex CLI hoặc Claude Code, theo quy tắc rà soát chéo | [.agents/roles/A5.md](.agents/roles/A5.md) |

- Phương án 3 dùng A1 lập kế hoạch, A2 khảo sát, A3 lập trình, A4 xử lý phần giao diện khi có và A5 rà soát chéo. Việc nhỏ có thể bỏ qua A1/A2 theo hướng dẫn điều phối.
- Để làm thủ công, mở phiên bằng công cụ tương ứng trong worktree của yêu cầu và gõ “Đọc `.agents/roles/A<n>.md` và AGENTS.md rồi làm việc sau: …”, thay `<n>` bằng số vai.
- Để điều phối tự động, mở một phiên Codex trong worktree của yêu cầu và gõ “Đọc `.agents/roles/DIEU-PHOI.md` và AGENTS.md rồi điều phối việc sau: …”.
- Worktree của yêu cầu tạo từ nhánh phát hành `claude/realtime-translation-app-68o1ik`, không tạo từ `main`.
- Dây chuyền cũ `/kehoach`, `/tiep`, `/ship` (chỉ dùng Claude) vẫn giữ làm phương án dự phòng. Mỗi yêu cầu dùng một dây chuyền với tệp bàn giao tương ứng.
