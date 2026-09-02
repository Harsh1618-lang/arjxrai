/* SRD Learn — Service Worker (app shell + runtime caching, no build step required) */
const VERSION = "srd-v1";
const SHELL_CACHE = `${VERSION}-shell`;
const RUNTIME_CACHE = `${VERSION}-runtime`;
const IMAGE_CACHE = `${VERSION}-images`;
const MAX_IMAGES = 80;

const SHELL_URLS = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => Promise.allSettled(SHELL_URLS.map((url) => cache.add(url).catch(() => undefined)))).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

async function trimCache(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  if (keys.length > max) await Promise.all(keys.slice(0, keys.length - max).map((k) => cache.delete(k)));
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // Never cache API / auth traffic (Supabase, Google, analytics).
  if (/supabase\.(co|in)|googletagmanager|google-analytics|youtube|t\.me|accounts\.google/.test(url.host)) return;

  // Navigation: network first, fall back to cached shell (offline app shell).
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL_CACHE).then((c) => c.put("./index.html", copy)).catch(() => undefined);
          return res;
        })
        .catch(async () => (await caches.match("./index.html")) || (await caches.match("./")) || Response.error()),
    );
    return;
  }

  // Images: stale-while-revalidate with a size cap.
  if (request.destination === "image" || /images\.pexels\.com|i\.ytimg\.com/.test(url.host)) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((res) => {
            if (res.ok || res.type === "opaque") {
              cache.put(request, res.clone()).then(() => trimCache(IMAGE_CACHE, MAX_IMAGES));
            }
            return res;
          })
          .catch(() => cached);
        return cached || network;
      }),
    );
    return;
  }

  // Same-origin static assets + fonts: cache first.
  if (url.origin === self.location.origin || /fonts\.(googleapis|gstatic)\.com/.test(url.host)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(RUNTIME_CACHE).then((c) => c.put(request, copy));
            }
            return res;
          }),
      ),
    );
  }
});
