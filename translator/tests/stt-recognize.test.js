'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../stt-cloud.js');

const KEY = 'AIza-SECRET-KEY';
const pcm = Int16Array.from([1, 2, 3, 4]);
const base = { apiKey: KEY, primary: 'ja-JP', alt: 'vi-VN' };
const okBody = { results: [{ languageCode: 'vi-vn', alternatives: [{ transcript: 'xin chào', confidence: 0.9 }] }] };
const resp = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
function fakeFetch(...steps) {
  const calls = [];
  const fn = async (url, init) => {
    calls.push({ url, init });
    const step = steps[Math.min(calls.length - 1, steps.length - 1)];
    if (step instanceof Error) throw step;
    return step;
  };
  fn.calls = calls;
  return fn;
}

test('recognize gửi đúng cấu hình và không đặt model', async () => {
  const f = fakeFetch(resp(200, okBody));
  await S.recognize(pcm, { ...base, fetchImpl: f });
  const { url, init } = f.calls[0];
  assert.ok(url.startsWith('https://speech.googleapis.com/v1/speech:recognize?key='));
  const body = JSON.parse(init.body);
  assert.deepEqual(body.config, { encoding: 'LINEAR16', sampleRateHertz: 16000, languageCode: 'ja-JP', alternativeLanguageCodes: ['vi-VN'], enableAutomaticPunctuation: true });
  assert.equal(body.audio.content, S.pcm16ToBase64(pcm));
  assert.equal('model' in body.config, false);
});
test('recognize trả văn bản, mã ngôn ngữ và độ tin cậy', async () => {
  const r = await S.recognize(pcm, { ...base, fetchImpl: fakeFetch(resp(200, okBody)) });
  assert.deepEqual(r, { text: 'xin chào', code: 'vi-vn', confidence: 0.9 });
});
test('recognize: phản hồi rỗng cho văn bản rỗng', async () => {
  const r = await S.recognize(pcm, { ...base, fetchImpl: fakeFetch(resp(200, {})) });
  assert.equal(r.text, '');
});
test('recognize: 403 báo nhắc bật Speech-to-Text và không thử lại', async () => {
  const f = fakeFetch(resp(403, {}));
  await assert.rejects(S.recognize(pcm, { ...base, fetchImpl: f }), e => e.status === 403 && /Speech-to-Text/.test(e.message));
  assert.equal(f.calls.length, 1);
});
test('recognize: 400 không thử lại', async () => {
  const f = fakeFetch(resp(400, {}));
  await assert.rejects(S.recognize(pcm, { ...base, fetchImpl: f }), e => e.status === 400);
  assert.equal(f.calls.length, 1);
});
test('recognize: lỗi mạng lần đầu, lần hai thành công thì gọi đúng 2 lần', async () => {
  const f = fakeFetch(new TypeError('fetch failed'), resp(200, okBody));
  const r = await S.recognize(pcm, { ...base, fetchImpl: f });
  assert.equal(r.text, 'xin chào');
  assert.equal(f.calls.length, 2);
});
test('recognize: 5xx hai lần thì ném lỗi sau đúng 2 lần gọi', async () => {
  const f = fakeFetch(resp(503, {}), resp(503, {}));
  await assert.rejects(S.recognize(pcm, { ...base, fetchImpl: f }), e => e.status === 503);
  assert.equal(f.calls.length, 2);
});
test('recognize: thông điệp lỗi không chứa khóa API', async () => {
  const f = fakeFetch(new TypeError('fetch failed https://x?key=' + KEY), new TypeError('fetch failed'));
  await assert.rejects(S.recognize(pcm, { ...base, fetchImpl: f }), e => e.status === 0 && !e.message.includes(KEY));
});
test('recognize: nối nhiều kết quả, tiếng Nhật không chèn dấu cách', async () => {
  const body = { results: [{ languageCode: 'ja-jp', alternatives: [{ transcript: 'こんにちは' }] }, { alternatives: [{ transcript: '世界' }] }] };
  const r = await S.recognize(pcm, { ...base, fetchImpl: fakeFetch(resp(200, body)) });
  assert.equal(r.text, 'こんにちは世界');
  assert.equal(r.confidence, 0);
});
