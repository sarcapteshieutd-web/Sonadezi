/* Báo cáo phòng họp và toàn văn sau họp: hàm thuần, không phụ thuộc trình duyệt (kiểm thử bằng node --test) */
(function (root) {
  'use strict';
  const pad = n => String(n).padStart(2, '0');

  // viewers: [{uid, lang}], messages: [{src, out, from, to, ts, by?, tr?}]
  function buildReport({ viewers = [], messages = [] }) {
    const stamps = messages.map(m => m.ts).filter(t => typeof t === 'number');
    const byLang = new Map();
    for (const v of viewers) byLang.set(v.lang, (byLang.get(v.lang) || 0) + 1);
    const viewerLangs = [...byLang.entries()].sort((a, b) => b[1] - a[1])
      .map(([lang, count]) => ({ lang, count, pct: viewers.length ? Math.round(count * 100 / viewers.length) : 0 }));
    const spoken = new Map();
    for (const m of messages) spoken.set(m.from, (spoken.get(m.from) || 0) + 1);
    const co = messages.filter(m => m.by === 'co').length;
    return {
      sentences: messages.length,
      sentencesHost: messages.length - co,
      sentencesCo: co,
      viewers: viewers.length,
      durationMs: stamps.length > 1 ? Math.max(...stamps) - Math.min(...stamps) : 0,
      viewerLangs,
      languageCount: viewerLangs.length,
      spokenLangs: [...spoken.entries()].sort((a, b) => b[1] - a[1]).map(([lang, count]) => ({ lang, count }))
    };
  }

  function fmtDuration(ms) {
    const s = Math.round(ms / 1000);
    if (s < 60) return s + ' giây';
    const m = Math.floor(s / 60);
    if (m < 60) return m + ' phút';
    return Math.floor(m / 60) + ' giờ ' + pad(m % 60) + ' phút';
  }

  // Ô CSV: bọc nháy kép khi cần; ô bắt đầu bằng = + - @ bị Excel hiểu là công thức nên thêm dấu nháy đơn phía trước
  function cell(v) {
    let s = String(v == null ? '' : v);
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function toCsv(r, nameOf, { title = '', ts = Date.now() } = {}) {
    const d = new Date(ts);
    const rows = [
      ['Báo cáo phòng họp', title],
      ['Ngày', pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear()],
      ['Lượt người xem', r.viewers],
      ['Số câu', r.sentences],
      ['Số câu máy chủ phòng', r.sentencesHost],
      ['Số câu máy thứ hai', r.sentencesCo],
      ['Thời lượng', fmtDuration(r.durationMs)],
      ['Số ngôn ngữ người xem chọn', r.languageCount],
      [],
      ['Ngôn ngữ người xem', 'Số lượt', 'Tỷ lệ'],
      ...r.viewerLangs.map(x => [nameOf(x.lang), x.count, x.pct + '%']),
      [],
      ['Ngôn ngữ người nói', 'Số câu'],
      ...r.spokenLangs.map(x => [nameOf(x.lang), x.count]),
      [],
      ['Lưu ý', 'Lượt người xem là số phiên ẩn danh đã vào phòng; một người mở lại trình duyệt có thể được tính thêm.']
    ];
    return '﻿' + rows.map(row => row.map(cell).join(',')).join('\r\n') + '\r\n';
  }

  // Nội dung của một tin theo ngôn ngữ người xem
  function pickText(m, lang) {
    if (lang === m.from) return m.src;
    if (lang === m.to) return m.out;
    if (m.tr && m.tr[lang]) return m.tr[lang];
    return m.out;
  }
  function toTranscript(messages, lang, { title = '', fmtTime = ts => { const d = new Date(ts); return pad(d.getHours()) + ':' + pad(d.getMinutes()); } } = {}) {
    const lines = [title, ''];
    for (const m of messages) lines.push('[' + fmtTime(m.ts) + '] ' + pickText(m, lang));
    return lines.join('\n') + '\n';
  }

  const api = { buildReport, fmtDuration, toCsv, pickText, toTranscript };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.RoomReport = api;
})(typeof window !== 'undefined' ? window : globalThis);
