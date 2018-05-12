var cacheName = 'shell-content';
var cacheList = ['shell-content'];

var filesToCache = [
  'https://fonts.gstatic.com/s/materialicons/v37/flUhRq6tzZclQEJ-Vdg-IuiaDsNc.woff2',
  'https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu72xKOzY.woff2',
  'https://fonts.googleapis.com/css?family=Roboto',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  '/css/inline.css',
  '/img/icons/icon-128x128.png',
  '/img/icons/icon-256x256.png',
  '/js/app.js',
  '/index.html',
  '/manifest.json',
  '/',
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(cacheName)
      .then(function(cache) {
        return cache.addAll(filesToCache);
      })
  );
});


self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheList.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});