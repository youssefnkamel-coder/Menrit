// Lets phones install the app. Always tries the network first so every update reaches people at once;
// the saved copy is only used when there is no internet. Data never goes through here (it lives on the server).
const CACHE = "menrit-v2";
self.addEventListener("install", e => { self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(self.clients.claim()); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => {
    if (r.ok) { const c = r.clone(); caches.open(CACHE).then(k => k.put(e.request, c)); }
    return r;
  }).catch(() => caches.match(e.request).then(r => r || caches.match("./"))));
});
