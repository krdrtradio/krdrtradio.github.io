
/* =========================
   RADIO OS PWA SW
========================= */

const CACHE_NAME = "radio-os-v1";

const ASSETS = [
    "./",
    "./index.html",
    "./manifest.json"
];

/* INSTALL */

self.addEventListener("install", e => {

    e.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => cache.addAll(ASSETS))
    );

    self.skipWaiting();
});

/* ACTIVATE */

self.addEventListener("activate", e => {

    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.map(k => {
                    if(k !== CACHE_NAME) return caches.delete(k);
                })
            )
        )
    );

    self.clients.claim();
});

/* FETCH STRATEGY */

self.addEventListener("fetch", e => {

    const url = e.request.url;

    // STREAMS: always network
    if(url.includes(".m3u8") || url.includes("stream")){
        return;
    }

    e.respondWith(
        fetch(e.request)
        .then(res => {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(cache=>{
                cache.put(e.request, clone);
            });
            return res;
        })
        .catch(() => caches.match(e.request))
    );
});
