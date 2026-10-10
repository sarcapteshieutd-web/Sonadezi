// Kiểm thử quy tắc Firestore cho phần tài khoản VIP bằng Firebase Emulator (Node 18+).
// Chạy: trong thư mục firebase/, `npx firebase-tools emulators:start --only firestore,auth --project demo-sonadezi`,
// rồi ở cửa sổ khác: `node rules-test-vip.js`. Kết quả mong đợi: tất cả các dòng PASS.
const AUTH = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake';
const FS = 'http://127.0.0.1:8080/v1/projects/demo-sonadezi/databases/(default)/documents';
const S = v => ({ stringValue: v }), T = ms => ({ timestampValue: new Date(ms).toISOString() }), N = n => ({ integerValue: String(n) }), NUL = { nullValue: null };
const M = f => ({ mapValue: { fields: f } });

async function signUp(email) {
  const body = email ? { email, password: 'Mat-khau-dai-123', returnSecureToken: true } : { returnSecureToken: true };
  const r = await fetch(AUTH, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const j = await r.json();
  return { tok: j.idToken, uid: j.localId };
}
async function call(method, path, tok, fields, mask) {
  let url = FS + path;
  if (mask) url += (url.includes('?') ? '&' : '?') + mask.map(m => 'updateMask.fieldPaths=' + encodeURIComponent(m)).join('&');
  const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json', ...(tok ? { Authorization: 'Bearer ' + tok } : {}) }, body: fields ? JSON.stringify({ fields }) : undefined });
  return r.status;
}
let pass = 0, fail = 0;
// 'ok' = được phép (200, hoặc 404 khi tài liệu chưa có); 'deny' = bị chặn (403)
const t = (name, got, exp) => {
  const ok = exp === 'ok' ? (got === 200 || got === 404) : got === 403;
  ok ? pass++ : fail++;
  console.log((ok ? 'PASS' : 'FAIL') + ' | ' + name + ' -> ' + got + ' (mong ' + (exp === 'ok' ? '200' : '403') + ')');
};

(async () => {
  const now = Date.now(), DAY = 86400e3, run = Math.random().toString(36).slice(2, 8);
  const anon = await signUp();
  const a = await signUp(`a-${run}@test.vn`), b = await signUp(`b-${run}@test.vn`), c = await signUp(`c-${run}@test.vn`);
  const adm = await signUp(`admin-${run}@test.vn`), exp = await signUp(`exp-${run}@test.vn`);
  const profile = (email, extra = {}) => ({ email: S(email), name: S('Nguyễn Văn A'), status: S('pending'), requestedAt: N(now), ...extra });

  // Đặt sẵn quản trị viên bằng token "owner" của trình giả lập (bỏ qua quy tắc), như khi tạo tay trong Console
  await call('PATCH', '/admins/' + adm.uid, 'owner', { role: S('admin') });

  console.log('--- Đăng ký');
  t('Người ẩn danh không tạo được hồ sơ', await call('PATCH', '/users/' + anon.uid, anon.tok, profile('x@test.vn')), 'deny');
  t('Tài khoản email tạo hồ sơ của mình (chờ duyệt)', await call('PATCH', '/users/' + a.uid, a.tok, profile(`a-${run}@test.vn`)), 'ok');
  t('Tạo hồ sơ với status active bị chặn', await call('PATCH', '/users/' + b.uid, b.tok, profile(`b-${run}@test.vn`, { status: S('active') })), 'deny');
  t('Tạo hồ sơ có thêm expiresAt bị chặn', await call('PATCH', '/users/' + b.uid, b.tok, profile(`b-${run}@test.vn`, { expiresAt: T(now + 30 * DAY) })), 'deny');
  t('Tạo hồ sơ cho uid của người khác bị chặn', await call('PATCH', '/users/' + c.uid, b.tok, profile(`c-${run}@test.vn`)), 'deny');
  t('Tạo hồ sơ với email không khớp email đăng nhập bị chặn', await call('PATCH', '/users/' + b.uid, b.tok, profile('nguoi-khac@test.vn')), 'deny');
  t('Tạo hồ sơ hợp lệ cho B', await call('PATCH', '/users/' + b.uid, b.tok, profile(`b-${run}@test.vn`)), 'ok');
  t('Tạo hồ sơ cho C', await call('PATCH', '/users/' + c.uid, c.tok, profile(`c-${run}@test.vn`)), 'ok');
  t('Tạo hồ sơ cho tài khoản hết hạn', await call('PATCH', '/users/' + exp.uid, exp.tok, profile(`exp-${run}@test.vn`)), 'ok');

  console.log('--- Đọc hồ sơ');
  t('Đọc hồ sơ của mình', await call('GET', '/users/' + a.uid, a.tok), 'ok');
  t('Đọc hồ sơ người khác bị chặn', await call('GET', '/users/' + b.uid, a.tok), 'deny');
  t('Liệt kê hồ sơ (người thường) bị chặn', await call('GET', '/users', a.tok), 'deny');
  t('Không đăng nhập đọc hồ sơ bị chặn', await call('GET', '/users/' + a.uid, null), 'deny');

  console.log('--- Người dùng tự nâng quyền');
  t('Tự đổi status thành active bị chặn', await call('PATCH', '/users/' + a.uid, a.tok, { status: S('active') }, ['status']), 'deny');
  t('Tự đặt expiresAt bị chặn', await call('PATCH', '/users/' + a.uid, a.tok, { expiresAt: T(now + 365 * DAY) }, ['expiresAt']), 'deny');
  t('Tự đổi email bị chặn', await call('PATCH', '/users/' + a.uid, a.tok, { email: S('khac@test.vn') }, ['email']), 'deny');
  t('Tự báo số liệu sử dụng', await call('PATCH', '/users/' + a.uid, a.tok, { usage: M({ '2026-10': M({ tr: N(120), tts: N(80) }) }), lastSeen: N(now) }, ['usage', 'lastSeen']), 'ok');
  t('Báo sử dụng kèm đổi status bị chặn', await call('PATCH', '/users/' + a.uid, a.tok, { usage: M({}), status: S('active') }, ['usage', 'status']), 'deny');
  t('Sửa hồ sơ của người khác bị chặn', await call('PATCH', '/users/' + b.uid, a.tok, { name: S('hack') }, ['name']), 'deny');
  t('Tự tạo quyền quản trị bị chặn', await call('PATCH', '/admins/' + a.uid, a.tok, { role: S('admin') }), 'deny');
  t('Tự xóa hồ sơ bị chặn', await call('DELETE', '/users/' + a.uid, a.tok), 'deny');

  console.log('--- Khóa Google dùng chung (config/google)');
  const cfg = { key: S('AIzaFAKE'), trLimit: N(500000), ttsLimit: N(4000000), updatedAt: N(now) };
  t('Người chờ duyệt không đọc được khóa', await call('GET', '/config/google', a.tok), 'deny');
  t('Không đăng nhập không đọc được khóa', await call('GET', '/config/google', null), 'deny');
  t('Người thường không ghi được khóa', await call('PATCH', '/config/google', a.tok, cfg), 'deny');
  t('Liệt kê config bị chặn', await call('GET', '/config', a.tok), 'deny');

  console.log('--- Quản trị viên');
  t('Quản trị viên đọc được quyền của mình', await call('GET', '/admins/' + adm.uid, adm.tok), 'ok');
  t('Người khác đọc admins của quản trị viên bị chặn', await call('GET', '/admins/' + adm.uid, a.tok), 'deny');
  t('Quản trị viên liệt kê hồ sơ', await call('GET', '/users', adm.tok), 'ok');
  t('Quản trị viên đọc hồ sơ bất kỳ', await call('GET', '/users/' + a.uid, adm.tok), 'ok');
  t('Quản trị viên lưu khóa Google', await call('PATCH', '/config/google', adm.tok, cfg), 'ok');
  t('Quản trị viên lưu khóa thừa trường bị chặn', await call('PATCH', '/config/google', adm.tok, { ...cfg, extra: S('x') }), 'deny');
  t('Quản trị viên đọc khóa', await call('GET', '/config/google', adm.tok), 'ok');
  t('Quản trị viên duyệt A (active +30 ngày)', await call('PATCH', '/users/' + a.uid, adm.tok, { status: S('active'), expiresAt: T(now + 30 * DAY), approvedAt: N(now), approvedBy: S(adm.uid) }, ['status', 'expiresAt', 'approvedAt', 'approvedBy']), 'ok');
  t('Quản trị viên sửa email người dùng bị chặn', await call('PATCH', '/users/' + a.uid, adm.tok, { email: S('khac@test.vn') }, ['email']), 'deny');
  t('Quản trị viên đặt status lạ bị chặn', await call('PATCH', '/users/' + a.uid, adm.tok, { status: S('superuser') }, ['status']), 'deny');
  t('Quản trị viên khóa B', await call('PATCH', '/users/' + b.uid, adm.tok, { status: S('blocked') }, ['status']), 'ok');
  t('Quản trị viên duyệt tài khoản đã hết hạn (hạn trong quá khứ)', await call('PATCH', '/users/' + exp.uid, adm.tok, { status: S('active'), expiresAt: T(now - DAY) }, ['status', 'expiresAt']), 'ok');

  console.log('--- VIP đọc khóa theo hạn');
  t('VIP đang hoạt động đọc được khóa', await call('GET', '/config/google', a.tok), 'ok');
  t('VIP không ghi được khóa', await call('PATCH', '/config/google', a.tok, cfg), 'deny');
  t('Tài khoản bị khóa không đọc được khóa', await call('GET', '/config/google', b.tok), 'deny');
  t('Tài khoản hết hạn không đọc được khóa', await call('GET', '/config/google', exp.tok), 'deny');
  t('Tài khoản chờ duyệt (C) không đọc được khóa', await call('GET', '/config/google', c.tok), 'deny');
  t('Quản trị viên rút hạn A về quá khứ', await call('PATCH', '/users/' + a.uid, adm.tok, { expiresAt: T(now - 1000) }, ['expiresAt']), 'ok');
  t('A hết hạn: không còn đọc được khóa', await call('GET', '/config/google', a.tok), 'deny');
  t('Quản trị viên gia hạn lại cho A', await call('PATCH', '/users/' + a.uid, adm.tok, { expiresAt: T(now + 30 * DAY) }, ['expiresAt']), 'ok');
  t('A được gia hạn: đọc lại được khóa', await call('GET', '/config/google', a.tok), 'ok');
  t('Người thường xóa hồ sơ người khác bị chặn', await call('DELETE', '/users/' + c.uid, b.tok), 'deny');
  t('Quản trị viên xóa hồ sơ C', await call('DELETE', '/users/' + c.uid, adm.tok), 'ok');

  console.log('--- Khóa Claude (config/ai)');
  const ai = { key: S('sk-ant-test'), model: S('claude-sonnet-5-5'), userAi: N(20), updatedAt: N(now) };
  t('Người thường không ghi được cấu hình Claude', await call('PATCH', '/config/ai', a.tok, ai), 'deny');
  t('Quản trị viên lưu cấu hình Claude', await call('PATCH', '/config/ai', adm.tok, ai), 'ok');
  t('Quản trị viên lưu thừa trường bị chặn', await call('PATCH', '/config/ai', adm.tok, { ...ai, extra: S('x') }), 'deny');
  t('Quản trị viên lưu userAi sai kiểu bị chặn', await call('PATCH', '/config/ai', adm.tok, { ...ai, userAi: S('20') }), 'deny');
  t('Quản trị viên đọc cấu hình Claude', await call('GET', '/config/ai', adm.tok), 'ok');
  t('VIP còn hạn đọc được khóa Claude', await call('GET', '/config/ai', a.tok), 'ok');
  t('Không đăng nhập không đọc được khóa Claude', await call('GET', '/config/ai', null), 'deny');
  t('Tài khoản bị khóa không đọc được khóa Claude', await call('GET', '/config/ai', b.tok), 'deny');
  t('Tài khoản hết hạn không đọc được khóa Claude', await call('GET', '/config/ai', exp.tok), 'deny');
  t('Tài khoản chờ duyệt không đọc được khóa Claude', await call('GET', '/config/ai', c.tok), 'deny');
  t('VIP báo lượt tóm tắt (usage.ai)', await call('PATCH', '/users/' + a.uid, a.tok, { usage: M({ m202610: M({ ai: N(1) }) }), lastSeen: N(now) }, ['usage', 'lastSeen']), 'ok');

  console.log('--- Giới hạn mỗi VIP (config/google) và gói Google Cloud (config/billing)');
  const cfg2 = { key: S('AIzaFAKE'), trLimit: N(500000), ttsLimit: N(4000000), userTr: N(300000), userTts: N(600000), updatedAt: N(now) };
  const bill = { creditUsd: N(300), vndPerUsd: N(25970), trialEndMs: N(now + 89 * DAY), trPrice: N(20), ttsPrice: N(4), ttsFree: N(4000000), updatedAt: N(now) };
  t('Quản trị viên lưu giới hạn mỗi VIP', await call('PATCH', '/config/google', adm.tok, cfg2), 'ok');
  t('Quản trị viên lưu giới hạn kiểu chữ bị chặn', await call('PATCH', '/config/google', adm.tok, { ...cfg2, userTr: S('nhieu') }), 'deny');
  t('VIP còn hạn đọc được giới hạn của mình', await call('GET', '/config/google', a.tok), 'ok');
  t('VIP không sửa được giới hạn', await call('PATCH', '/config/google', a.tok, cfg2), 'deny');
  t('Quản trị viên lưu gói Google Cloud', await call('PATCH', '/config/billing', adm.tok, bill), 'ok');
  t('Quản trị viên đọc gói Google Cloud', await call('GET', '/config/billing', adm.tok), 'ok');
  t('Quản trị viên lưu gói thừa trường bị chặn', await call('PATCH', '/config/billing', adm.tok, { ...bill, extra: S('x') }), 'deny');
  t('VIP còn hạn không đọc được gói Google Cloud', await call('GET', '/config/billing', a.tok), 'deny');
  t('VIP không ghi được gói Google Cloud', await call('PATCH', '/config/billing', a.tok, bill), 'deny');
  t('Không đăng nhập không đọc được gói Google Cloud', await call('GET', '/config/billing', null), 'deny');
  t('Tài liệu config khác (không phải google/billing) bị chặn', await call('PATCH', '/config/khac', adm.tok, bill), 'deny');

  console.log('\nKẾT QUẢ: ' + pass + ' đạt, ' + fail + ' lỗi');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('LỖI KHI CHẠY', e); process.exit(2); });
