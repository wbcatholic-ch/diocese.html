const CACHE_VERSION = 'catholic-way-V8-1-14-810';
const ASSET_VERSION = 'V8-1-14-810';

/* V8-1-14-693: service worker cache strategy overview.
   - APP_SHELL: first-screen and internal helper files.
   - HTML navigation: networkFirst, then cached index fallback.
   - Versioned/static assets: cacheFirst.
   - Other same-origin GET requests: staleWhileRevalidate.
   Strategy is documented here only; runtime behavior is unchanged. */
function withVersion(path) {
  return path + '?v=' + ASSET_VERSION;
}
const APP_SHELL = [
  './',
  './index.html',
  withVersion('./diocese.html'),
  withVersion('./privacy.html'),
  withVersion('./qa-firebase.html'),
  withVersion('./style.css'),
  withVersion('./css/module-common.css'),
  withVersion('./css/diocese.css'),
  withVersion('./css/prayer.css'),
  withVersion('./css/web.css'),
  withVersion('./css/pilgrimage.css'),
  withVersion('./css/overlays.css'),
  withVersion('./css/cover-modals.css'),
  withVersion('./css/myfaith.css'),
  withVersion('./css/my-diocese.css'),
  withVersion('./js/myfaith.js'),
  withVersion('./app.js'),
  withVersion('./js/cover-common.js'),
  withVersion('./js/touch-ux.js'),
  withVersion('./js/prayer-ui.js'),
  withVersion('./js/cover-refresh.js'),
  withVersion('./js/app-state-guards.js'),
  withVersion('./web.js'),
  withVersion('./js/route-web-guards.js'),
  withVersion('./js/back-controller.js'),
  withVersion('./sw-update.js'),
  withVersion('./manifest.json'),
  withVersion('./icon-192x192.png'),
  withVersion('./icon-512x512.png'),
  withVersion('./icon-512x512-maskable.png'),
  withVersion('./intro-cross-jesus.jpg'),
  withVersion('./assets/guide/cover.jpg'),
  withVersion('./assets/guide/parish-card.jpg'),
  withVersion('./assets/guide/stampbook.jpg'),
  withVersion('./assets/guide/home-parish.jpg'),
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => Promise.all(APP_SHELL.map((url) => cache.add(url).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((key) => key === CACHE_VERSION ? null : caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

function sameOrigin(request) {
  try { return new URL(request.url).origin === self.location.origin; } catch (e) { return false; }
}
function isHtmlRequest(request) {
  return request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html');
}
function isVersionedAsset(request) {
  try {
    const url = new URL(request.url);
    return url.searchParams.has('v') ||
      /parishes-[a-z-]+\.js|prayer-data\.js|prayer\.js|retreats\.js|shrines\.js|diocese\.html|privacy\.html|diocese\.css|qa-firebase\.html|app\.js|style\.css|module-common\.css|prayer\.css|web\.css|pilgrimage\.css|overlays\.css|cover-modals\.css|myfaith\.css|my-diocese\.css|web\.js|touch-ux\.js|prayer-ui\.js|cover-refresh\.js|app-state-guards\.js|route-web-guards\.js|back-controller\.js|sw-update\.js/.test(url.pathname);
  } catch (e) { return false; }
}
async function networkFirst(request) {
  const cache = await caches.open(CACHE_VERSION);
  try {
    const fresh = await fetch(request, { cache: 'no-cache' });
    if (fresh && fresh.ok) cache.put(request, fresh.clone()).catch(() => null);
    return fresh;
  } catch (e) {
    const cached = await cache.match(request);
    return cached || cache.match('./index.html');
  }
}
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.ok) cache.put(request, fresh.clone()).catch(() => null);
    return fresh;
  } catch (e) {
    return new Response('Offline', { status: 503 });
  }
}
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(request);
  const freshPromise = fetch(request)
    .then((fresh) => {
      if (fresh && fresh.ok) cache.put(request, fresh.clone()).catch(() => null);
      return fresh;
    })
    .catch(() => null);
  if (cached) return cached;
  const fresh = await freshPromise;
  return fresh || new Response('Offline', { status: 503 });
}
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  if (!sameOrigin(request)) return;
  try {
    const u = new URL(request.url);
    if (u.pathname.endsWith('/version.json')) {
      event.respondWith(fetch(request, {cache:'no-store'}).catch(() => new Response('{"version":""}', {headers:{'Content-Type':'application/json'}})));
      return;
    }
  } catch (_e) {}
  if (isHtmlRequest(request)) {
    event.respondWith(networkFirst(request));
    return;
  }
  if (isVersionedAsset(request)) {
    event.respondWith(cacheFirst(request));
    return;
  }
  event.respondWith(staleWhileRevalidate(request));
});
