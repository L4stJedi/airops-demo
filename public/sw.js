/* AirOps Service Worker — offline-first for pilot data */
const CACHE = 'airops-v2';
const API_CACHE = 'airops-api-v2';

const PRECACHE = ['/', '/manifest.json'];
const API_ROUTES = ['/api/fl3xx/flights', '/api/fl3xx/aircraft'];

// ── Install ───────────────────────────────────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// ── Activate — clean old caches ───────────────────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE && k !== API_CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────
self.addEventListener('fetch', e => {
  const { request } = e;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Skip: different origin, Drive uploads, auth endpoints
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/drive/')) return;
  if (url.pathname.startsWith('/api/auth/')) return;

  // FL3XX API routes — network first, API cache fallback (offline pilot data)
  if (API_ROUTES.some(r => url.pathname.startsWith(r))) {
    e.respondWith(
      fetch(request)
        .then(resp => {
          if (resp.ok) {
            const clone = resp.clone();
            caches.open(API_CACHE).then(c => c.put(request, clone));
          }
          return resp;
        })
        .catch(() =>
          caches.match(request, { cacheName: API_CACHE })
            .then(cached => cached ?? new Response(
              JSON.stringify({ data: [], demo: true, offline: true, error: 'Offline — cached data not available' }),
              { headers: { 'Content-Type': 'application/json' } }
            ))
        )
    );
    return;
  }

  // Everything else — stale-while-revalidate (app shell)
  e.respondWith(
    caches.match(request).then(cached => {
      const fetchPromise = fetch(request).then(resp => {
        if (resp.ok && resp.type !== 'opaque') {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(request, clone));
        }
        return resp;
      }).catch(() => null);
      return cached ?? fetchPromise ?? new Response('Offline', { status: 503 });
    })
  );
});

// ── Background sync ───────────────────────────────────────────────────────
self.addEventListener('sync', e => {
  if (e.tag === 'airops-sync') {
    e.waitUntil(
      self.clients.matchAll().then(clients =>
        clients.forEach(c => c.postMessage({ type: 'SYNC_REQUESTED' }))
      )
    );
  }
});

// ── Push notifications (placeholder) ─────────────────────────────────────
self.addEventListener('push', e => {
  const data = e.data?.json() ?? { title: 'AirOps', body: 'Nové upozornění' };
  e.waitUntil(
    self.registration.showNotification(data.title ?? 'AirOps', {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: data.url ? { url: data.url } : undefined,
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.notification.data?.url) {
    e.waitUntil(clients.openWindow(e.notification.data.url));
  }
});
