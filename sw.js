const CACHE_NAME = 'pilgrimage-route-nav-v5-seoul-gpx3-20260707';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/route-nav.css?v=20260707-fix2',
  './js/route-nav.js?v=20260707-fix2',
  './routes/hanti-route-data-v1.js',
  './routes/seoul-pilgrimage-routes.js?v=20260707-gpx3',
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
  // 브라우저가 그대로 네트워크 요청하게 둬야 지도 로딩 실패와 캐시 오염을 막을 수 있다.
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
