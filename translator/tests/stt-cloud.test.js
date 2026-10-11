'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../stt-cloud.js');

const R = S.SAMPLE_RATE;
const tone = (sec, amp = 0.3) => Float32Array.from({ length: Math.round(sec * R) }, (_, i) => Math.sin(2 * Math.PI * 440 * i / R) * amp);
const speechy = sec => { // giả lập tiếng nói liên tục: 0,3 s to rồi 0,15 s nhỏ, lặp lại
  const out = []; let t = 0;
  while (t < sec) { out.push(tone(Math.min(0.3, sec - t), 0.3)); t += 0.3; if (t < sec) { out.push(tone(Math.min(0.15, sec - t), 0.03)); t += 0.15; } }
  return cat(...out);
};
let seed = 12345;
const hiss = (sec, amp) => Float32Array.from({ length: Math.round(sec * R) }, () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return ((seed / 0x7fffffff) * 2 - 1) * amp; });
const quiet = sec => new Float32Array(Math.round(sec * R));
const cat = (...parts) => { const o = new Float32Array(parts.reduce((n, p) => n + p.length, 0)); let k = 0; for (const p of parts) { o.set(p, k); k += p.length; } return o; };
function run(signal, seg = S.createSegmenter(), flush = false) {
  const out = [];
  for (let i = 0; i < signal.length; i += 320) out.push(...seg.push(signal.subarray(i, i + 320)));
  if (flush) out.push(...seg.flush());
  return out;
}

test('pairFromLangs: bốn cặp có tiếng Việt', () => {
  assert.deepEqual(S.pairFromLangs('en', 'vi'), { foreign: 'en', primary: 'en-US', alt: 'vi-VN' });
  assert.equal(S.pairFromLangs('vi', 'ja').primary, 'ja-JP');
  assert.equal(S.pairFromLangs('ko', 'vi').primary, 'ko-KR');
  assert.equal(S.pairFromLangs('vi', 'zh').primary, 'zh-CN');
});
test('pairFromLangs: cặp không chứa tiếng Việt hoặc ngoài bốn cặp trả null', () => {
  assert.equal(S.pairFromLangs('en', 'zh'), null);
  assert.equal(S.pairFromLangs('zht', 'vi'), null);
  assert.equal(S.pairFromLangs('vi', 'vi'), null);
});
test('langFromCode ánh xạ mã Google về khóa ngôn ngữ của ứng dụng', () => {
  const ja = S.pairFromLangs('vi', 'ja'), zh = S.pairFromLangs('vi', 'zh');
  assert.equal(S.langFromCode('vi-vn', ja), 'vi');
  assert.equal(S.langFromCode('ja-jp', ja), 'ja');
  assert.equal(S.langFromCode('cmn-hans-cn', zh), 'zh');
  assert.equal(S.langFromCode('en-us', ja), null);
  assert.equal(S.langFromCode('', ja), null);
});
test('billedSeconds làm tròn lên, tối thiểu 1 giây', () => {
  assert.equal(S.billedSeconds(1), 1);
  assert.equal(S.billedSeconds(16000), 1);
  assert.equal(S.billedSeconds(16001), 2);
  assert.equal(S.billedSeconds(0), 1);
});
test('downsampleTo16k từ 48 kHz còn một phần ba độ dài', () => {
  assert.equal(S.downsampleTo16k(new Float32Array(4800), 48000).length, 1600);
  const same = new Float32Array([0.1, 0.2]);
  assert.deepEqual(Array.from(S.downsampleTo16k(same, 16000)), Array.from(same));
});
test('floatToPcm16 kẹp giá trị ngoài [-1, 1]', () => {
  assert.deepEqual(Array.from(S.floatToPcm16(Float32Array.from([2, -2, 0]))), [32767, -32768, 0]);
});
test('pcm16ToBase64 mã hóa little-endian', () => {
  assert.equal(S.pcm16ToBase64(Int16Array.from([1, 256])), Buffer.from([1, 0, 0, 1]).toString('base64'));
});

test('segmenter: hai giây im lặng không tạo đoạn nào', () => {
  assert.equal(run(quiet(2), undefined, true).length, 0);
});
test('segmenter: một câu rồi im lặng tạo đúng một đoạn', () => {
  const segs = run(cat(tone(1), quiet(1)));
  assert.equal(segs.length, 1);
  assert.ok(segs[0].length >= R, 'đoạn dài ít nhất 1 giây');
  assert.ok(segs[0].length <= R * 1.8, 'không kéo theo quá nhiều im lặng');
});
test('segmenter: hai câu cách nhau 1 giây im lặng tạo hai đoạn', () => {
  assert.equal(run(cat(tone(1), quiet(1), tone(1), quiet(1))).length, 2);
});
test('segmenter: tiếng nói liên tục 60 giây bị ép cắt, không đoạn nào quá 25 giây', () => {
  const segs = run(cat(speechy(60), quiet(1)));
  assert.ok(segs.length >= 2);
  for (const s of segs) assert.ok(s.length <= 25 * R + 320, 'đoạn quá 25 giây');
});
test('segmenter: tiếng ngắn 0,2 giây bị bỏ', () => {
  assert.equal(run(cat(tone(0.2), quiet(2)), undefined, true).length, 0);
});
test('segmenter: flush trả đoạn đang dở nếu đủ 0,4 giây', () => {
  assert.equal(run(tone(0.5), undefined, true).length, 1);
  assert.equal(run(tone(0.2), undefined, true).length, 0);
});

test('segmenter: ồn nền đều tăng đột ngột (quạt, điều hòa) không bị coi là tiếng nói', () => {
  const segs = run(cat(hiss(10, 0.007), hiss(120, 0.035)));
  assert.equal(segs.length, 0);
});
test('segmenter: tiếng nói vẫn nhận được sau khi ồn nền đều đã bị học', () => {
  const segs = run(cat(hiss(10, 0.007), hiss(40, 0.035), speechy(2), hiss(3, 0.035)));
  assert.ok(segs.length >= 1, 'câu nói sau tiếng ồn phải được cắt thành đoạn');
});

test('quotaDecision: không giới hạn thì luôn cho phép', () => {
  assert.deepEqual(S.quotaDecision({ usedSec: 0, addSec: 10, limitMin: 0, mode: 'fallback' }), { allow: true, warn: false, over: false });
});
test('quotaDecision: cảnh báo từ 80%', () => {
  const d = S.quotaDecision({ usedSec: 480, addSec: 10, limitMin: 10, mode: 'fallback' });
  assert.deepEqual(d, { allow: true, warn: true, over: false });
});
test('quotaDecision: vượt hạn mức chặn ở fallback, cho qua ở continue', () => {
  assert.deepEqual(S.quotaDecision({ usedSec: 595, addSec: 10, limitMin: 10, mode: 'fallback' }), { allow: false, warn: false, over: true });
  assert.deepEqual(S.quotaDecision({ usedSec: 595, addSec: 10, limitMin: 10, mode: 'continue' }), { allow: true, warn: false, over: true });
});
