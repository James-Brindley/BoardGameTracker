const CACHE_NAME = "gametracker-v2"; // Updated to V2 to bust the cache!
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
  self.skipWaiting();
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
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(evt.request, resClone);
        });
        return res;
      })
      .catch(() => {
        return caches.match(evt.request);
      })
  );
});
