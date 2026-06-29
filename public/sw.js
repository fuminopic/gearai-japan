/*
 * 山支度 Service Worker —— 让 reopen 秒显首页。
 * 策略(保守、自愈):
 *  - /_next/static、/fonts、图片/字体 → cache-first(内容带 hash,不可变)。
 *  - /dashboard 导航 → stale-while-revalidate(先返回缓存的首页=秒显,后台拉新更新缓存)。
 *  - 其它一律不拦截,走浏览器默认(保证 /auth/callback、API、登录等始终最新)。
 *  - 只缓存 GET、同源、状态 200、非重定向的响应。
 * 风险控制:bumped CACHE_VERSION 即整体失效重建;fetch handler 全程 try/catch,异常一律回退网络。
 */
const CACHE_VERSION = "v1";
const STATIC_CACHE = `yj-static-${CACHE_VERSION}`;
const PAGE_CACHE = `yj-pages-${CACHE_VERSION}`;
const PAGE_CACHE_PATHS = ["/dashboard"];

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== PAGE_CACHE)
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  // 退出登录时让 App postMessage("yj-clear-pages") 清掉首页缓存,避免串号/过期态
  if (event.data === "yj-clear-pages") {
    caches.delete(PAGE_CACHE);
  }
});

function isImmutableAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/fonts/") ||
    /\.(?:woff2?|png|jpg|jpeg|gif|webp|svg|ico)$/.test(url.pathname)
  );
}

async function cacheFirst(request) {
  try {
    const cache = await caches.open(STATIC_CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;
    const res = await fetch(request);
    if (res && res.ok && res.status === 200) {
      cache.put(request, res.clone());
    }
    return res;
  } catch (e) {
    return fetch(request);
  }
}

async function staleWhileRevalidate(request) {
  try {
    const cache = await caches.open(PAGE_CACHE);
    const cached = await cache.match(request);
    const network = fetch(request)
      .then((res) => {
        // 只缓存正常 200、非重定向的 HTML(避免缓存登录跳转/错误页)
        if (res && res.ok && res.status === 200 && !res.redirected) {
          cache.put(request, res.clone());
        }
        return res;
      })
      .catch(() => cached);
    return cached || network;
  } catch (e) {
    return fetch(request);
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch (e) {
    return;
  }
  if (url.origin !== self.location.origin) return;

  if (isImmutableAsset(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (request.mode === "navigate" && PAGE_CACHE_PATHS.includes(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
