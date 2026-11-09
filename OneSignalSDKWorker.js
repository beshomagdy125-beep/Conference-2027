importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// Offline support: keep the app and its libraries so it opens even with a weak connection.
const CACHE = "conf-v9";
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(["./", "index.html", "manifest.json", "icon-192.png"]).catch(() => {})).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x !== CACHE).map((x) => caches.delete(x)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const r = e.request;
  if (r.method !== "GET" || !/^https?:/.test(r.url)) return;
  if (/firestore\.googleapis\.com|identitytoolkit|securetoken|api\.onesignal|onesignal\.com\/api/.test(r.url)) return; // live data is never cached here
  const net = fetch(r).then((res) => {
    if (res && (res.ok || res.type === "opaque")) { const c = res.clone(); caches.open(CACHE).then((x) => x.put(r, c)); }
    return res;
  });
  e.respondWith(
    Promise.race([net, new Promise((_, rej) => setTimeout(rej, 4000))]).catch(() =>
      caches.match(r, { ignoreSearch: true }).then((m) => m || (r.mode === "navigate" ? caches.match("index.html") : null) || net)
    )
  );
});
