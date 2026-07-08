const CACHE_NAME = 'pilgrimage-route-nav-v32-604-list-nimui-1-5-20260708';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/route-nav.css?v=20260708-v32-604-list-nimui-1-5',
  './js/route-nav.js?v=20260708-v32-604-list-nimui-1-5',
  './routes/hanti-route-data-v1.js?v=20260708-v32-604-list-nimui-1-5',
  './routes/seoul-pilgrimage-routes.js?v=20260708-v32-604-list-nimui-1-5',
  './routes/nimui-gil-routes.js?v=20260708-v32-604-list-nimui-1-5',
  './routes/test-route-data-v1.js?v=20260708-v32-604-list-nimui-1-5',
  './gpx/nimui-gil-1-1-big-cheomnye.gpx',
  './gpx/nimui-gil-1-2-ne-gongso.gpx',
  './gpx/nimui-gil-1-4-seoji-gangbyeon.gpx',
  './gpx/nimui-gil-1-5-seogogae.gpx',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  './icons/icon-512x512-maskable.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((key) => key === CACHE_NAME ? null : caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const requestUrl = new URL(request.url);
  const scopeUrl = new URL(self.registration.scope);

  // Kakao 지도 SDK/타일 같은 외부 요청은 서비스워커가 절대 가로채지 않는다.
  if (requestUrl.origin !== scopeUrl.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', copy)).catch(() => {});
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request).then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {});
        }
        return response;
      });
      return cached || networkFetch;
    })
  );
});
