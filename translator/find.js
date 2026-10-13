/* Tìm kiếm trong hội thoại: đọc chữ từ khung chat (#history), không sửa nội dung từng tin.
   - Không phân biệt hoa/thường và dấu tiếng Việt (gõ "gia thue" khớp "Giá thuê")
   - Tô sáng bằng CSS Custom Highlight API; trình duyệt cũ vẫn tìm, đếm, cuộn và viền tin hiện tại
   - Tin mới đến khi đang tìm được cập nhật vào kết quả */
(function () {
  'use strict';
  var bar = document.getElementById('findBar');
  var btn = document.getElementById('btnFind');
  var input = document.getElementById('findInput');
  var countEl = document.getElementById('findCount');
  var hist = document.getElementById('history');
  var wrap = document.getElementById('histWrap');
  if (!bar || !btn || !input || !hist || !wrap) return;

  var hasHL = !!(window.CSS && CSS.highlights && window.Highlight);
  var matches = [];   // [{ range, node }] theo thứ tự xuất hiện trong hội thoại
  var cur = -1;
  var curBubble = null;

  // Bỏ dấu, đổi về chữ thường; giữ bảng ánh xạ vị trí về chuỗi gốc
  function fold(text) {
    var out = '', map = [];
    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i);
      var n = (ch === 'đ' || ch === 'Đ') ? 'd' : ch.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
      for (var k = 0; k < n.length; k++) { out += n.charAt(k); map.push(i); }
    }
    return { out: out, map: map };
  }

  function collect(q) {
    var res = [];
    var blocks = hist.querySelectorAll('.whitespace-pre-wrap');
    for (var b = 0; b < blocks.length; b++) {
      var w = document.createTreeWalker(blocks[b], NodeFilter.SHOW_TEXT);
      var node;
      while ((node = w.nextNode())) {
        var f = fold(node.nodeValue);
        var from = 0, idx;
        while ((idx = f.out.indexOf(q, from)) !== -1) {
          var r = document.createRange();
          r.setStart(node, f.map[idx]);
          r.setEnd(node, f.map[idx + q.length - 1] + 1);
          res.push({ range: r, node: node });
          from = idx + q.length;
        }
      }
    }
    return res;
  }

  function clearMarks() {
    if (hasHL) { CSS.highlights.delete('chat-find'); CSS.highlights.delete('chat-find-cur'); }
    if (curBubble) { curBubble.classList.remove('find-cur'); curBubble = null; }
  }

  function paint() {
    clearMarks();
    if (!matches.length) return;
    if (hasHL) {
      CSS.highlights.set('chat-find', new Highlight(...matches.map(function (m) { return m.range; })));
      if (cur >= 0) CSS.highlights.set('chat-find-cur', new Highlight(matches[cur].range));
    }
    if (cur >= 0) {
      var el = matches[cur].node.parentElement;
      curBubble = el && el.closest('#history > div > div');
      if (curBubble) curBubble.classList.add('find-cur');
    }
  }

  function label() {
    var q = fold(input.value.trim()).out;
    if (!q) countEl.textContent = '';
    else if (!matches.length) countEl.textContent = 'Không tìm thấy';
    else countEl.textContent = (cur + 1) + '/' + matches.length;
  }

  function reveal() {
    if (cur < 0 || !matches[cur]) return;
    var el = matches[cur].node.parentElement;
    if (!el) return;
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
  }

  // run(scroll): tính lại kết quả; giữ vị trí hiện tại nếu còn hợp lệ, mặc định bắt đầu từ tin mới nhất
  function run(scroll, keep) {
    var q = fold(input.value.trim()).out;
    var prev = cur;
    matches = q ? collect(q) : [];
    if (!matches.length) cur = -1;
    else if (keep && prev >= 0) cur = Math.min(prev, matches.length - 1);
    else cur = matches.length - 1;
    paint(); label();
    if (scroll) reveal();
  }

  function step(d) {
    if (!matches.length) return;
    cur = (cur + d + matches.length) % matches.length;
    paint(); label(); reveal();
  }

  function open() {
    bar.hidden = false;
    btn.setAttribute('aria-pressed', 'true');
    btn.classList.add('bg-brand-600', 'text-white'); btn.classList.remove('bg-white', 'text-slate-500');
    input.focus();
    if (input.value) run(true, false);
  }
  function close() {
    bar.hidden = true;
    btn.setAttribute('aria-pressed', 'false');
    btn.classList.remove('bg-brand-600', 'text-white'); btn.classList.add('bg-white', 'text-slate-500');
    clearMarks(); matches = []; cur = -1; countEl.textContent = '';
    btn.focus();
  }

  btn.addEventListener('click', function () { if (bar.hidden) open(); else close(); });
  document.getElementById('findClose').addEventListener('click', close);
  document.getElementById('findPrev').addEventListener('click', function () { step(-1); });
  document.getElementById('findNext').addEventListener('click', function () { step(1); });
  input.addEventListener('input', function () { run(true, false); });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'Enter') { e.preventDefault(); step(e.shiftKey ? -1 : 1); }
  });

  // tin mới đến / vẽ lại khung chat khi đang tìm: cập nhật kết quả, không tự cuộn
  var t = 0;
  new MutationObserver(function () {
    if (bar.hidden) return;
    clearTimeout(t);
    t = setTimeout(function () { run(false, true); }, 200);
  }).observe(hist, { childList: true, characterData: true, subtree: true });
})();
