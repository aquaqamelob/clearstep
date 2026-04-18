// ClearStep service worker
// Minimal, safe-by-default: precache the shell, network-first for navigations,
// network-first for build artifacts (which have content-hashed names anyway).
// We deliberately do NOT cache /api/* — chat answers must always be fresh.

const VERSION = "v3";
const APP_CACHE = `clearstep-${VERSION}`;
const PRECACHE = ["/manifest.webmanifest", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(APP_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith("clearstep-") && k !== APP_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never cache the API or RSC payloads — must be fresh.
  if (url.pathname.startsWith("/api/")) return;
  if (url.pathname.startsWith("/_next/data/")) return;

  // Build artifacts: always go to network. Their filenames are content-hashed
  // so a stale cached chunk from a previous build is *worse* than a miss.
  if (url.pathname.startsWith("/_next/")) {
    event.respondWith(fetch(request).catch(() => caches.match(request)));
    return;
  }

  // Navigations: network-first, fall back to cached "/" only when offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches
            .open(APP_CACHE)
            .then((cache) => cache.put(request, copy))
            .catch(() => {});
          return res;
        })
        .catch(() => caches.match(request).then((m) => m || caches.match("/")))
    );
    return;
  }

  // Static images / icons: cache-first.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((res) => {
        if (!res || res.status !== 200 || res.type === "opaque") return res;
        const copy = res.clone();
        caches
          .open(APP_CACHE)
          .then((cache) => cache.put(request, copy))
          .catch(() => {});
        return res;
      });
    })
  );
});
