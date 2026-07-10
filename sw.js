const CACHE_NAME = 'pilgrimage-route-nav-v79-low-zoom-labels-hanti-colors-20260711';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/route-nav.css?v=20260711-v79-low-zoom-labels-hanti-colors',
  './js/route-nav.js?v=20260711-v79-low-zoom-labels-hanti-colors',
  './routes/sacred-site-landmarks.js?v=20260711-v79-low-zoom-labels-hanti-colors',
  './routes/hanti-route-data-v1.js?v=20260711-v79-low-zoom-labels-hanti-colors',
  './routes/seoul-pilgrimage-routes.js?v=20260711-v79-low-zoom-labels-hanti-colors',
  './routes/nimui-gil-routes.js?v=20260711-v79-low-zoom-labels-hanti-colors',
  './routes/jeonju-pilgrimage-routes.js?v=20260711-v79-low-zoom-labels-hanti-colors',
  './routes/test-route-data-v1.js?v=20260711-v79-low-zoom-labels-hanti-colors',
  './gpx/nimui-gil-1-1-big-cheomnye.gpx',
  './gpx/nimui-gil-1-2-ne-gongso.gpx',
  './gpx/nimui-gil-1-3-nine-pass-road.gpx',
  './gpx/nimui-gil-1-4-seoji-gangbyeon.gpx',
  './gpx/nimui-gil-1-5-seogogae.gpx',
  './gpx/nimui-gil-1-6-kkotdaengi.gpx',
  './gpx/nimui-gil-1-7-yangeop.gpx',
  './gpx/nimui-gil-2-1-choi-haeseong-john-martyrdom.gpx',
  './gpx/nimui-gil-2-2-choi-birgitta-martyrdom.gpx',
  './gpx/nimui-gil-3-1-gyuha-priest-road.gpx',
  './gpx/nimui-gil-3-2-lemer-priest-road.gpx',
  './gpx/nimui-gil-3-3-jihak-sun-bishop-road.gpx',
  './gpx/nimui-gil-3-4-seonjongwan-priest-road.gpx',
  './gpx/nimui-gil-3-5-seongsa-road.gpx',
  './gpx/jeonju-yoan-rugalda-road.gpx',
  './gpx/jeonju-martyrs-road.gpx',
  './gpx/jeonju-chimyeongja-road.gpx',
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
