---
description: Chạy tiếp coder → tester → reviewer cho app dịch dựa trên kế hoạch đã duyệt trong .bangiao/ke-hoach.md.
---

Chạy tiếp dây chuyền dựa trên kế hoạch đã có. Ghi chú/câu trả lời của tôi: $ARGUMENTS

0. Kiểm tra .bangiao/ke-hoach.md tồn tại. Nếu không, DỪNG và báo tôi chạy /kehoach trước.
   Kiểm tra nhánh hiện tại: nếu là main hoặc nhánh phát hành claude/realtime-translation-app-68o1ik, DỪNG và báo tôi tách nhánh mới từ nhánh phát hành.
   Xoá tệp cũ thay-doi.md, ket-qua-test.md, danh-gia.md trong .bangiao/.

1. Nếu phần ghi chú/câu trả lời ở trên không trống, chép NGUYÊN VĂN vào cuối
   .bangiao/ke-hoach.md dưới tiêu đề "TRẢ LỜI CỦA NGƯỜI DÙNG (ưu tiên cao nhất)".
   Nếu kế hoạch còn CÂU HỎI CÒN BỎ NGỎ chưa được trả lời và không có giá trị
   "Mặc định" nào được tôi chấp nhận, DỪNG và hỏi tôi.

2. Giao việc cho subagent coder, kèm nguyên văn phần trả lời của tôi.
   Chờ có .bangiao/thay-doi.md.

3. Giao việc cho subagent tester. Chờ có .bangiao/ket-qua-test.md.
   Nếu dòng đầu là KIEM TRA TU DONG: LOI, DỪNG và cho tôi xem lỗi.

4. Giao việc cho subagent reviewer. Cho tôi xem .bangiao/danh-gia.md.

Không commit, không push, không gộp nhánh, không tạo hay gộp pull request,
không chạy firebase deploy.
