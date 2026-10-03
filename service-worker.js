const clearAllCaches = async () => {
  const keys = await caches.keys()
  await Promise.all(keys.map((key) => caches.delete(key)))
}

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await clearAllCaches()
      await self.registration.unregister()
    })()
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  event.respondWith(fetch(event.request))
})
