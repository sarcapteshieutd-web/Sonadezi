'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { MEETING_PRESETS, presetOf } = require('../presets.js');

test('presetOf: nhận đúng kịch bản từ các tùy chọn hiện tại', () => {
  assert.strictEqual(presetOf({ conf: true, viMain: true, meetingSpeak: false }), 'ear');
  assert.strictEqual(presetOf({ conf: false, viMain: true, meetingSpeak: true }), 'record');
  assert.strictEqual(presetOf({ conf: false, viMain: false, meetingSpeak: true }), 'guest');
  assert.strictEqual(presetOf({ conf: false, viMain: false, meetingSpeak: false }), '');
  assert.strictEqual(presetOf(null), '');
});
test('MEETING_PRESETS: áp dụng kịch bản nào thì presetOf trả lại đúng kịch bản đó', () => {
  for (const [k, p] of Object.entries(MEETING_PRESETS)) {
    assert.strictEqual(presetOf({ conf: p.conf, viMain: p.viMain, meetingSpeak: p.speak }), k);
    assert.ok(p.label && p.desc);
  }
});
