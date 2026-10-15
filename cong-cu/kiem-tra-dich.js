#!/usr/bin/env node
/**
 * Kiểm tra tổng hợp cho app dịch thời gian thực (translator/) — không cần cài thêm gói.
 * Cách chạy (tại thư mục gốc kho):   node cong-cu/kiem-tra-dich.js [nhánh-so-sánh]
 *   nhánh-so-sánh mặc định: nhánh phát hành origin/claude/realtime-translation-app-68o1ik, nếu không có thì origin/main, main.
 *
 * Kiểm tra:
 *  1. Cú pháp mọi tệp .js trong translator/ (trừ node_modules) và các <script> trong index.html.
 *  2. Toàn bộ kiểm thử đơn vị translator/tests/*.test.js (node:test).
 *  3. Các tệp trong CORE của service-worker.js đều tồn tại.
 *  4. Có sửa tệp được cache mà chưa tăng CACHE → LỖI.
 *  5. Có sửa src/room.js mà room.bundle.js chưa được build lại → LỖI.
 *  6. Có sửa input.css / tailwind.config.js mà styles.css chưa build lại → LỖI.
 *  7. Có sửa firestore.rules, config.js, hoặc ứng dụng ở thư mục gốc → CẢNH BÁO.
 *
 * Mã thoát: 0 = đạt, 1 = có lỗi.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { spawnSync } = require('child_process');

const ROOT = process.cwd();
const APP = path.join(ROOT, 'translator');
const loi = [];
const canhBao = [];
const thongTin = [];
const rel = f => path.relative(ROOT, f).split(path.sep).join('/');

if (!fs.existsSync(APP)) {
  console.log('Không thấy thư mục translator/. Hãy chạy lệnh tại thư mục gốc kho.');
  process.exit(1);
}

function chay(lenh, thamSo, opts = {}) {
  return spawnSync(lenh, thamSo, { cwd: ROOT, encoding: 'utf8', ...opts });
}
function git(...a) {
  const r = chay('git', a);
  return r.status === 0 ? r.stdout : null;
}

// ---------- 1. Cú pháp ----------
function quet(dir, kq = []) {
  for (const ten of fs.readdirSync(dir)) {
    if (ten === 'node_modules' || ten.startsWith('.')) continue;
    const p = path.join(dir, ten);
    if (fs.statSync(p).isDirectory()) quet(p, kq); else kq.push(p);
  }
  return kq;
}
const tatCa = quet(APP);
const fileJs = tatCa.filter(f => f.endsWith('.js'));
for (const f of fileJs) {
  const r = chay(process.execPath, ['--check', f]);
  if (r.status !== 0) {
    const dong = (r.stderr || '').split(f).join(rel(f)).split('\n').filter(Boolean).slice(0, 4).join(' | ');
    loi.push(`[CU PHAP] ${rel(f)}: ${dong}`);
  }
}
for (const f of tatCa.filter(f => f.endsWith('.html'))) {
  const html = fs.readFileSync(f, 'utf8');
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    if (/\bsrc\s*=/.test(m[1])) continue;
    if (/type\s*=\s*["'](?!text\/javascript)[^"']*["']/i.test(m[1])) continue;
    const dong = html.slice(0, m.index).split('\n').length - 1;
    try { new vm.Script(m[2], { filename: rel(f), lineOffset: dong }); }
    catch (e) { loi.push(`[CU PHAP] ${rel(f)} (script dòng ~${dong + 1}): ${e.message}`); }
  }
}

// ---------- 2. Kiểm thử đơn vị ----------
const thuMucTest = path.join(APP, 'tests');
const fileTest = fs.existsSync(thuMucTest)
  ? fs.readdirSync(thuMucTest).filter(f => f.endsWith('.test.js')).map(f => path.join(thuMucTest, f))
  : [];
if (fileTest.length) {
  const r = chay(process.execPath, ['--test', '--test-reporter=tap', ...fileTest]);
  const out = (r.stdout || '') + (r.stderr || '');
  const lay = k => { const x = new RegExp('^# ' + k + ' (\\d+)', 'm').exec(out); return x ? +x[1] : null; };
  const tong = lay('tests'), dat = lay('pass'), rot = lay('fail');
  thongTin.push(`Kiểm thử đơn vị: ${dat ?? '?'}/${tong ?? '?'} đạt (${fileTest.length} tệp)`);
  if (r.status !== 0 || rot) {
    const ds = out.split('\n').filter(l => /^\s*not ok /.test(l)).slice(0, 10).map(l => l.trim());
    loi.push(`[KIEM THU] ${rot ?? '?'} phép thử rớt:` + (ds.length ? '\n      ' + ds.join('\n      ') : ''));
  }
} else {
  canhBao.push('[KIEM THU] Không tìm thấy tệp translator/tests/*.test.js');
}

// ---------- 3. CORE của service worker ----------
const swPath = path.join(APP, 'service-worker.js');
const sw = fs.existsSync(swPath) ? fs.readFileSync(swPath, 'utf8') : '';
const layCache = s => { const m = /const\s+CACHE\s*=\s*['"]([^'"]+)['"]/.exec(s || ''); return m ? m[1] : null; };
const coreMatch = /const\s+CORE\s*=\s*\[([\s\S]*?)\]/.exec(sw);
const core = coreMatch ? [...coreMatch[1].matchAll(/['"]([^'"]+)['"]/g)].map(x => x[1]) : [];
for (const c of core) {
  if (c === './') continue;
  if (!fs.existsSync(path.join(APP, c))) loi.push(`[SERVICE WORKER] Tệp trong CORE không tồn tại: translator/${c.replace(/^\.\//, '')}`);
}

// ---------- 4–7. So sánh với nhánh gốc ----------
const thamSo = process.argv[2];
let goc = null;
for (const ung of thamSo ? [thamSo] : ['origin/claude/realtime-translation-app-68o1ik', 'claude/realtime-translation-app-68o1ik', 'origin/main', 'main']) {
  if (git('rev-parse', '--verify', '--quiet', ung)) { goc = ung; break; }
}
if (!goc) {
  canhBao.push('[GIT] Không xác định được nhánh so sánh, bỏ qua kiểm tra CACHE/bundle/styles');
} else {
  const base = (git('merge-base', goc, 'HEAD') || '').trim() || goc;
  const doi = new Set();
  for (const out of [git('diff', '--name-only', base), git('ls-files', '--others', '--exclude-standard')]) {
    (out || '').split('\n').map(s => s.trim()).filter(Boolean).forEach(s => doi.add(s));
  }
  thongTin.push(`So sánh với: ${goc} — ${doi.size} tệp thay đổi`);
  const co = f => doi.has(f);

  // 4. CACHE
  const coreDoi = core
    .filter(c => c !== './')
    .map(c => 'translator/' + c.replace(/^\.\//, ''))
    .filter(co);
  if (co('translator/room.bundle.js')) coreDoi.push('translator/room.bundle.js');
  if (coreDoi.length) {
    const cacheCu = layCache(git('show', `${base}:translator/service-worker.js`));
    const cacheMoi = layCache(sw);
    if (cacheCu && cacheMoi && cacheCu === cacheMoi) {
      loi.push(`[SERVICE WORKER] Đã sửa tệp được cache (${coreDoi.join(', ')}) nhưng CACHE vẫn là '${cacheMoi}'. Tăng số phiên bản trong translator/service-worker.js`);
    } else if (cacheCu !== cacheMoi) {
      thongTin.push(`CACHE: ${cacheCu} → ${cacheMoi}`);
    }
  }

  // 5. room.bundle.js
  if (co('translator/src/room.js') && !co('translator/room.bundle.js')) {
    loi.push('[BUNDLE] Đã sửa translator/src/room.js nhưng chưa build lại translator/room.bundle.js (xem lệnh trong CLAUDE.md)');
  }
  if (co('translator/room.bundle.js') && !co('translator/src/room.js')) {
    canhBao.push('[BUNDLE] room.bundle.js thay đổi nhưng src/room.js không đổi — kiểm tra lại có cần thiết không');
  }

  // 6. styles.css
  if ((co('translator/input.css') || co('translator/tailwind.config.js')) && !co('translator/styles.css')) {
    loi.push('[TAILWIND] Đã sửa input.css/tailwind.config.js nhưng chưa build lại translator/styles.css');
  }
  if ((co('translator/index.html') || co('translator/app.js')) && !co('translator/styles.css')) {
    canhBao.push('[TAILWIND] index.html/app.js thay đổi: nếu có dùng lớp Tailwind MỚI thì phải build lại styles.css');
  }

  // 7. Cảnh báo
  if (co('translator/firebase/firestore.rules')) {
    canhBao.push('[FIRESTORE] firestore.rules thay đổi: chạy rules-test*.js bằng Emulator, rồi dán lại quy tắc trên Firebase Console và bấm Publish');
    if (!co('translator/firebase/rules-test.js') && !co('translator/firebase/rules-test-vip.js')) {
      canhBao.push('[FIRESTORE] Quy tắc thay đổi nhưng chưa có phép thử mới trong rules-test*.js');
    }
  }
  if (co('translator/config.js')) canhBao.push('[CONFIG] config.js thay đổi: kiểm tra không lộ khóa bí mật, giá trị Firebase còn đúng');
  const ngoai = [...doi].filter(f => !f.startsWith('translator/') && !f.startsWith('.bangiao/')
    && !f.startsWith('.claude/') && !f.startsWith('cong-cu/') && f !== 'CLAUDE.md' && f !== '.gitignore');
  if (ngoai.length) canhBao.push(`[PHAM VI] Có tệp ngoài app dịch thay đổi: ${ngoai.join(', ')}`);
}

// ---------- Báo cáo ----------
console.log(`Đã kiểm tra: ${fileJs.length} tệp JS, ${tatCa.filter(f => f.endsWith('.html')).length} tệp HTML trong translator/`);
thongTin.forEach(x => console.log('  • ' + x));
if (canhBao.length) {
  console.log(`\nCẢNH BÁO (${canhBao.length}):`);
  canhBao.forEach(x => console.log('  - ' + x));
}
if (loi.length) {
  console.log(`\nKIEM TRA TU DONG: LOI (${loi.length})`);
  loi.forEach(x => console.log('  - ' + x));
  process.exit(1);
}
console.log('\nKIEM TRA TU DONG: DAT');
