const CACHE_NAME = 'naxxivo-cache-v1';
// These are the files that make up the "app shell".
const urlsToCache = [
  '/',
  '/index.html',
  '/index.css',
  '/manifest.json',
  '/logo192.png',
  '/logo512.png',
  // Key CDN assets from importmap
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Pacifico&family=Poppins:wght@400;500;600;700&display=swap',
  'https://storage.googleapis.com/pai-images/421457c631c34a21a605809823c93e43.jpeg'
];

// Install the service worker and cache the app shell.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching app shell');
        return cache.addAll(urlsToCache);
      })
  );
});

// Clean up old caches on activation.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Intercept fetch requests.
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // Always go to the network for Supabase API calls.
  if (requestUrl.hostname.includes('supabase.co')) {
    return; // Do not respond, let the browser handle it.
  }
  
  // For other requests, use a Cache-first strategy.
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // If the response is in the cache, return it.
        if (cachedResponse) {
          return cachedResponse;
        }

        // If it's not in the cache, fetch it from the network.
        return fetch(event.request).then(
          networkResponse => {
            // If we got a valid response, clone it and cache it.
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  // Only cache GET requests
                  if(event.request.method === 'GET') {
                    cache.put(event.request, responseToCache);
                  }
                });
            }
            return networkResponse;
          }
        ).catch(error => {
          // The fetch failed, maybe the network is down.
          console.error('Fetch failed:', error);
          throw error;
        });
      })
  );
});
