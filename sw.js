const CACHE_NAME = 'left-cache-v3';
const ASSETS = [
  '/web.html',
	'/left.webmanifest',
	'/style.css',
	'/left-icon/android-chrome-192x192.png',
	'/left-icon/android-chrome-512x512.png',
	'/left-icon/apple-touch-icon.png',
	'/left-icon/favicon-32x32.png',
	'/left-icon/favicon-16x16.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => k !== CACHE_NAME && caches.delete(k)))).then(() => self.clients.claim())
  );
});

// Network-first for HTML, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put('/web.html', copy));
        return res;
      }).catch(() => caches.match('/web.html'))
    );
    return;
  }
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});

// Focus an existing client or open the app when a notification is clicked
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of allClients) {
      try {
        const url = new URL(client.url);
        if (url.pathname.endsWith('/web.html') || url.pathname === '/' ) {
          client.focus();
          return;
        }
      } catch(_) {}
    }
    await clients.openWindow('/web.html');
  })());
});
