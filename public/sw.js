// Service Worker for PWA
const CACHE_NAME = 'marketing-bot-v1'
const urlsToCache = [
  '/',
  '/content',
  '/schedule',
  '/email',
  '/leads',
  '/analytics',
  '/settings',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache)
    })
  )
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request)
    })
  )
})
