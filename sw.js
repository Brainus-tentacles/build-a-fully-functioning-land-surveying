// Service Worker for GeoSurvey Pro Land Surveying Suite (Android, iPhone & PC Workstation)
const CACHE_NAME = 'landsurveyor-v5';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './android.html',
  './iphone.html',
  './desktop.html',
  './downloads.html',
  './manifest.json',
  './assets/icon.svg',
  './assets/logo.png',
  './assets/logo.jpg',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/favicon-32.png',
  './assets/favicon-48.png',
  './css/styles.css',
  './css/aim.css',
  './css/cad.css',
  './css/fieldbook.css',
  './css/platforms.css',
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
