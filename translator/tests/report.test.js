'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const R = require('../report.js');

const names = { en: 'Tiếng Anh', vi: 'Tiếng Việt', zh: 'Tiếng Trung' };
const nameOf = l => names[l] || l;
const t0 = Date.UTC(2026, 9, 12, 8, 0, 0);
const msgs = [
  { id: 'a', src: 'Hello everyone', out: 'Xin chào mọi người', from: 'en', to: 'vi', ts: t0, tr: { zh: '大家好' } },
  { id: 'b', src: 'Giá thuê bao nhiêu?', out: 'How much is the rent?', from: 'vi', to: 'en', ts: t0 + 60000, by: 'co' },
  { id: 'c', src: 'Twenty dollars.', out: 'Hai mươi đô la.', from: 'en', to: 'vi', ts: t0 + 3720000 }
];
const viewers = [{ uid: 'u1', lang: 'en', ts: t0 }, { uid: 'u2', lang: 'en', ts: t0 }, { uid: 'u3', lang: 'zh', ts: t0 }];

test('buildReport: đếm câu, lượt xem, ngôn ngữ và thời lượng', () => {
  const r = R.buildReport({ viewers, messages: msgs });
  assert.equal(r.sentences, 3);
  assert.equal(r.sentencesHost, 2);
  assert.equal(r.sentencesCo, 1);
  assert.equal(r.viewers, 3);
  assert.equal(r.durationMs, 3720000);
  assert.deepEqual(r.viewerLangs, [{ lang: 'en', count: 2, pct: 67 }, { lang: 'zh', count: 1, pct: 33 }]);
  assert.equal(r.languageCount, 2);
  assert.deepEqual(r.spokenLangs, [{ lang: 'en', count: 2 }, { lang: 'vi', count: 1 }]);
});

test('buildReport: phòng trống không lỗi', () => {
  const r = R.buildReport({ viewers: [], messages: [] });
  assert.equal(r.sentences, 0); assert.equal(r.viewers, 0); assert.equal(r.durationMs, 0);
  assert.deepEqual(r.viewerLangs, []);
});

test('buildReport: một câu duy nhất có thời lượng 0, tin thiếu ts bị bỏ qua khi tính thời lượng', () => {
  const r = R.buildReport({ viewers: [], messages: [{ src: 'x', out: 'y', from: 'en', to: 'vi', ts: t0 }, { src: 'z', out: 'w', from: 'en', to: 'vi' }] });
  assert.equal(r.durationMs, 0); assert.equal(r.sentences, 2);
});

test('fmtDuration', () => {
  assert.equal(R.fmtDuration(0), '0 giây');
  assert.equal(R.fmtDuration(45000), '45 giây');
  assert.equal(R.fmtDuration(300000), '5 phút');
  assert.equal(R.fmtDuration(3720000), '1 giờ 02 phút');
  assert.equal(R.fmtDuration(7200000), '2 giờ 00 phút');
});

test('toCsv: có BOM, tiêu đề, ngôn ngữ người xem; ô có dấu phẩy hoặc nháy kép được bọc đúng', () => {
  const r = R.buildReport({ viewers, messages: msgs });
  const csv = R.toCsv(r, nameOf, { title: 'Họp "A", B', ts: t0 });
  assert.equal(csv.charCodeAt(0), 0xFEFF);
  assert.match(csv, /"Họp ""A"", B"/);
  assert.match(csv, /Lượt người xem,3/);
  assert.match(csv, /Số câu,3/);
  assert.match(csv, /Tiếng Anh,2,67%/);
  assert.match(csv, /Tiếng Trung,1,33%/);
  assert.match(csv, /Thời lượng,1 giờ 02 phút/);
});

test('toCsv: chống chèn công thức (ô bắt đầu bằng = + - @)', () => {
  const r = R.buildReport({ viewers: [], messages: [] });
  const csv = R.toCsv(r, l => '=HYPERLINK("x")', { title: '+cmd', ts: t0 });
  assert.doesNotMatch(csv, /(^|,|\n)=HYPERLINK/);
  assert.doesNotMatch(csv, /(^|,|\n)\+cmd/);
});

test('pickText: ngôn ngữ nguồn, đích, bản dịch phụ và dự phòng', () => {
  assert.equal(R.pickText(msgs[0], 'en'), 'Hello everyone');
  assert.equal(R.pickText(msgs[0], 'vi'), 'Xin chào mọi người');
  assert.equal(R.pickText(msgs[0], 'zh'), '大家好');
  assert.equal(R.pickText(msgs[1], 'zh'), 'How much is the rent?'); // chưa có bản dịch zh: dùng bản dịch của chủ phòng
});

test('toTranscript: mỗi câu một dòng kèm giờ, theo ngôn ngữ người xem', () => {
  const txt = R.toTranscript(msgs, 'en', { title: 'Họp', fmtTime: ts => '08:00' });
  const lines = txt.trim().split('\n');
  assert.equal(lines[0], 'Họp');
  assert.ok(lines.includes('[08:00] Hello everyone'));
  assert.ok(lines.includes('[08:00] How much is the rent?'));
  assert.ok(lines.includes('[08:00] Twenty dollars.'));
});
