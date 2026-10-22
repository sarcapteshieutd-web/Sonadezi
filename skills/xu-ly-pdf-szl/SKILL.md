---
name: xu-ly-pdf-szl
description: Xử lý tài liệu PDF cho Phòng Kinh doanh Tổng hợp, Công ty CP Sonadezi Long Thành (SZL) theo mẫu chuẩn — tóm tắt (báo cáo thị trường, hợp đồng, MOU, công văn), chuyển PDF sang Word kể cả bản scan, và dịch tài liệu Anh/Trung/Hàn/Nhật ↔ Việt theo thuật ngữ bất động sản khu công nghiệp. Dùng khi người dùng đính kèm hoặc nhắc tới file PDF và yêu cầu "tóm tắt", "tóm lược", "ý chính", "chuyển sang Word", "chuyển docx", "gõ lại", "dịch", "bản tiếng Anh/Trung/Hàn/Nhật".
---

# Xử lý PDF SZL

Skill phục vụ ba việc: **tóm tắt**, **chuyển sang Word**, **dịch**. Trả lời bằng tiếng Việt, văn phong hành chính.

## Quy tắc chung (bắt buộc cho cả ba việc)

1. **Giọng văn**: theo `references/giong-van-szl.md` (bảng tên chuẩn, xưng hô, từ không dùng).
2. **Số liệu**: mọi con số trong bản tóm tắt ghi kèm trang nguồn dạng `(tr. 12)`. Không suy diễn, không làm tròn khi bản gốc không làm tròn. Không có số liệu thì ghi "Tài liệu không nêu".
3. **Chỗ không chắc chắn**: chữ đọc kém từ bản scan, thuật ngữ chưa có trong bảng → ghi **[CẦN KIỂM TRA]**.
4. **Nhận định của AI** (đề xuất, hàm ý cho KCN Long Thành) phải ghi rõ là nhận định, tách khỏi dữ kiện của tài liệu.
5. **Đầu ra**: tóm tắt hiển thị trong khung trò chuyện, xuất Word khi người dùng yêu cầu. Chuyển Word và dịch luôn xuất tệp `.docx`.
6. **Hỏi lại tối thiểu**: chỉ hỏi khi thiếu thông tin không thể suy ra (ví dụ ngôn ngữ đích khi tài liệu gốc đã là tiếng Việt).

## Chọn việc cần làm

| Người dùng nói | Việc | Đọc trước |
|---|---|---|
| "tóm tắt", "tóm lược", "ý chính", "đọc giúp" | Tóm tắt | `references/mau-tom-tat.md` |
| "chuyển sang Word", "chuyển docx", "gõ lại", "sửa được" | Chuyển Word | `references/chuyen-word.md` |
| "dịch", "bản tiếng Anh/Trung/Hàn/Nhật/Việt" | Dịch | `references/quy-tac-dich.md`, `references/thuat-ngu-kcn.md` |

Yêu cầu gồm nhiều việc (ví dụ "dịch rồi tóm tắt"): làm lần lượt theo thứ tự người dùng nêu.

## 1. Tóm tắt

- Mặc định dùng **Mẫu 1 – Cho lãnh đạo** (tối đa 1 trang).
- "Chi tiết", "đầy đủ" → Mẫu 2. Hợp đồng, phụ lục, MOU → Mẫu 3.
- Báo cáo thị trường (CBRE, Savills, JLL, Cushman & Wakefield…) → thêm mục "Hàm ý cho KCN Long Thành".
- Trước khi trả lời: đối chiếu lại từng con số với trang nguồn.

## 2. Chuyển sang Word

Chạy lệnh từ thư mục gốc của skill.

1. Chạy `python scripts/pdf_to_docx.py <tệp.pdf> --check` để biết là PDF dạng chữ, bản scan hay hỗn hợp (`scan_pages` liệt kê các trang scan).
2. PDF dạng chữ → `python scripts/pdf_to_docx.py <tệp.pdf> <thư mục ghi được>/<tên-gốc>_word.docx`. Luôn ghi vào thư mục đầu ra của phiên, không ghi cạnh tệp tải lên.
3. Bản scan, hoặc các trang trong `scan_pages` của PDF hỗn hợp → đọc chữ từ ảnh từng trang, dựng nội dung theo `references/chuyen-word.md`.
4. Kiểm tra số trang, số bảng; giao tệp kèm 1–2 dòng ghi chú chất lượng.

## 3. Dịch

- Tự nhận diện ngôn ngữ nguồn; mặc định dịch sang tiếng Việt.
- Bắt buộc dùng thuật ngữ trong `references/thuat-ngu-kcn.md`.
- Giữ nguyên con số, đơn vị, tiền tệ; giữ cấu trúc tiêu đề, bảng, danh sách.
- Xuất `<tên-gốc>_<mã>.docx` (vi, en, zh, ko, ja). Tài liệu dài hơn khoảng 30 trang: dịch từng phần, báo tiến độ.

## Xử lý lỗi và trường hợp đặc biệt

| Tình huống | Cách xử lý |
|---|---|
| PDF có mật khẩu (tập lệnh trả mã 2) | Đề nghị người dùng gỡ mật khẩu hoặc cung cấp mật khẩu; **không bẻ khóa** |
| Tệp quá lớn so với giới hạn của gói | Đề nghị tách theo khoảng trang và xử lý từng phần |
| Bản scan mờ, nghiêng | Vẫn xử lý; liệt kê trang đọc kém, ghi [CẦN KIỂM TRA] |
| Tài liệu nhiều ngôn ngữ | Dịch phần ngoại ngữ, giữ phần tiếng Việt; nêu rõ trong ghi chú |
| Không chạy được mã | Chuyển Word bằng cách đọc nội dung và dựng lại tệp .docx bằng công cụ tạo Word sẵn có; ghi chú "không giữ bố cục gốc" |
| Tệp không phải PDF hoặc bị hỏng (mã 1) | Báo lỗi bằng tiếng Việt, đề nghị gửi lại tệp |
