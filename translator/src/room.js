// Phòng họp xem chung: đồng bộ tin nhắn theo thời gian thực qua Firebase (Firestore) + tạo mã QR.
// Được đóng gói thành ../room.bundle.js bằng esbuild (xem docs/FIREBASE-SETUP.md).
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, connectAuthEmulator } from 'firebase/auth';
import {
  getFirestore, connectFirestoreEmulator, doc, getDoc, getDocs, setDoc, updateDoc, addDoc,
  collection, onSnapshot, query, orderBy, Timestamp, deleteDoc
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
      return { id, expiresAtMs: expiresAt.toMillis() };
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
    async deleteMessages(id) {
      const snap = await getDocs(msgs(id));
      await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
    },

    async pushMessage(id, expiresAtMs, m) {
      const ref = await addDoc(msgs(id), {
        src: m.src, out: m.out, from: m.from, to: m.to, ts: m.ts, meeting: !!m.meeting,
        expiresAt: Timestamp.fromMillis(expiresAtMs), tr: {}
      });
      return ref.id;
    },
    subscribeMessages(id, cb, onError) {
      return onSnapshot(query(msgs(id), orderBy('ts', 'asc')), snap => {
        cb(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, onError);
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
