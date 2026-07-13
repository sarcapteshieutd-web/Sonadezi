# KCN LONG THÀNH — App tra cứu nhà xưởng
Công ty CP Sonadezi Long Thành (SZL) — Phòng Kinh doanh Tổng hợp

═══════════════════════════════════════════════════
PHẦN 1 — ĐƯA APP LÊN MẠNG (làm 1 lần)
═══════════════════════════════════════════════════
PWA chỉ cài lên điện thoại được khi mở qua https://
  • Netlify Drop: vào app.netlify.com/drop → kéo–thả CẢ THƯ MỤC → nhận link https
  • Hoặc GitHub Pages: upload toàn bộ file → Settings > Pages > nhánh main

CÀI LÊN ĐIỆN THOẠI:
  • iPhone (Safari): mở link → Chia sẻ ⎙ → "Thêm vào Màn hình chính"
  • Android (Chrome): mở link → nút "Cài app"

═══════════════════════════════════════════════════
PHẦN 2 — KHOANH LÔ (làm 1 lần, trong app)
═══════════════════════════════════════════════════
Bấm "✏️ Biên tập" → 5 công cụ:
  👆 Chọn          — chạm lô để nhập/sửa; xoá lô sai bằng nút 🗑 trong form
  ✒️ Vẽ lô         — chạm từng GÓC của lô (≥3 đỉnh) → ✓ Hoàn tất
  📍 Ghim          — đặt điểm đánh dấu, không cần khoanh vùng
  🔧 Sửa đỉnh      — chạm lô → kéo từng đỉnh cho khớp ranh
  🗑 Xoá lô tự động — xoá các lô tách máy chưa nhập dữ liệu, làm lại từ đầu

═══════════════════════════════════════════════════
PHẦN 3 — NHẬP LIỆU NHANH BẰNG GOOGLE SHEET  ★
═══════════════════════════════════════════════════
A. THIẾT LẬP (làm 1 lần, ~10 phút)
  1. Tạo Google Sheet mới.
  2. Tiện ích mở rộng (Extensions) → Apps Script.
  3. Xoá code mẫu, dán TOÀN BỘ file AppsScript-Code.gs (trong gói này) → Lưu.
  4. Chọn hàm "taoSheet" ở thanh trên → Chạy (Run) → cấp quyền khi Google hỏi.
     → Sheet "DuLieu" được tạo với đủ cột + danh sách chọn sẵn.
  5. Triển khai (Deploy) → Tuỳ chọn triển khai mới (New deployment):
        Loại              : Ứng dụng web (Web app)
        Thực thi với tư cách: Tôi (Me)
        Quyền truy cập     : Bất kỳ ai (Anyone)     ← BẮT BUỘC
     → Triển khai → SAO CHÉP URL (kết thúc bằng /exec)
  6. Mở app → nút "⚙️ Sheet" → dán URL → 💾 Lưu URL.

B. QUY TRÌNH DÙNG HẰNG NGÀY
  Bước 1 (1 lần): khoanh lô trong app → ⚙️ Sheet → "⬆ Đẩy lên Sheet"
                  → toàn bộ ô xuất hiện thành các dòng trong Sheet.
  Bước 2: cả phòng mở Google Sheet, nhập thông tin vào các cột:
          Tên công ty | Loại | Trạng thái | Diện tích | Ngành nghề |
          Giá thuê | Thời hạn HĐ | Phụ trách | Link brochure | Ghi chú
          (Cột Loại & Trạng thái có danh sách chọn sẵn — bấm là chọn,
           copy-paste và kéo fill hàng loạt như Excel bình thường.)
  Bước 3: trong app bấm "↻ Tải Sheet" → app cập nhật ngay.
          App cũng tự tải từ Sheet mỗi lần mở.

C. QUY ƯỚC MÃ TRONG SHEET
  Cột Loại:       dn    = Doanh nghiệp
                  dat   = Lô đất
                  nx    = Cụm nhà xưởng
  Cột Trạng thái: lease = Đã cho thuê   (lô tô xám)
                  avail = Còn trống     (lô tô tím)
                  hold  = Đang giữ chỗ  (lô tô cam)
                  (để trống = chưa xác định)

D. AN TOÀN DỮ LIỆU
  • "⬆ Đẩy lên Sheet" chỉ THÊM ô mới và cập nhật toạ độ/đường bao.
    KHÔNG ghi đè thông tin đã nhập tay trên Sheet.
  • 3 cột X, Y, Đường bao đã được ẩn — đừng sửa tay.
  • Sửa lại code Apps Script → phải Deploy lại (Quản lý triển khai > Phiên bản mới).

E. DỰ PHÒNG KHÔNG DÙNG SHEET
  Vẫn có thể nhập trực tiếp trong app (✏️ Biên tập) và dùng
  ⬇ Xuất / ⬆ Nhập để chuyển file seed.js giữa các máy.

═══════════════════════════════════════════════════
PHẦN 4 — MỞ APP & CẬP NHẬT APP
═══════════════════════════════════════════════════
A. MỞ APP
  • Cách 1: chạm biểu tượng app (nhà máy xanh) trên màn hình chính điện thoại.
  • Cách 2: mở link https trên trình duyệt (Safari/Chrome) — dùng được ngay,
            không cần cài.
  • Không có mạng vẫn mở được (bản đồ + dữ liệu đã lưu trong máy).
    Chỉ mục "↻ Tải Sheet" là cần mạng.

B. CẬP NHẬT DỮ LIỆU (nhập trên Google Sheet)
  Nhập/sửa trên Sheet → mở app → bấm "↻ Tải Sheet".
  App cũng tự tải từ Sheet mỗi lần mở.
  KHÔNG cần đăng lại file gì lên host.

C. CẬP NHẬT BẢN THÂN APP (khi thay index.html / seed.js / bản đồ mới)
  1. Đăng file mới lên host:
     • Netlify: vào site → tab "Deploys" → kéo–thả lại CẢ THƯ MỤC → xong.
     • GitHub Pages: upload file đè lên → chờ 1-2 phút.
  2. Trên điện thoại: mở app → bấm nút "🔄 Cập nhật" → app tải lại bản mới.
     (Nút này xoá cache cũ, KHÔNG làm mất dữ liệu đã nhập.)

  Nếu vẫn thấy bản cũ (hiếm gặp):
     • iPhone: xoá app khỏi màn hình chính → mở lại link trong Safari → cài lại.
     • Android: Cài đặt > Ứng dụng > Chrome > Bộ nhớ > Xoá bộ nhớ đệm.
