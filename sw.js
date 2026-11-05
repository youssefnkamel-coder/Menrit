// Lets phones install the app. Always tries the network first so every update reaches people at once;
// the saved copy is only used when there is no internet. Data never goes through here (it lives on the server).
const CACHE = "menrit-v3";
self.addEventListener("install", e => { self.skipWaiting(); });
// older copies (an earlier CACHE name) are removed, so the phone never fills up with old versions
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  // one saved copy per file: the church link (?c=…) does not make a new copy each time
  const key = u.origin + u.pathname;
  e.respondWith(fetch(e.request).then(r => {
    if (r.ok) { const c = r.clone(); caches.open(CACHE).then(k => k.put(key, c)); }
    return r;
  }).catch(() => caches.match(key).then(r => r || caches.match(new URL("./", self.registration.scope).href))));
});
// a new confession / visit request reaches أبونا's phone even when the app is closed
self.addEventListener("push", e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch(x){ d = {body: e.data ? e.data.text() : ""}; }
  e.waitUntil(self.registration.showNotification(d.title || "ⲙⲉⲛⲣⲓⲧ", {
    body: d.body || "فيه طلب جديد", icon: "icon-192.png", badge: "icon-192.png", tag: d.tag || "menrit", renotify: true,
    dir: "rtl", lang: "ar", data: {url: d.url || "./"}
  }));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || "./", self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({type: "window", includeUncontrolled: true}).then(list => {
    for (const c of list) if (new URL(c.url).origin === new URL(url).origin && "focus" in c){ c.navigate(url).catch(()=>{}); return c.focus(); }
    return self.clients.openWindow(url);
  }));
});
