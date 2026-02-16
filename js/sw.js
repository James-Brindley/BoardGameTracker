const CACHE_NAME = "gametracker-dev-v2";
const ASSETS = [
  "/",
  "/index.html",
  "/catalogue.html",
  "/game.html",
  "/settings.html",
  "/login.html",
  "/css/style.css",
  "/js/theme.js",
  "/js/data.js",
  "/js/catalogue.js",
  "/js/game.js",
  "/js/stats.js",
  "/js/supabaseClient.js"
];

// 1. Install Service Worker
self.addEventListener("install", (evt) => {
  self.skipWaiting(); // Activate immediately
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// 2. Activate & Clean up old caches
self.addEventListener("activate", (evt) => {
  evt.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// 3. Fetch (Network First, then Cache)
self.addEventListener("fetch", (evt) => {
  evt.respondWith(
    fetch(evt.request)
      .then((res) => {
        // Update cache with new version
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(evt.request, resClone);
        });
        return res;
      })
      .catch(() => {
        // If offline, use cache
        return caches.match(evt.request);
      })
  );
});
