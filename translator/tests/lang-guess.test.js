const test = require('node:test');
const assert = require('node:assert');
const { guessLang, matches, shouldSwap, quotaLevel } = require('../lang-guess.js');

test('guessLang: nhận tiếng Việt có dấu', () => {
  assert.strictEqual(guessLang('Tôi muốn thuê nhà xưởng'), 'vi');
  assert.strictEqual(guessLang('Đơn giá thuê là bao nhiêu?'), 'vi');
});
test('guessLang: nhận tiếng Anh khi đủ từ thông dụng', () => {
  assert.strictEqual(guessLang('What is the rental rate per month?'), 'en');
  assert.strictEqual(guessLang('We would like to rent a factory'), 'en');
});
test('guessLang: chữ Latin không dấu và không đủ từ tiếng Anh thì không đoán', () => {
  assert.strictEqual(guessLang('toi muon thue nha xuong'), '');
  assert.strictEqual(guessLang('Sonadezi Long Thanh'), '');
  assert.strictEqual(guessLang('Bonjour monsieur'), '');
});
test('guessLang: chữ Hán, Nhật, Hàn, Thái, Nga', () => {
  assert.strictEqual(guessLang('我们想租一个厂房'), 'han');
  assert.strictEqual(guessLang('工場を借りたいです'), 'ja');
  assert.strictEqual(guessLang('공장을 임대하고 싶습니다'), 'ko');
  assert.strictEqual(guessLang('สวัสดีครับ'), 'th');
  assert.strictEqual(guessLang('Здравствуйте'), 'ru');
});
test('guessLang: rỗng, chỉ số và ký hiệu thì không đoán', () => {
  assert.strictEqual(guessLang(''), '');
  assert.strictEqual(guessLang(null), '');
  assert.strictEqual(guessLang('5000 m2 - 12/2026'), '');
});
test('matches: Trung giản thể, phồn thể và Nhật đều khớp chữ Hán', () => {
  assert.ok(matches('zh', 'han')); assert.ok(matches('zht', 'han')); assert.ok(matches('ja', 'han')); assert.ok(matches('ja', 'ja'));
  assert.ok(!matches('zh', 'ja')); assert.ok(!matches('en', 'vi')); assert.ok(!matches('vi', ''));
});
test('shouldSwap: gõ ngôn ngữ đích thì đảo chiều', () => {
  assert.ok(shouldSwap('Tôi muốn thuê nhà xưởng', 'en', 'vi'));
  assert.ok(shouldSwap('What is the rental rate per month?', 'vi', 'en'));
  assert.ok(shouldSwap('我们想租一个厂房', 'vi', 'zh'));
});
test('shouldSwap: gõ đúng ngôn ngữ nguồn hoặc không chắc thì giữ nguyên', () => {
  assert.ok(!shouldSwap('Tôi muốn thuê nhà xưởng', 'vi', 'en'));
  assert.ok(!shouldSwap('toi muon thue nha xuong', 'vi', 'en'));
  assert.ok(!shouldSwap('What is the price of this?', 'en', 'vi'));
  assert.ok(!shouldSwap('Bonjour monsieur', 'vi', 'fr'));
  assert.ok(!shouldSwap('我们想租厂房办公室', 'zh', 'ja')); // cả hai đều dùng chữ Hán
  assert.ok(!shouldSwap('Chào', 'en', 'vi')); // quá ngắn
});
test('quotaLevel: ngưỡng 80% và hết hạn mức', () => {
  assert.strictEqual(quotaLevel(0, 5000), 'ok');
  assert.strictEqual(quotaLevel(3999, 5000), 'ok');
  assert.strictEqual(quotaLevel(4000, 5000), 'warn');
  assert.strictEqual(quotaLevel(5000, 5000), 'over');
  assert.strictEqual(quotaLevel(9999, 0), 'ok');
});
