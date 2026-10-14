/* 20 Minutes / Half Plan — offline shell. Build 20261014-162647 */
var CACHE = 'halfplan-20261014-162647';
var ASSETS = ['./', './index.html'];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) {
        return k !== CACHE;
      }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* NETWORK-FIRST. Freshness beats speed here: a stale training plan is worse than a
   slow one, and the page is ~95 KB. Falls back to cache the moment the network
   fails, so the gym with no signal still works. (v1 was stale-while-revalidate,
   which served yesterday's plan on every first load — not what you want.) */
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(function (res) {
      if (res && res.status === 200) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
      }
      return res;
    }).catch(function () {
      return caches.match(e.request).then(function (hit) {
        return hit || caches.match('./index.html');
      });
    })
  );
});
