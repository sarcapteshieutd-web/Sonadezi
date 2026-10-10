// Phòng họp xem chung: đồng bộ tin nhắn theo thời gian thực qua Firebase (Firestore) + tạo mã QR.
// Được đóng gói thành ../room.bundle.js bằng esbuild (xem docs/FIREBASE-SETUP.md).
import { initializeApp } from 'firebase/app';
import {
  getAuth, signInAnonymously, connectAuthEmulator, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged, sendPasswordResetEmail
} from 'firebase/auth';
import {
  getFirestore, connectFirestoreEmulator, doc, getDoc, getDocs, setDoc, updateDoc, addDoc,
  collection, onSnapshot, query, orderBy, Timestamp, deleteDoc, writeBatch, increment
} from 'firebase/firestore';
import qrcode from 'qrcode-generator';

const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'; // bỏ ký tự dễ nhầm (i, l, o, 0, 1)

function randomRoomId() {
  const buf = new Uint8Array(20);
  crypto.getRandomValues(buf);
  let s = '';
  for (const b of buf) s += ALPHABET[b % ALPHABET.length];
  return s;
}

const toProfile = (id, d) => ({
  uid: id, email: d.email || '', name: d.name || '', status: d.status || 'pending', plan: d.plan || '', note: d.note || '',
  expiresAtMs: d.expiresAt && d.expiresAt.toMillis ? d.expiresAt.toMillis() : 0,
  requestedAt: d.requestedAt || 0, approvedAt: d.approvedAt || 0, lastSeen: d.lastSeen || 0, usage: d.usage || {}
});

function create(cfg) {
  if (!cfg || !cfg.projectId || !cfg.apiKey) throw new Error('Chưa cấu hình Firebase trong config.js');
  const app = initializeApp({ apiKey: cfg.apiKey, authDomain: cfg.authDomain, projectId: cfg.projectId, appId: cfg.appId });
  const auth = getAuth(app);
  const db = getFirestore(app);
  if (cfg.emulator) { // chỉ dùng khi kiểm thử cục bộ
    connectAuthEmulator(auth, `http://${cfg.emulator.host}:${cfg.emulator.authPort}`, { disableWarnings: true });
    connectFirestoreEmulator(db, cfg.emulator.host, cfg.emulator.firestorePort);
  }
  let uid = null;

  const roomRef = id => doc(db, 'rooms', id);
  const msgs = id => collection(db, 'rooms', id, 'messages');
  const viewerRef = (id, u) => doc(db, 'rooms', id, 'viewers', u);
  const liveRef = (id, slot = 'now') => doc(db, 'rooms', id, 'live', slot); // 'now' = chủ phòng, 'co' = máy thứ hai
  const secretRef = id => doc(db, 'rooms', id, 'secret', 'code');
  const cohostRef = (id, u) => doc(db, 'rooms', id, 'cohosts', u);
  const profileRef = u => doc(db, 'users', u);
  const adminRef = u => doc(db, 'admins', u);
  const googleCfgRef = doc(db, 'config', 'google');
  const billingRef = doc(db, 'config', 'billing');
  onAuthStateChanged(auth, u => { if (u) uid = u.uid; }); // giữ uid của phòng họp khớp với tài khoản đang đăng nhập

  return {
    // Chờ Firebase khôi phục phiên đã lưu (không đăng nhập ẩn danh)
    async ready() { await auth.authStateReady(); },
    async init() {
      await auth.authStateReady(); // phải chờ trước, nếu không phiên email đã lưu sẽ bị đăng nhập ẩn danh đè lên
      if (!auth.currentUser) await signInAnonymously(auth);
      uid = auth.currentUser.uid;
      return uid;
    },
    get uid() { return uid; },

    async createRoom({ ttlHours = 24, hostSrc, hostTgt }) {
      const id = randomRoomId();
      const expiresAt = Timestamp.fromMillis(Date.now() + ttlHours * 3600 * 1000);
      await setDoc(roomRef(id), { hostUid: uid, createdAt: Date.now(), expiresAt, status: 'open', hostSrc, hostTgt });
      let code = '';
      try { code = await this.ensureCoCode(id); } catch (_) { /* quy tắc cũ chưa cập nhật: bỏ qua, chỉ mất tính năng máy thứ hai */ }
      return { id, expiresAtMs: expiresAt.toMillis(), code };
    },
    // Mã mời máy thứ hai (chỉ chủ phòng đọc được)
    async ensureCoCode(id) {
      const s = await getDoc(secretRef(id));
      if (s.exists()) return s.data().code;
      const code = randomRoomId();
      await setDoc(secretRef(id), { code });
      return code;
    },
    async joinAsCohost(id, expiresAtMs, code) {
      await setDoc(cohostRef(id, uid), { code, ts: Date.now(), expiresAt: Timestamp.fromMillis(expiresAtMs) });
    },
    subscribeCohosts(id, cb) {
      return onSnapshot(collection(db, 'rooms', id, 'cohosts'), snap => cb(snap.docs.map(d => d.id)), () => {});
    },
    async getRoom(id) {
      const s = await getDoc(roomRef(id));
      if (!s.exists()) return null;
      const d = s.data();
      return { id, hostUid: d.hostUid, status: d.status, hostSrc: d.hostSrc, hostTgt: d.hostTgt, expiresAtMs: d.expiresAt.toMillis() };
    },
    subscribeRoom(id, cb, onError) {
      return onSnapshot(roomRef(id), s => {
        if (!s.exists()) { cb(null); return; }
        const d = s.data();
        cb({ id, hostUid: d.hostUid, status: d.status, hostSrc: d.hostSrc, hostTgt: d.hostTgt, expiresAtMs: d.expiresAt.toMillis() });
      }, onError);
    },
    async updateLangs(id, hostSrc, hostTgt) { await updateDoc(roomRef(id), { hostSrc, hostTgt }); },
    async closeRoom(id) { await updateDoc(roomRef(id), { status: 'closed' }); },
    // Xóa toàn bộ dữ liệu của phòng: tin nhắn, hồ sơ người xem, rồi đến chính phòng (làm cuối vì quy tắc cần phòng còn tồn tại)
    async deleteRoomData(id) {
      const batches = [];
      const pushAll = async ref => {
        const snap = await getDocs(ref);
        for (let i = 0; i < snap.docs.length; i += 400) {
          const b = writeBatch(db);
          snap.docs.slice(i, i + 400).forEach(d => b.delete(d.ref));
          batches.push(b.commit());
        }
      };
      await pushAll(msgs(id));
      await deleteDoc(liveRef(id, 'now')).catch(() => {});
      await deleteDoc(liveRef(id, 'co')).catch(() => {});
      await deleteDoc(secretRef(id)).catch(() => {});
      await pushAll(collection(db, 'rooms', id, 'cohosts')).catch(() => {});
      await pushAll(collection(db, 'rooms', id, 'viewers'));
      await Promise.all(batches);
      await deleteDoc(roomRef(id));
    },

    async pushMessage(id, expiresAtMs, m) {
      const ref = await addDoc(msgs(id), {
        src: m.src, out: m.out, from: m.from, to: m.to, ts: m.ts, meeting: !!m.meeting, utt: m.utt || '', ...(m.by ? { by: m.by } : {}),
        expiresAt: Timestamp.fromMillis(expiresAtMs), tr: {}
      });
      return ref.id;
    },
    subscribeMessages(id, cb, onError) {
      return onSnapshot(query(msgs(id), orderBy('ts', 'asc')), snap => {
        cb(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, onError);
    },
    // Ghi nhiều bản dịch một lần (1 lượt ghi thay vì mỗi ngôn ngữ một lượt)
    async setTranslations(id, msgId, obj) {
      const upd = {};
      for (const [l, t] of Object.entries(obj)) upd['tr.' + l] = t;
      await updateDoc(doc(db, 'rooms', id, 'messages', msgId), upd);
    },
    // Bản "đang nói": một tài liệu duy nhất, ghi đè liên tục
    async setLive(id, expiresAtMs, m, slot = 'now') {
      await setDoc(liveRef(id, slot), {
        utt: m.utt, src: m.src, out: m.out, from: m.from, to: m.to, ts: Date.now(),
        expiresAt: Timestamp.fromMillis(expiresAtMs)
      });
    },
    subscribeLive(id, slot, cb) {
      return onSnapshot(liveRef(id, slot), snap => cb(snap.exists() ? snap.data() : null), () => {});
    },
    async setTranslation(id, msgId, lang, text) {
      await updateDoc(doc(db, 'rooms', id, 'messages', msgId), { ['tr.' + lang]: text });
    },

    async joinAsViewer(id, expiresAtMs, lang) {
      await setDoc(viewerRef(id, uid), { lang, ts: Date.now(), expiresAt: Timestamp.fromMillis(expiresAtMs) });
    },
    subscribeViewers(id, cb, onError) {
      return onSnapshot(collection(db, 'rooms', id, 'viewers'), snap => {
        cb(snap.docs.map(d => ({ uid: d.id, lang: d.data().lang })));
      }, onError);
    },

    // ---------- Tài khoản VIP (đăng ký, duyệt, hạn dùng, khóa Google dùng chung) ----------
    acct: {
      // Người dùng email đang đăng nhập (null nếu chưa hoặc chỉ là phiên ẩn danh của phòng họp)
      user() {
        const u = auth.currentUser;
        return u && !u.isAnonymous ? { uid: u.uid, email: u.email || '' } : null;
      },
      onAuth(cb) { return onAuthStateChanged(auth, u => cb(u && !u.isAnonymous ? { uid: u.uid, email: u.email || '' } : null)); },
      async signUp(email, password, name) {
        await createUserWithEmailAndPassword(auth, email, password);
        uid = auth.currentUser.uid;
        await this.ensureProfile(name);
      },
      async signIn(email, password) {
        await signInWithEmailAndPassword(auth, email, password);
        uid = auth.currentUser.uid;
        await this.ensureProfile('');
      },
      async signOut() { await signOut(auth); uid = null; },
      async resetPassword(email) { await sendPasswordResetEmail(auth, email); },
      // Tạo hồ sơ "chờ duyệt" nếu chưa có (ví dụ lần đăng ký trước bị ngắt giữa chừng)
      async ensureProfile(name) {
        const u = auth.currentUser;
        const ref = profileRef(u.uid);
        const s = await getDoc(ref);
        if (s.exists()) return;
        await setDoc(ref, { email: u.email || '', name: (name || '').slice(0, 100), status: 'pending', requestedAt: Date.now() });
      },
      async getProfile(id) {
        const s = await getDoc(profileRef(id));
        return s.exists() ? toProfile(s.id, s.data()) : null;
      },
      // Theo dõi hồ sơ theo thời gian thực: quản trị viên duyệt là người dùng thấy ngay
      subscribeProfile(id, cb, onError) {
        return onSnapshot(profileRef(id), s => cb(s.exists() ? toProfile(s.id, s.data()) : null), onError || (() => {}));
      },
      async isAdmin(id) {
        try { return (await getDoc(adminRef(id))).exists(); } catch (_) { return false; }
      },
      async getGoogleConfig() {
        const s = await getDoc(googleCfgRef);
        return s.exists() ? s.data() : null;
      },
      // Theo dõi cấu hình theo thời gian thực: quản trị viên đổi khóa/giới hạn hoặc thu quyền là máy VIP biết ngay (lỗi quyền gọi onError)
      subscribeGoogleConfig(cb, onError) {
        return onSnapshot(googleCfgRef, s => cb(s.exists() ? s.data() : null), onError || (() => {}));
      },
      // Khóa dùng chung, hạn mức tổng mỗi tháng (trLimit/ttsLimit) và giới hạn mỗi tài khoản VIP mỗi tháng (userTr/userTts); 0 = không giới hạn
      async saveGoogleConfig({ key, trLimit, ttsLimit, userTr, userTts }) {
        await setDoc(googleCfgRef, { key: key || '', trLimit: trLimit || 0, ttsLimit: ttsLimit || 0, userTr: userTr || 0, userTts: userTts || 0, updatedAt: Date.now() });
      },
      // Thông tin gói/ngân sách Google Cloud của chủ dự án (chỉ quản trị viên đọc/ghi)
      async getBillingConfig() {
        const s = await getDoc(billingRef);
        return s.exists() ? s.data() : null;
      },
      async saveBillingConfig({ creditUsd, vndPerUsd, trialEndMs, trPrice, ttsPrice, ttsFree }) {
        await setDoc(billingRef, { creditUsd, vndPerUsd, trialEndMs, trPrice, ttsPrice, ttsFree, updatedAt: Date.now() });
      },
      async listUsers() {
        const snap = await getDocs(collection(db, 'users'));
        return snap.docs.map(d => toProfile(d.id, d.data()));
      },
      // Quản trị viên: duyệt, gia hạn, khóa. expiresAtMs là mốc hết hạn mới (bỏ trống để giữ nguyên).
      async setUser(id, { status, expiresAtMs, plan, note }) {
        const data = { status, approvedAt: Date.now(), approvedBy: auth.currentUser.uid };
        if (typeof expiresAtMs === 'number') data.expiresAt = Timestamp.fromMillis(expiresAtMs);
        if (typeof plan === 'string') data.plan = plan;
        if (typeof note === 'string') data.note = note;
        await updateDoc(profileRef(id), data);
      },
      async deleteUser(id) { await deleteDoc(profileRef(id)); },
      // Báo số ký tự đã dùng trong tháng (thiết bị tự báo, chỉ để quản trị viên tham khảo)
      async reportUsage(month, d) {
        const u = auth.currentUser;
        if (!u || u.isAnonymous) return;
        const upd = { lastSeen: Date.now() };
        if (d.tr) upd['usage.' + month + '.tr'] = increment(d.tr);
        if (d.tts) upd['usage.' + month + '.tts'] = increment(d.tts);
        await updateDoc(profileRef(u.uid), upd);
      }
    },

    qrSvg(text, cell = 6) {
      const qr = qrcode(0, 'M');
      qr.addData(text);
      qr.make();
      return qr.createSvgTag({ cellSize: cell, margin: 2, scalable: true });
    }
  };
}

window.RoomKit = { create };
