const CACHE_NAME = 'adopta-patitas-v2';

// Solo guardamos en caché los archivos locales que controlamos al 100%
// Esto evita errores de CORS con servidores externos que cancelan la instalación
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

// Instalar el Service Worker
self.addEventListener('install', event => {
  self.skipWaiting(); // Fuerza a que la app se actualice sin tener que cerrar Chrome
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Archivos base cacheados exitosamente');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.log('Error al cachear archivos:', err))
  );
});

// Toma el control de la página inmediatamente
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interceptar las peticiones
self.addEventListener('fetch', event => {
  // Ignorar peticiones a la base de datos de Firebase para que no se congele
  if (event.request.url.includes('firestore.googleapis.com') || 
      event.request.url.includes('firebase.googleapis.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Devuelve el archivo desde la caché si existe
        if (response) {
          return response;
        }
        // Si no está en la caché, búscalo en internet normalmente
        return fetch(event.request);
      }).catch(() => {
        // Si no hay internet y es una petición de navegación, muestra el index
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      })
  );
});
