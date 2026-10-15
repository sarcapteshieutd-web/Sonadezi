---
description: Chạy trọn dây chuyền 4 agent (planner → coder → tester → reviewer) cho một yêu cầu trên app dịch.
---

Chạy trọn dây chuyền cho yêu cầu: $ARGUMENTS

0. Kiểm tra nhánh git hiện tại. Nếu là main hoặc nhánh phát hành claude/realtime-translation-app-68o1ik, DỪNG và báo tôi tách nhánh mới từ nhánh phát hành.
   Kiểm tra git status: nếu còn thay đổi chưa commit, DỪNG và báo tôi.
   Xoá các tệp cũ trong .bangiao/ (ke-hoach.md, thay-doi.md, ket-qua-test.md, danh-gia.md).

1. Giao việc cho subagent planner kèm nguyên văn yêu cầu. Chờ có .bangiao/ke-hoach.md.

2. Nếu kế hoạch có CÂU HỎI CÒN BỎ NGỎ, DỪNG và đưa câu hỏi cho tôi.
   Nếu kế hoạch đánh dấu "Có" ở firestore.rules hoặc ở dịch vụ tốn phí, DỪNG và hỏi tôi
   đồng ý trước. Nếu không, giao việc cho subagent coder. Chờ có .bangiao/thay-doi.md.

3. Giao việc cho subagent tester. Chờ có .bangiao/ket-qua-test.md.
   Nếu dòng đầu là KIEM TRA TU DONG: LOI, DỪNG và cho tôi xem lỗi.

4. Giao việc cho subagent reviewer. Cho tôi xem .bangiao/danh-gia.md.

Báo lại phán quyết cuối cùng kèm đường dẫn kịch bản kiểm thử trên thiết bị.
Không commit, không push, không gộp nhánh, không tạo hay gộp pull request,
không chạy firebase deploy.
