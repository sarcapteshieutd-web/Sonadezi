/* Màn hình chiếu phụ đề: dựng danh sách dòng hiển thị. Hàm thuần, không phụ thuộc trình duyệt (kiểm thử bằng node --test) */
(function (root) {
  'use strict';
  const clean = x => String(x == null ? '' : x).replace(/\s+/g, ' ').trim();
  const FAILED = /^\[Chưa dịch được\]$/;

  // Chữ hiển thị của một lượt: ưu tiên bản dịch; chưa dịch được hoặc không có bản dịch (ghi biên bản) thì dùng chữ gốc
  function lineOf(item) {
    if (!item) return '';
    const out = clean(item.out), src = clean(item.src);
    return out && !FAILED.test(out) ? out : src;
  }
  // items: các lượt đã chốt (cũ -> mới); live: { text, lang } của câu đang nói (có thể rỗng)
  // Trả về { lines: string[] (tối đa maxLines dòng cuối), live: { text, label } | null }
  function buildCaption(items, live, opts) {
    const o = opts || {};
    const max = Number.isFinite(o.maxLines) && o.maxLines >= 1 ? Math.floor(o.maxLines) : 12;
    const lines = (Array.isArray(items) ? items : []).map(lineOf).filter(Boolean).slice(-max);
    const text = clean(live && live.text);
    const lang = clean(live && live.lang).toLowerCase();
    const liveOut = text ? { text, label: /^[a-z]{2,3}$/.test(lang) ? '(' + lang + ')' : '' } : null;
    return { lines, live: liveOut };
  }
  // Cỡ chữ: giới hạn trong khoảng cho phép, giá trị lạ thì về 1
  function clampScale(v) {
    const n = Number(v);
    if (!Number.isFinite(n)) return 1;
    return Math.min(2, Math.max(0.6, Math.round(n * 10) / 10));
  }

  const api = { lineOf, buildCaption, clampScale };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.Captions = api;
})(typeof window !== 'undefined' ? window : globalThis);
