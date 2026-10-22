# QUY TRÌNH CHUYỂN PDF SANG WORD

## Bước 1. Nhận diện loại PDF

Chạy (thư mục gốc của skill):

```
python scripts/pdf_to_docx.py <vao.pdf> --check
```

Kết quả `{"is_scan": false, ...}` → PDF dạng chữ, làm Bước 2A.
Kết quả `{"is_scan": true, ...}` → bản scan, làm Bước 2B.

Mã thoát và cách xử lý:
- `2` (PDF có mật khẩu): báo người dùng gỡ mật khẩu hoặc cung cấp mật khẩu. Không cố bẻ khóa.
- `1` (không tìm thấy tệp, không phải PDF, tệp hỏng): báo lỗi bằng tiếng Việt, đề nghị gửi lại tệp.

## Bước 2A. PDF dạng chữ

```
python scripts/pdf_to_docx.py <vao.pdf>
```

- Tập lệnh ghi `<tên-gốc>_word.docx` cạnh tệp vào và in JSON gồm `method`, `pages`, `tables`.
- `method = "pdf2docx"`: giữ bố cục tốt.
- `method = "fallback"`: môi trường không có pdf2docx; giữ tiêu đề, đoạn văn, bảng nhưng không giữ vị trí hình. Nêu điều này trong ghi chú cho người dùng.
- Nếu không chạy được mã: đọc nội dung PDF và dựng tệp .docx bằng công cụ tạo Word sẵn có; ghi chú "không giữ bố cục gốc".

## Bước 2B. Bản scan

1. Đọc chữ từ ảnh từng trang (Claude đọc trực tiếp).
2. Với công văn, quyết định: dựng tệp .docx theo cấu trúc văn bản hành chính:
   quốc hiệu – tiêu ngữ; tên cơ quan; số, ký hiệu; địa danh, ngày tháng; trích yếu; nội dung; nơi nhận; chức vụ, người ký.
3. Với tài liệu khác: giữ thứ tự tiêu đề, đoạn, bảng như bản gốc.
4. Chữ mờ, không đọc được chắc chắn: giữ nguyên phần đọc được và ghi **[CẦN KIỂM TRA]** ngay sau.
5. Đặt tên tệp `<tên-gốc>_word.docx`.

## Bước 3. Kiểm tra trước khi giao

- Số trang đã xử lý bằng số trang gốc.
- Số bảng trong .docx tương ứng số bảng trong PDF.
- Liệt kê các trang đọc kém.

## Bước 4. Giao tệp

Gửi `<tên-gốc>_word.docx` kèm 1–2 dòng ghi chú, ví dụ:

> Đã chuyển 12/12 trang, 3 bảng (cách chuyển: giữ bố cục). Trang 7, 9 chữ mờ, đã đánh dấu [CẦN KIỂM TRA].
