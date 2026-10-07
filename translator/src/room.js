// Phòng họp xem chung: đồng bộ tin nhắn theo thời gian thực qua Firebase (Firestore) + tạo mã QR.
// Được đóng gói thành ../room.bundle.js bằng esbuild (xem docs/FIREBASE-SETUP.md).
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, connectAuthEmulator } from 'firebase/auth';
import {
  getFirestore, connectFirestoreEmulator, doc, getDoc, getDocs, setDoc, updateDoc, addDoc,
  collection, onSnapshot, query, orderBy, Timestamp, deleteDoc, writeBatch
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

  return {
    async init() {
      if (!auth.currentUser) await signInAnonymously(auth);
      await auth.authStateReady();
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

    qrSvg(text, cell = 6) {
      const qr = qrcode(0, 'M');
      qr.addData(text);
      qr.make();
      return qr.createSvgTag({ cellSize: cell, margin: 2, scalable: true });
    }
  };
}

window.RoomKit = { create };
