const CACHE_NAME = "gametracker-v3-fix"; // Changed name to force update
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

self.addEventListener("install", (evt) => {
  self.skipWaiting();
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener("activate", (evt) => {
  evt.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (evt) => {
  // Network First strategy to ensure you see updates
  evt.respondWith(
    fetch(evt.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(evt.request, clone));
        return res;
    }).catch(() => caches.match(evt.request))
  );
});
