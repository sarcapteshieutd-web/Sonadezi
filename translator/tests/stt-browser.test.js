const test = require('node:test');
const assert = require('node:assert/strict');
const { shouldDropFinal } = require('../stt-browser.js');

test('giữ câu ngắn có điểm thấp khi tắt lọc', () => {
  assert.equal(shouldDropFinal('Vâng', 0.01, 0, true), false);
  assert.equal(shouldDropFinal('はい', 0.01, 0, false), false);
});

test('giữ câu khi không có điểm hoặc đạt ngưỡng', () => {
  assert.equal(shouldDropFinal('Vâng', 0, 0.3, true), false);
  assert.equal(shouldDropFinal('Vâng', undefined, 0.3, true), false);
  assert.equal(shouldDropFinal('Vâng', 0.3, 0.3, true), false);
});

test('chỉ lọc câu điểm thấp dưới ba từ với ngôn ngữ có dấu cách', () => {
  assert.equal(shouldDropFinal('Vâng', 0.1, 0.3, true), true);
  assert.equal(shouldDropFinal('Dạ vâng', 0.1, 0.3, true), true);
  assert.equal(shouldDropFinal('Tôi  đồng\tý', 0.1, 0.3, true), false);
  assert.equal(shouldDropFinal('안녕 하세요', 0.1, 0.3, true), true);
});

test('đếm ký tự ngoài khoảng trắng với ngôn ngữ viết liền', () => {
  assert.equal(shouldDropFinal('好 吗？', 0.1, 0.3, false), true);
  assert.equal(shouldDropFinal('おはよう', 0.1, 0.3, false), false);
  assert.equal(shouldDropFinal('𠮷野家', 0.1, 0.3, false), true);
});

test('bỏ văn bản rỗng, toàn khoảng trắng hoặc sai kiểu', () => {
  for (const text of ['', ' \t\n　', null]) {
    assert.equal(shouldDropFinal(text, 0, 0, true), true);
  }
});
