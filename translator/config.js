/* Cấu hình ủng hộ / gói sử dụng. Chỉ cần sửa tệp này, không cần sửa mã ứng dụng.
   Để trống mục nào thì mục đó không hiển thị.
   Lưu ý: ứng dụng chạy hoàn toàn trên trình duyệt (không có máy chủ) nên các nút
   chỉ MỞ trang thanh toán của bạn; ứng dụng không thể tự xác nhận thanh toán hay khóa/mở gói. */
window.APP_CONFIG = {
  donate: {
    title: 'Ủng hộ nhà phát hành',
    message: 'Cảm ơn bạn đã sử dụng ứng dụng. Mọi đóng góp giúp chúng tôi duy trì và phát triển thêm tính năng.',
    // Ảnh mã QR chuyển khoản (ví dụ VietQR), đặt tệp trong thư mục translator/ rồi ghi đường dẫn, ví dụ 'donate-qr.png'
    qrImage: '',
    // Thông tin tài khoản nhận (hiển thị dạng chữ, có nút sao chép)
    bank: { bankName: '', accountNumber: '', accountName: '', note: '' },
    // Liên kết thanh toán trực tuyến (PayPal.me, Buy Me a Coffee, liên kết thanh toán PayOS/Stripe, v.v.). Chỉ chấp nhận https://
    links: [
      // { label: 'Ủng hộ qua PayPal', url: 'https://paypal.me/...' }
    ]
  },
  // Gói sử dụng hiển thị cho người dùng chọn mua; url là trang thanh toán của từng gói
  plans: [
    // { name: 'Gói tháng', price: '99.000đ / tháng', description: 'Dịch không giới hạn', url: 'https://...' }
  ]
};
