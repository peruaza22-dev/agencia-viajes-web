// Service Worker — Travel Agency
// Estrategia: Cache-first para assets estáticos, Network-first para API
const CACHE_STATIC  = 'ta-static-v2';
const CACHE_PAGES   = 'ta-pages-v2';
const OFFLINE_URL   = '/';

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/img/favicon.png',
  '/img/logo.svg',
  '/css/all.min.css',
];

// ── Install: pre-cachear assets críticos ─────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then(cache =>
      cache.addAll(STATIC_ASSETS).catch(() => {}) // no fallar si alguno no existe
    ).then(() => self.skipWaiting())
  );
});

// ── Activate: limpiar caches viejos ──────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_STATIC && k !== CACHE_PAGES)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: estrategia por tipo de recurso ────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requests no-GET y extensiones de Chrome
  if (request.method !== 'GET') return;
  if (url.protocol === 'chrome-extension:') return;

  // API calls → Network-first, sin caché
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ success: false, error: { message: 'Sin conexión' } }), {
          headers: { 'Content-Type': 'application/json' },
          status: 503,
        })
      )
    );
    return;
  }

  // Assets estáticos (imágenes, fuentes, CSS, JS) → Cache-first
  if (
    url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico|woff2?|ttf|css)$/) ||
    url.pathname.startsWith('/img/') ||
    url.pathname.startsWith('/webfonts/')
  ) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;

        const fallbackMap = {
          '/img/logo.png': '/img/logo.svg',
          '/img/logo.jpg': '/img/logo.svg',
          '/img/logo.jpeg': '/img/logo.svg',
        };
        const fallbackUrl = fallbackMap[url.pathname];
        if (fallbackUrl) {
          return caches.match(fallbackUrl).then(fallbackCached => fallbackCached || fetch(fallbackUrl));
        }

        return fetch(request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_STATIC).then(c => c.put(request, clone));
          }
          return response;
        }).catch(() => cached || new Response('', { status: 404 }));
      })
    );
    return;
  }

  // Páginas HTML → Network-first con fallback a caché
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_PAGES).then(c => c.put(request, clone));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then(cached => cached || caches.match(OFFLINE_URL))
        )
    );
    return;
  }
});

// ── Push notifications ────────────────────────────────────────────────────────
self.addEventListener('push', event => {
  let data = { title: '✈ Oferta Flash', body: 'Nueva oferta de última hora disponible', url: '/vuelos' };
  try { if (event.data) data = { ...data, ...event.data.json() }; } catch {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/img/favicon.png',
      badge: '/img/favicon.png',
      tag: 'flash-deal',
      renotify: true,
      data: { url: data.url || '/' },
      actions: [
        { action: 'view', title: 'Ver oferta' },
        { action: 'close', title: 'Cerrar' },
      ],
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'close') return;
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      const existing = clients.find(c => c.url.includes(self.location.origin));
      if (existing) { existing.focus(); existing.navigate(url); }
      else self.clients.openWindow(url);
    })
  );
});
