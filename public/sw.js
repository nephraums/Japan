const CACHE_PREFIX = "japan-2026";
const CACHE_VERSION = "v1";
const PAGE_CACHE = `${CACHE_PREFIX}-pages-${CACHE_VERSION}`;
const ASSET_CACHE = `${CACHE_PREFIX}-assets-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline";

const START_ASSETS = [
  OFFLINE_URL,
  "/japan-sun.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon.png",
];

function pageKey(url) {
  const parsed = new URL(url, self.location.origin);
  parsed.hash = "";
  return new Request(parsed.toString(), { method: "GET" });
}

function isLoginResponse(response) {
  return response.redirected && new URL(response.url).pathname === "/login";
}

async function cacheLinkedAssets(response) {
  const html = await response.clone().text();
  const matches = [...html.matchAll(/(?:src|href)=["']([^"']*\/_next\/static\/[^"']+)["']/g)];
  const urls = [...new Set(matches.map((match) => new URL(match[1], self.location.origin).toString()))];
  const cache = await caches.open(ASSET_CACHE);
  await Promise.allSettled(urls.map(async (url) => {
    if (await cache.match(url)) return;
    const asset = await fetch(url, { cache: "no-cache" });
    if (asset.ok) await cache.put(url, asset);
  }));
}

async function fetchAndCachePage(url) {
  const response = await fetch(url, {
    cache: "no-store",
    credentials: "include",
    headers: { Accept: "text/html", "X-PWA-Warm": "1" },
  });
  if (!response.ok || isLoginResponse(response)) return;
  const cache = await caches.open(PAGE_CACHE);
  await Promise.all([
    cache.put(pageKey(url), response.clone()),
    cacheLinkedAssets(response),
  ]);
}

async function networkFirstPage(request, event) {
  try {
    const response = await fetch(request);
    if (response.ok && !isLoginResponse(response) && new URL(request.url).pathname !== "/login") {
      const pageResponse = response.clone();
      const assetResponse = response.clone();
      event.waitUntil((async () => {
        const cache = await caches.open(PAGE_CACHE);
        await Promise.all([
          cache.put(pageKey(request.url), pageResponse),
          cacheLinkedAssets(assetResponse),
        ]);
      })());
    }
    return response;
  } catch {
    return (await caches.match(pageKey(request.url))) || (await caches.match(OFFLINE_URL));
  }
}

async function cacheFirstAsset(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(ASSET_CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(ASSET_CACHE).then((cache) => cache.addAll(START_ASSETS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(Promise.all([
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && ![PAGE_CACHE, ASSET_CACHE].includes(key)).map((key) => caches.delete(key)))),
    self.clients.claim(),
  ]));
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
  if (event.data?.type === "CLEAR_CACHES") {
    event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX)).map((key) => caches.delete(key)))));
  }
  if (event.data?.type === "CACHE_TRIP" && Array.isArray(event.data.urls)) {
    event.waitUntil(Promise.allSettled(event.data.urls.map((url) => fetchAndCachePage(new URL(url, self.location.origin).toString()))));
  }
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(request, event));
    return;
  }
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/") || url.pathname.endsWith(".svg")) {
    event.respondWith(cacheFirstAsset(request));
  }
});
