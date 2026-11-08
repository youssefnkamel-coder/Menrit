// Lets phones install the app. Tries the network first so every update reaches people at once;
// the saved copy is used when there is no internet, or when the internet takes more than 2.5 seconds. Data never goes through here (it lives on the server).
const CACHE = "menrit-v4";
self.addEventListener("install", e => { self.skipWaiting(); });
// older copies (an earlier CACHE name) are removed, so the phone never fills up with old versions
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  // one saved copy per file: the church link (?c=…) does not make a new copy each time
  const key = u.origin + u.pathname;
  const saved = () => caches.match(key).then(r => r || caches.match(new URL("./", self.registration.scope).href));
  const net = fetch(e.request).then(r => {
    if (r.ok) { const c = r.clone(); caches.open(CACHE).then(k => k.put(key, c)); }
    return r;
  });
  // on a slow internet the saved copy opens after 2.5 seconds; the new copy is still saved for the next opening (2026-11-07)
  e.respondWith(new Promise(ok => {
    let done = false; const give = r => { if (!done && r){ done = true; ok(r); } };
    const t = setTimeout(() => saved().then(give), 2500);
    net.then(r => { clearTimeout(t); give(r); }, () => { clearTimeout(t); saved().then(r => r ? give(r) : net.catch(() => Response.error()).then(give)); });
  }));
  e.waitUntil(net.catch(() => {}));
});
// a new confession / visit request reaches أبونا's phone even when the app is closed
self.addEventListener("push", e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch(x){ d = {body: e.data ? e.data.text() : ""}; }
  e.waitUntil(self.registration.showNotification(d.title || "ⲙⲉⲛⲣⲓⲧ", {
    // an attention-getting notification of the app's own (2026-11-08, user): its own vibration, it stays until tapped,
    // and the cross badge in the status bar. Phones do not let a web app choose the sound itself.
    body: d.body || "فيه طلب جديد", icon: "icon-192.png", badge: "badge-96.png", tag: d.tag || "menrit", renotify: true,
    vibrate: [400, 150, 400, 150, 800], requireInteraction: true, timestamp: Date.now(),
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
