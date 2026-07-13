/* Service worker — KCN Long Thành
   Chiến lược:
   - index.html, seed.js  -> ƯU TIÊN MẠNG (network-first): luôn lấy bản mới nhất,
                             chỉ dùng cache khi mất mạng.
   - icon, manifest       -> ưu tiên cache (ít khi đổi).
*/
const CACHE = 'kcn-longthanh-v7';
const CORE = ['./', './index.html', './seed.js', './manifest.webmanifest',
              './icon-192.png', './icon-512.png', './icon-512-maskable.png',
              './apple-touch-icon.png', './favicon.png'];
const FRESH = ['index.html', 'seed.js', '/'];   // luôn lấy bản mới

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;   // bỏ qua Google Sheet API

  const isFresh = FRESH.some(f => url.pathname.endsWith(f)) || url.pathname === '/';

  if (isFresh) {
    // network-first
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
    );
  } else {
    // cache-first
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      }))
    );
  }
});
