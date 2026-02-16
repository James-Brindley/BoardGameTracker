const CACHE_NAME = "gametracker-v1";
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

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request))
  );
});
