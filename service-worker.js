const CACHE_NAME = 'noitam-premium-v3';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './index.css?v=20260812_v4',
  './app.js',
  './data/tuvi.js',
  './data/astrology_logic.js?v=20260804_v2',
  './data/ziwei_dictionary.js',
  './data/ziwei_patterns.js',
  './components/dashboard.js?v=20260804_v3',
  './components/tuvi_home.js?v=20260804_v3',
  './components/astrology.js?v=20260804_v3',
  './components/morning.js',
  './components/meditation.js',
  './components/radar_chart.js',
  './components/rpg.js',
  './components/cosmic_bg.js',
  './components/solfeggio_audio.js',
  'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=Cinzel:wght@500;600;700&display=swap'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        // Fallback for offline mode, you can return a custom offline page if needed
      });
    })
  );
});
