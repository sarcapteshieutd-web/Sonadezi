# Thiết kế: Skill "Xử lý PDF SZL" cho Claude Team/Cowork

Ngày: 22/10/2026 · Phạm vi: thư mục mới `skills/xu-ly-pdf-szl/` · Người dùng: Phòng Kinh doanh Tổng hợp (KD-TH) và các trưởng phòng

## 1. Mục tiêu
Phòng KD-TH và các trưởng phòng tải file PDF lên Claude (gói Team/Cowork), gõ yêu cầu bằng tiếng Việt tự nhiên và nhận kết quả theo mẫu chuẩn thống nhất cho ba việc thường làm nhất:
1. **Tóm tắt nhanh** báo cáo thị trường, hợp đồng, công văn.
2. **Chuyển PDF sang Word** (kể cả bản scan) để chỉnh sửa, không gõ lại.
3. **Dịch tài liệu** Anh/Trung/Hàn/Nhật ↔ Việt cho khách hàng FDI.

Không xây ứng dụng, không cần máy chủ, không cần khóa API: skill chạy trong gói Claude mà phòng sử dụng, chi phí nằm trong gói (chỉ chịu giới hạn mức sử dụng của gói).

## 2. Phạm vi
**Trong phạm vi (giai đoạn 1)**
- Một skill gồm `SKILL.md`, bốn tệp tham chiếu và một tập lệnh chuyển Word (mục 4).
- Ba mẫu tóm tắt, quy tắc dịch, bảng thuật ngữ BĐS KCN năm ngôn ngữ, quy trình chuyển Word.
- Bộ tài liệu thử nghiệm, phiếu đánh giá, hướng dẫn sử dụng một trang, gói `.zip` để quản trị viên tải lên.

**Ngoài phạm vi**
- Trích xuất bảng ra Excel, so sánh hai phiên bản hợp đồng, hỏi đáp nhiều tài liệu (xem xét ở giai đoạn 2).
- Ứng dụng web riêng, Google Apps Script, gọi API trả theo lượt dùng.
- Phân quyền và bảo mật nâng cao (người dùng xác định chưa ưu tiên ở giai đoạn 1).
- Ký số văn bản.

## 3. Quyết định đã chốt với người dùng
1. Người dùng giai đoạn 1: Phòng KD-TH và các trưởng phòng; bảo mật chưa phải ưu tiên.
2. Ba chức năng ưu tiên: Tóm tắt nhanh, Chuyển sang Word, Dịch tài liệu.
3. Ngân sách chưa xác định → chọn hình thức không phát sinh chi phí theo lượt dùng.
4. Nền tảng: **Claude Team/Cowork + skill** (thay cho phương án web app + Apps Script đã xem xét trước đó).
5. Đã duyệt Phần 1 (cấu trúc skill, quy tắc chung) và Phần 2 (nội dung ba chức năng, thử nghiệm).

## 4. Cấu trúc skill
```
skills/xu-ly-pdf-szl/
├── SKILL.md                 Mô tả kích hoạt; quy trình ba chức năng; quy tắc chung
├── references/
│   ├── mau-tom-tat.md       Ba mẫu tóm tắt (mục 6.1)
│   ├── quy-tac-dich.md      Quy tắc dịch (mục 6.3)
│   ├── thuat-ngu-kcn.md     Bảng thuật ngữ Việt – Anh – Trung – Hàn – Nhật
│   ├── chuyen-word.md       Quy trình chuyển Word (mục 6.2)
│   └── giong-van-szl.md     Bản sao giọng văn SZL từ gốc kho mã (để skill tự chứa)
└── scripts/
    └── pdf_to_docx.py       Chuyển PDF dạng chữ sang .docx
```
Đóng gói: `skills/xu-ly-pdf-szl.zip` (thư mục `xu-ly-pdf-szl/` ở gốc tệp nén).

**Mô tả kích hoạt (frontmatter `description`)**: nêu rõ ba việc và các cách nói thường gặp — "tóm tắt", "tóm lược", "ý chính", "chuyển sang Word", "chuyển docx", "gõ lại", "dịch", "bản tiếng Anh/Trung/Hàn/Nhật" — khi người dùng đính kèm hoặc nhắc tới file PDF.

## 5. Quy tắc chung (áp dụng cho cả ba chức năng)
1. **Giọng văn**: theo `giong-van-szl.md` (bảng tên chuẩn, xưng hô, từ không dùng); văn phong hành chính, tiếng Việt.
2. **Số liệu**: mọi con số trong bản tóm tắt ghi kèm trang nguồn dạng *(tr. 12)*; không tự suy diễn, không làm tròn khi bản gốc không làm tròn; không có số liệu thì ghi "tài liệu không nêu".
3. **Chỗ không chắc chắn**: chữ đọc kém từ bản scan, thuật ngữ chưa có trong bảng → đánh dấu **[CẦN KIỂM TRA]**.
4. **Nhận định của AI** (ví dụ hàm ý cho KCN Long Thành) phải ghi rõ là nhận định, tách khỏi phần dữ kiện của tài liệu.
5. **Đầu ra**: tóm tắt hiển thị trong khung trò chuyện, xuất Word khi người dùng yêu cầu; chuyển Word và dịch luôn xuất `.docx`.
6. **Hỏi lại tối thiểu**: chỉ hỏi khi thiếu thông tin không thể suy ra (ví dụ ngôn ngữ đích khi tài liệu gốc đã là tiếng Việt).

## 6. Chi tiết ba chức năng

### 6.1. Tóm tắt
| Mẫu | Kích hoạt | Bố cục |
|---|---|---|
| (1) Cho lãnh đạo — **mặc định** | Yêu cầu "tóm tắt" không kèm chỉ định | Tối đa 1 trang: Tài liệu gì/ai ban hành/ngày → 5 ý chính → Số liệu quan trọng (có trang nguồn) → Đề xuất/việc cần làm cho SZL → Điểm cần lưu ý |
| (2) Chi tiết | Có từ "chi tiết", "đầy đủ" | Tóm tắt theo chương/mục + bảng số liệu tổng hợp |
| (3) Hợp đồng/MOU | Tài liệu được nhận diện là hợp đồng, phụ lục, MOU | Bảng điều khoản: các bên, đối tượng thuê, diện tích, đơn giá, phí quản lý, thời hạn, thanh toán, phạt, chấm dứt, tranh chấp → Điều khoản bất lợi/cần đàm phán |

Báo cáo thị trường (CBRE, Savills, JLL, Cushman & Wakefield…): thêm mục "Hàm ý cho KCN Long Thành", ghi rõ là nhận định của AI.

### 6.2. Chuyển sang Word
1. Nhận diện PDF có lớp chữ hay chỉ là ảnh scan (thử trích chữ; ít hoặc không có chữ → bản scan).
2. **PDF dạng chữ**: chạy `scripts/pdf_to_docx.py` (dùng thư viện `pdf2docx` để giữ bố cục). Nếu thư viện không có trong môi trường, tập lệnh tự chuyển sang dựng lại bằng `pdfplumber` + `python-docx`: giữ tiêu đề, đoạn, bảng; không giữ vị trí hình. Tập lệnh in ra cách đã dùng.
3. **PDF scan**: Claude đọc chữ từ ảnh từng trang, dựng `.docx` theo cấu trúc văn bản hành chính (quốc hiệu, số ký hiệu, trích yếu, nội dung, nơi nhận) khi tài liệu là công văn/quyết định.
4. Kiểm tra trước khi giao: số trang đã xử lý bằng số trang gốc; số bảng tương ứng; liệt kê các trang đọc kém với **[CẦN KIỂM TRA]**.
5. Giao tệp `<tên-gốc>_word.docx` kèm 1–2 dòng ghi chú chất lượng (cách chuyển đã dùng, trang cần kiểm tra).

### 6.3. Dịch
- Cặp ngôn ngữ: Anh/Trung/Hàn/Nhật ↔ Việt; tự nhận diện ngôn ngữ nguồn; mặc định dịch sang tiếng Việt; tài liệu gốc tiếng Việt mà không nêu ngôn ngữ đích → hỏi lại.
- Bắt buộc dùng `thuat-ngu-kcn.md`; thuật ngữ chưa có → dịch theo nghĩa phổ biến và đánh dấu **[CẦN KIỂM TRA]**.
- Giữ nguyên con số, đơn vị, tiền tệ (không quy đổi); tên riêng/tên công ty giữ nguyên, lần đầu kèm phiên âm hoặc nghĩa.
- Giữ cấu trúc tiêu đề, bảng, danh sách; xuất `<tên-gốc>_<mã ngôn ngữ đích>.docx` (vi, en, zh, ko, ja).
- Tài liệu dài hơn khoảng 30 trang: dịch theo từng phần, báo tiến độ, kiểm tra đủ số trang khi ghép.
- Bản song ngữ hai cột chỉ làm khi người dùng yêu cầu.

## 7. Xử lý lỗi và trường hợp biên
| Tình huống | Cách xử lý |
|---|---|
| PDF có mật khẩu | Báo người dùng gỡ mật khẩu hoặc cung cấp mật khẩu; không cố bẻ khóa |
| File quá lớn so với giới hạn của gói | Đề nghị tách theo khoảng trang và xử lý từng phần |
| Bản scan mờ, nghiêng | Vẫn xử lý; liệt kê trang đọc kém, đánh dấu **[CẦN KIỂM TRA]** |
| Tài liệu nhiều ngôn ngữ | Dịch phần ngoại ngữ, giữ phần tiếng Việt; nêu rõ trong ghi chú |
| Không chạy được mã (môi trường không cho chạy tập lệnh) | Chuyển Word bằng cách Claude dựng lại nội dung và xuất qua công cụ tạo .docx sẵn có; ghi chú là không giữ bố cục gốc |

## 8. Thử nghiệm và tiêu chí nghiệm thu
1. **Bộ mẫu** (phòng cung cấp ~8 tệp): 2 báo cáo thị trường, 2 hợp đồng/MOU, 2 công văn scan, 2 hồ sơ tiếng nước ngoài.
2. **Chạy thử** cả ba chức năng trên bộ mẫu trong Claude Team/Cowork với skill đã tải lên.
3. **Phiếu đánh giá** (2–3 người chấm Đạt / Cần sửa / Không đạt):
   - Tóm tắt: không có số liệu sai so với bản gốc; có trang nguồn; đúng mẫu.
   - Word: mở được, đọc được, ít phải sửa; số trang đủ.
   - Dịch: thuật ngữ đúng bảng; không bỏ sót đoạn; số liệu giữ nguyên.
4. **Nghiệm thu**: tối thiểu 80% hạng mục "Đạt"; không có lỗi sai số liệu trong tóm tắt.
5. **Kiểm thử tập lệnh** `pdf_to_docx.py` trong kho mã: chạy với một PDF dạng chữ mẫu ở cả hai nhánh (có và không có `pdf2docx`), kiểm tra tệp .docx tạo ra mở được và có nội dung.

## 9. Phân phối
- Đóng gói `.zip`; quản trị viên tổ chức tải lên mục quản lý Skills của Claude (tên mục cụ thể cần đối chiếu giao diện hiện hành).
- Hướng dẫn sử dụng 1 trang `skills/xu-ly-pdf-szl/HUONG-DAN.md`: ví dụ câu lệnh cho ba chức năng, cách đọc ghi chú [CẦN KIỂM TRA], cách đề xuất bổ sung thuật ngữ.

## 10. Điểm chưa chắc chắn (kiểm chứng trong thử nghiệm)
- Môi trường chạy mã của Cowork có sẵn `pdf2docx` hay không; nếu không, chất lượng giữ bố cục khi chuyển Word thấp hơn (đã có nhánh dự phòng).
- Với bản scan, Word chỉ dựng lại gần đúng bố cục.
- Giới hạn dung lượng/số trang tệp tải lên và mức sử dụng của gói Team/Cowork hiện hành; giá gói chưa được kiểm chứng.
- Bảng thuật ngữ khởi tạo do AI soạn; phòng cần rà soát trước khi dùng chính thức.
