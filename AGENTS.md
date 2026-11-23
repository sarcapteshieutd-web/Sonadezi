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
