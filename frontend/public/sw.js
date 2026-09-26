/* Review Well service worker: offline shell + API resilience + push.
   - App shell and static assets: stale-while-revalidate.
   - Navigations: network first, offline.html fallback.
   - GET /api/*: network first with cached fallback (5-minute entries).
   - Push: formatted club notification, tap opens the linked page.
*/
const SHELL_CACHE = 'review-well-shell-v1'
const API_CACHE = 'review-well-api-v1'
const API_TTL_MS = 5 * 60 * 1000

const PRECACHE = ['/', '/index.html', '/offline.html', '/logo.png', '/manifest.webmanifest']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== SHELL_CACHE && key !== API_CACHE).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  )
})

const isApiRequest = (url) => url.pathname.startsWith('/api/')

async function networkFirstWithCache(event, cacheName, fallbackResponse) {
  const cache = await caches.open(cacheName)
  try {
    const network = await fetch(event.request)
    if (network.ok) {
      const stamped = new Response(network.clone().body, {
        status: network.status,
        statusText: network.statusText,
        headers: { ...Object.fromEntries(network.headers.entries()), 'x-rw-cached-at': String(Date.now()) },
      })
      event.waitUntil(cache.put(event.request, stamped))
    }
    return network
  } catch {
    const cached = await cache.match(event.request)
    if (cached) {
      const cachedAt = Number(cached.headers.get('x-rw-cached-at') || 0)
      if (!cachedAt || Date.now() - cachedAt < API_TTL_MS || cacheName !== API_CACHE) return cached
      // Stale API entry is better than nothing offline.
      return cached
    }
    return fallbackResponse
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request)
        } catch {
          const cache = await caches.open(SHELL_CACHE)
          return (await cache.match('/index.html')) || (await cache.match('/offline.html'))
        }
      })()
    )
    return
  }

  if (isApiRequest(url)) {
    event.respondWith(networkFirstWithCache(event, API_CACHE, Response.error()))
    return
  }

  // Static assets: stale-while-revalidate.
  event.respondWith(
    (async () => {
      const cache = await caches.open(SHELL_CACHE)
      const cached = await cache.match(request)
      const network = fetch(request)
        .then((response) => {
          if (response.ok) event.waitUntil(cache.put(request, response.clone()))
          return response
        })
        .catch(() => null)
      return cached || (await network) || Response.error()
    })()
  )
})

self.addEventListener('push', (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    payload = { body: event.data ? event.data.text() : '' }
  }
  const title = payload.title || 'Review Well'
  const options = {
    body: payload.body || 'Something new in your study club.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: payload.tag || 'review-well',
    renotify: true,
    data: { url: payload.url || '/' },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) return client.focus()
      }
      return self.clients.openWindow(url)
    })
  )
})
