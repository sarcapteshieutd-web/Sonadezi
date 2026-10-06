/* Cấu hình ủng hộ / gói sử dụng. Chỉ cần sửa tệp này, không cần sửa mã ứng dụng.
   Để trống mục nào thì mục đó không hiển thị.
   Lưu ý: ứng dụng chạy hoàn toàn trên trình duyệt (không có máy chủ) nên các nút
   chỉ MỞ trang thanh toán của bạn; ứng dụng không thể tự xác nhận thanh toán hay khóa/mở gói. */
window.APP_CONFIG = {
  donate: {
    title: 'Ủng hộ nhà phát hành',
    message: 'Cảm ơn bạn đã sử dụng ứng dụng. Mọi đóng góp giúp chúng tôi duy trì và phát triển thêm tính năng.',
    // Ảnh mã QR chuyển khoản (ví dụ VietQR), đặt tệp trong thư mục translator/ rồi ghi đường dẫn, ví dụ 'donate-qr.png'
    qrImage: 'donate-qr.jpg',
    // Thông tin tài khoản nhận (hiển thị dạng chữ, có nút sao chép)
    bank: { bankName: '', accountNumber: '', accountName: 'NGUYEN NGOC HIEU', note: 'Quét mã QR bằng ứng dụng ngân hàng hoặc ví điện tử (VietQR)' },
    // Liên kết thanh toán trực tuyến (PayPal.me, Buy Me a Coffee, liên kết thanh toán PayOS/Stripe, v.v.). Chỉ chấp nhận https://
    links: [
      // { label: 'Ủng hộ qua PayPal', url: 'https://paypal.me/...' }
    ]
  },
  // Gói sử dụng hiển thị cho người dùng chọn mua; url là trang thanh toán của từng gói
  plans: [
    // { name: 'Gói tháng', price: '99.000đ / tháng', description: 'Dịch không giới hạn', url: 'https://...' }
  ],
  // Cải thiện nhận diện giọng nói
  recognition: {
    // Bỏ qua câu đã chốt có độ tin cậy thấp hơn mức này (0 đến 1). Đặt 0 để tắt.
    minConfidence: 0.3,
    // Từ điển sửa lỗi: gặp "variants" thì thay bằng "to". Không phân biệt hoa/thường, cần khớp nguyên cụm từ.
    // Các cách nghe sai dưới đây chỉ là ví dụ dự đoán; hãy bổ sung theo kết quả bạn thực sự thấy khi nói.
    glossary: [
      { to: 'Sonadezi', variants: ['so na đê di', 'sô na đê di', 'sô na đề di', 'so na de di', 'sona dezi', 'sona đê di', 'sonadesi', 'sonadezy'] },
      { to: 'KCN', variants: ['ka xê en', 'ca xê en', 'ka c n'] },
      { to: 'Sonadezi Long Thành', variants: ['sonadezi long thanh'] }
    ]
  },
  // Bảng thuật ngữ dịch: khi câu nói chứa cụm ở ngôn ngữ nguồn, bản dịch dùng đúng cụm ở ngôn ngữ đích.
  // Ô để trống ('') thì bỏ qua cặp ngôn ngữ đó (để dịch vụ dịch tự quyết định).
  // QUAN TRỌNG: bản Anh và Trung dưới đây do trợ lý AI đề xuất, CHƯA được người có chuyên môn xác nhận.
  // Hãy để phòng Pháp chế / phiên dịch kiểm tra và sửa trước khi dùng cho thương thảo hợp đồng.
  // Tên tiếng Trung chính thức của các khu công nghiệp để trống, hãy điền tên công ty đang sử dụng.
  terms: [
    // Dự án
    { vi: 'Khu công nghiệp Long Thành', en: 'Long Thanh Industrial Park', zh: '' },
    { vi: 'Khu công nghiệp Châu Đức', en: 'Chau Duc Industrial Park', zh: '' },
    { vi: 'KCN Long Thành', en: 'Long Thanh Industrial Park', zh: '' },
    { vi: 'KCN Châu Đức', en: 'Chau Duc Industrial Park', zh: '' },
    // Thương thảo hợp đồng thuê đất
    { vi: 'hợp đồng thuê đất', en: 'land lease agreement', zh: '土地租赁合同' },
    { vi: 'thuê đất', en: 'land lease', zh: '土地租赁' },
    { vi: 'tiền thuê đất', en: 'land rent', zh: '土地租金' },
    { vi: 'đơn giá thuê', en: 'rental rate', zh: '租金单价' },
    { vi: 'diện tích thuê', en: 'leased area', zh: '租赁面积' },
    { vi: 'thời hạn thuê', en: 'lease term', zh: '租期' },
    { vi: 'tiền đặt cọc', en: 'security deposit', zh: '押金' },
    { vi: 'phí quản lý hạ tầng', en: 'infrastructure management fee', zh: '基础设施管理费' },
    { vi: 'phí sử dụng hạ tầng', en: 'infrastructure usage fee', zh: '基础设施使用费' },
    { vi: 'bàn giao mặt bằng', en: 'site handover', zh: '场地交付' },
    { vi: 'gia hạn hợp đồng', en: 'contract renewal', zh: '合同续期' },
    { vi: 'chấm dứt hợp đồng', en: 'contract termination', zh: '合同终止' },
    { vi: 'phạt vi phạm hợp đồng', en: 'penalty for breach of contract', zh: '违约金' },
    { vi: 'quyền sử dụng đất', en: 'land use rights', zh: '土地使用权' },
    { vi: 'nhà đầu tư', en: 'investor', zh: '投资者' },
    // Giới thiệu dự án
    { vi: 'nhà xưởng xây sẵn', en: 'ready-built factory', zh: '标准厂房' },
    { vi: 'nhà xưởng', en: 'factory building', zh: '厂房' },
    { vi: 'hạ tầng kỹ thuật', en: 'technical infrastructure', zh: '技术基础设施' },
    { vi: 'xử lý nước thải', en: 'wastewater treatment', zh: '废水处理' },
    { vi: 'phòng cháy chữa cháy', en: 'fire prevention and fighting', zh: '消防' },
    { vi: 'giấy phép xây dựng', en: 'construction permit', zh: '建筑许可证' },
    // Bảo trì, bảo dưỡng
    { vi: 'bảo trì bảo dưỡng', en: 'maintenance and servicing', zh: '维护保养' },
    { vi: 'bảo trì', en: 'maintenance', zh: '维护' },
    { vi: 'bảo dưỡng', en: 'servicing', zh: '保养' },
    { vi: 'nghiệm thu', en: 'acceptance', zh: '验收' }
  ]
};
