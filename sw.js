// Aurum Origins — Service Worker
// Permite que la app funcione offline y se instale como PWA

const CACHE_NAME = 'aurum-origins-v1';
const URLS_TO_CACHE = [
  '/aurum-origins/',
  '/aurum-origins/index.html'
];

// Instalar SW y cachear recursos base
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      console.log('Aurum Origins SW: Cache abierto');
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activar SW y limpiar caches viejos
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(name) {
          return name !== CACHE_NAME;
        }).map(function(name) {
          return caches.delete(name);
        })
      );
    })
  );
  self.clients.claim();
});

// Estrategia: Network first, cache como fallback
self.addEventListener('fetch', function(event) {
  // Solo cachear requests del mismo origen
  if(!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        // Guardar copia en cache si es válida
        if(response && response.status === 200 && response.type === 'basic') {
          var responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(function() {
        // Sin internet — servir desde cache
        return caches.match(event.request).then(function(cached) {
          if(cached) return cached;
          // Fallback para navegación offline
          return caches.match('/aurum-origins/index.html');
        });
      })
  );
});
