const CACHE_NAME = 'pilgrimage-route-nav-v3-20260707';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/route-nav.css',
  './js/route-nav.js',
  './routes/hanti-route-data-v1.js',
  './routes/seoul-pilgrimage-routes.js',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  './icons/icon-512x512-maskable.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((key) => key === CACHE_NAME ? null : caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {});
      return response;
    }).catch(() => caches.match('./index.html')))
  );
});
