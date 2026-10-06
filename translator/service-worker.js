/* Service worker - Dịch Thời Gian Thực
   - Tệp của ứng dụng: ưu tiên mạng (luôn lấy bản mới), mất mạng thì dùng bản đã lưu.
   - API dịch (MyMemory): luôn đi qua mạng, không cache.
*/
const CACHE = 'translator-v18';
const CORE = [
  './', './index.html', './app.js', './config.js', './donate-qr.jpg', './styles.css', './manifest.json',
  './icons/icon-192.png', './icons/icon-512.png',
  './icons/icon-512-maskable.png', './icons/apple-touch-icon.png',
  './icons/logo-mark.png', './icons/logo-full.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(async c => {
      await c.addAll(CORE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  const sameOrigin = url.origin === location.origin;
  if (!sameOrigin) return; // API dịch và các nguồn khác: để trình duyệt xử lý

  // Ưu tiên mạng để luôn nhận bản mới nhất ngay lần mở đầu tiên; mất mạng thì dùng bản đã lưu
  e.respondWith(
    fetch(req).then(res => {
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      }
      return res;
    }).catch(() =>
      caches.match(req, { ignoreSearch: req.mode === 'navigate' })
        .then(hit => hit || (req.mode === 'navigate' ? caches.match('./index.html') : undefined))
    )
  );
});
