self.addEventListener('install', (e) => {
  self.skipWaiting(); // Force this new SW to become active
});

self.addEventListener('activate', (e) => {
  // Immediately unregister itself to kill the PWA cache
  self.registration.unregister()
    .then(() => self.clients.matchAll())
    .then((clients) => {
      clients.forEach(client => client.navigate(client.url)); // Force reload page
    });
});
