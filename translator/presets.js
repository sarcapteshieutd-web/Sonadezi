/* Kịch bản họp: mỗi kịch bản là một bộ tùy chọn cấu hình sẵn cho chế độ Họp. Hàm thuần, kiểm thử bằng node --test. */
(function (root) {
  'use strict';
  // conf: nghe bằng tai nghe; viMain: tiếng Việt chỉ ghi lại; speak: đọc bản dịch ra loa; bilingual: tự nhận hai ngôn ngữ (nếu tài khoản dùng được)
  const MEETING_PRESETS = {
    guest: { label: 'Tiếp khách', conf: false, viMain: false, speak: true, bilingual: true, desc: 'Dịch hai chiều và đọc bản dịch ra loa.' },
    record: { label: 'Ghi cuộc họp', conf: false, viMain: true, speak: false, bilingual: true, desc: 'Thu liên tục: tiếng Việt chỉ ghi lại, ngoại ngữ được dịch, không đọc ra loa.' },
    ear: { label: 'Tai nghe', conf: true, viMain: false, speak: true, bilingual: false, desc: 'Nghe bản dịch bằng tai nghe, micro không tắt khi đọc.' }
  };
  // Kịch bản đang khớp với các tùy chọn hiện tại ('' = tùy chỉnh riêng)
  function presetOf(s) {
    if (!s) return '';
    if (s.conf) return 'ear';
    if (s.viMain) return 'record';
    return s.meetingSpeak ? 'guest' : '';
  }
  const api = { MEETING_PRESETS, presetOf };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.MeetingPresets = api;
})(typeof window !== 'undefined' ? window : globalThis);
