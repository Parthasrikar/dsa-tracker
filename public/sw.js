self.addEventListener('install', (event) => {
    console.log('Service Worker installed');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker activated');
});

self.addEventListener('fetch', (event) => {
    // Simple pass-through fetch handler to satisfy PWA requirements
    event.respondWith(fetch(event.request));
});
