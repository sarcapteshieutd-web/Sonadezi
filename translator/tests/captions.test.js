const test = require('node:test');
const assert = require('node:assert');
const { lineOf, buildCaption, clampScale } = require('../captions.js');

test('lineOf: ưu tiên bản dịch, thiếu hoặc lỗi thì dùng chữ gốc', () => {
  assert.strictEqual(lineOf({ src: 'Xin chào', out: 'Hello' }), 'Hello');
  assert.strictEqual(lineOf({ src: 'Xin chào', out: '' }), 'Xin chào');
  assert.strictEqual(lineOf({ src: 'Xin chào', out: '[Chưa dịch được]' }), 'Xin chào');
  assert.strictEqual(lineOf(null), '');
  assert.strictEqual(lineOf({ src: '  nhiều   khoảng\ntrắng ', out: '' }), 'nhiều khoảng trắng');
});
test('buildCaption: giữ đúng thứ tự cũ -> mới và tối đa maxLines dòng cuối', () => {
  const items = [1, 2, 3, 4, 5].map(n => ({ src: 's' + n, out: 'o' + n }));
  assert.deepStrictEqual(buildCaption(items, null, { maxLines: 3 }).lines, ['o3', 'o4', 'o5']);
  assert.strictEqual(buildCaption(items, null, {}).lines.length, 5);
});
test('buildCaption: bỏ lượt rỗng, không tạo dòng trống', () => {
  const r = buildCaption([{ src: '', out: '' }, { src: '   ', out: ' ' }, { src: 'a', out: 'b' }], null);
  assert.deepStrictEqual(r.lines, ['b']);
});
test('buildCaption: dòng đang nói có nhãn ngôn ngữ', () => {
  assert.deepStrictEqual(buildCaption([], { text: 'Đồng Nai thì', lang: 'vi' }).live, { text: 'Đồng Nai thì', label: '(vi)' });
  assert.deepStrictEqual(buildCaption([], { text: 'hello', lang: 'EN' }).live, { text: 'hello', label: '(en)' });
});
test('buildCaption: dòng đang nói rỗng thì không có; mã ngôn ngữ lạ thì nhãn rỗng', () => {
  assert.strictEqual(buildCaption([], { text: '   ', lang: 'vi' }).live, null);
  assert.strictEqual(buildCaption([], null).live, null);
  assert.deepStrictEqual(buildCaption([], { text: 'x', lang: '<b>' }).live, { text: 'x', label: '' });
});
test('buildCaption: đầu vào lạ không gây lỗi', () => {
  assert.deepStrictEqual(buildCaption(null, undefined, null), { lines: [], live: null });
  assert.strictEqual(buildCaption([{ src: 'a' }], null, { maxLines: 0 }).lines.length, 1);
  assert.strictEqual(buildCaption([{ src: 'a' }], null, { maxLines: NaN }).lines.length, 1);
  const long = 'x'.repeat(20000);
  assert.strictEqual(buildCaption([{ src: long, out: '' }], null).lines[0].length, 20000);
});
test('clampScale: giới hạn 0,6 đến 2, giá trị lạ về 1', () => {
  assert.strictEqual(clampScale(1.23), 1.2);
  assert.strictEqual(clampScale(0.1), 0.6);
  assert.strictEqual(clampScale(9), 2);
  assert.strictEqual(clampScale('abc'), 1);
  assert.strictEqual(clampScale(undefined), 1);
});
