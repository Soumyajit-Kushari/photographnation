var CACHE_NAME = 'shell-content-V16';
var cacheList = ['shell-content-V16'];

var filesToCache = [
  'https://fonts.gstatic.com/s/materialicons/v37/flUhRq6tzZclQEJ-Vdg-IuiaDsNc.woff2',
  'https://fonts.gstatic.com/s/materialicons/v37/flUhRq6tzZclQEJ-Vdg-IuiaDsNc.woff2',
  'https://res.cloudinary.com/daxfhtkqw/image/upload/c_scale,q_65/v1526622456/bg.jpg',
  '/css/inline.css',
  '/images/icons/icon-128x128.png',
  '/images/icons/icon-192x192.png',
  '/images/icons/icon-256x256.png',
  '/images/icons/icon-512x512.png',
  '/js/app.js',
  '/js/customElements.js',
  '/index.html',
  '/manifest.json',
  '/view.html',
  '/',
];

function fetchandcache(url) {
  return fetch(url).then(function (response) {

    var clone = response.clone();

    if (clone.url.match(/jpg|png|jpeg|gif|css/i) != null) {
      caches.open(CACHE_NAME).then(function (cache) {
        cache.put(url, clone);
      })
    }

    return response;

  }).catch(function (err) {
    console.log("Could not load page: " + err);
  })
}

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) {
        return cache.addAll(filesToCache);
      }).then(function () {
        return self.skipWaiting();
      }).catch(function (err) {
        console.log(err);
      })
  );
});


self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(
      function (cacheNames) {
        return Promise.all(
          cacheNames.map(
            function (cacheName) {
              if (cacheList.indexOf(cacheName) === -1) {
                return caches.delete(cacheName)
              }
            })
        )
      }).catch(function (err) {
        console.log(err);
      })
  );
  return self.clients.claim();
});


self.addEventListener('fetch', function (event) {
  event.respondWith(
    caches.match(event.request)
      .then(function (response) {
        return response || fetchandcache(event.request);
      })
  );
});

// Notifications