// sw.js  (v4)
const CACHE = 'eqtt-v4';

// Activate new SW immediately
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Strategy:
// - HTML (navigation/doc requests): NETWORK-FIRST so index.html always updates
// - Same-origin static assets: CACHE-FIRST for speed
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  const accept = request.headers.get('accept') || '';

  // HTML pages
  if (request.mode === 'navigate' || accept.includes('text/html')) {
    event.respondWith(
      fetch(request).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE).then(c => c.put(request, copy)).catch(() => {});
        return resp;
      }).catch(() => caches.match(request))
    );
    return;
  }

  // Same-origin static assets
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(resp => {
          const copy = resp.clone();
          caches.open(CACHE).then(c => c.put(request, copy)).catch(() => {});
          return resp;
        });
      })
    );
  }
});
