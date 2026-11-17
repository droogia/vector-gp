// VECTOR GP service worker: makes the game installable and playable offline.
// Pages are fetched network-first (a new version shows up on the next load, the cached copy is the
// offline fallback); icons and the web font are served from the cache. Multiplayer needs the network
// anyway: WebSockets and WebRTC never pass through here.
const VERSION = 'vgp-3.2.1';
const SHELL = ['./', './vector-gp.html', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;
  const page = req.mode === 'navigate' || url.origin === location.origin && /\.(html|webmanifest|js)$|\/$/.test(url.pathname);
  if (page) {                                              // network first, cache as the offline fallback
    e.respondWith(fetch(req).then(res => {
      if (res.ok && url.origin === location.origin) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('./vector-gp.html'))));
    return;
  }
  if (url.origin === location.origin || /(^|\.)(fonts\.googleapis|fonts\.gstatic)\.com$/.test(url.hostname)) {   // cache first
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    })));
  }
});
