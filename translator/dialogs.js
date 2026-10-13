/* Tiếp cận cho các cửa sổ phụ (Cài đặt, Phòng họp, Biên bản, Lưu chat, Ủng hộ, Quản trị).
   Chỉ thêm lớp hành vi bên ngoài app.js, không đổi logic mở/đóng sẵn có:
   - khai báo role="dialog", aria-modal, aria-labelledby
   - chuyển focus vào cửa sổ khi mở, giữ vòng Tab bên trong, trả focus về nút đã mở khi đóng
   - phím Esc đóng cửa sổ trên cùng
   - vô hiệu hóa nền phía sau (inert) khi có cửa sổ mở
   - Cài đặt: báo "Có thay đổi chưa lưu" */
(function () {
  'use strict';
  var sheets = Array.prototype.slice.call(document.querySelectorAll('#sheet, [data-modal]'));
  if (!sheets.length) return;
  var app = document.getElementById('app');
  var stack = [];              // cửa sổ đang mở, theo thứ tự mở
  var openers = new Map();     // cửa sổ -> nút đã mở nó
  var lastTrigger = null;
  var FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex]:not([tabindex="-1"])';

  function isOpen(s) { return !s.classList.contains('hidden'); }
  function card(s) { return s.firstElementChild; }
  function visible(e) { return !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length); }
  function focusables(c) {
    return Array.prototype.filter.call(c.querySelectorAll(FOCUSABLE), function (e) { return visible(e) && !e.closest('[inert]'); });
  }

  sheets.forEach(function (s) {
    var c = card(s);
    if (!c) return;
    c.setAttribute('role', 'dialog');
    c.setAttribute('aria-modal', 'true');
    c.setAttribute('tabindex', '-1');
    var h = c.querySelector('h2');
    if (h) { if (!h.id) h.id = s.id + 'Title'; c.setAttribute('aria-labelledby', h.id); }
  });

  document.addEventListener('click', function (e) {
    lastTrigger = e.target && e.target.closest ? e.target.closest('button,a,summary') : null;
  }, true);

  var settings = document.getElementById('sheet');
  var dirtyNote = document.getElementById('dirtyNote');
  function setDirty(v) { if (dirtyNote) dirtyNote.classList.toggle('hidden', !v); }

  function refresh() {
    var opened = [], closed = [], i;
    sheets.forEach(function (s) { if (isOpen(s) && stack.indexOf(s) < 0) opened.push(s); });
    for (i = stack.length - 1; i >= 0; i--) if (!isOpen(stack[i])) closed.push(stack.splice(i, 1)[0]);
    opened.forEach(function (s) {
      stack.push(s);
      var t = lastTrigger && lastTrigger.isConnected && visible(lastTrigger) ? lastTrigger : document.activeElement;
      openers.set(s, t);
      if (s === settings) setDirty(false);
    });
    var top = stack[stack.length - 1];
    if (app) app.inert = stack.length > 0;
    sheets.forEach(function (s) { s.inert = stack.length > 0 && s !== top; });
    document.body.classList.toggle('dlg-open', stack.length > 0);
    closed.forEach(function (s) {
      var o = openers.get(s); openers.delete(s);
      if (o && o.isConnected && visible(o) && !o.closest('[inert]')) { try { o.focus({ preventScroll: true }); } catch (_) {} }
    });
    opened.forEach(function (s) {
      setTimeout(function () { if (isOpen(s) && card(s)) card(s).focus({ preventScroll: true }); }, 0);
    });
  }

  var mo = new MutationObserver(refresh);
  sheets.forEach(function (s) { mo.observe(s, { attributes: true, attributeFilter: ['class'] }); });

  document.addEventListener('keydown', function (e) {
    var top = stack[stack.length - 1];
    if (!top) return;
    if (e.key === 'Escape') {
      e.preventDefault(); e.stopPropagation();
      var btn = top.querySelector('[data-close], #btnSheetClose');
      if (btn) btn.click(); else top.click();
      return;
    }
    if (e.key !== 'Tab') return;
    var c = card(top), f = focusables(c), a = document.activeElement;
    if (!f.length) { e.preventDefault(); c.focus(); return; }
    var first = f[0], last = f[f.length - 1];
    if (!c.contains(a) || a === c) { e.preventDefault(); (e.shiftKey ? last : first).focus(); }
    else if (e.shiftKey && a === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && a === last) { e.preventDefault(); first.focus(); }
  }, true);

  if (settings) {
    settings.addEventListener('input', function () { setDirty(true); });
    settings.addEventListener('change', function () { setDirty(true); });
    var save = document.getElementById('btnSave');
    if (save) save.addEventListener('click', function () { setDirty(false); });
  }
})();
