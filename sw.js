// Service Worker for GeoSurvey Pro Android Field Application
const CACHE_NAME = 'landsurveyor-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './assets/icon.svg',
  './css/styles.css',
  './css/aim.css',
  './css/cad.css',
  './css/fieldbook.css',
  './js/sample-data.js',
  './js/audio.js',
  './js/points.js',
  './js/cad-engine.js',
  './js/dxf.js',
  './js/fieldbook.js',
  './js/jobs.js',
  './js/aim-chat.js',
  './js/app.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
