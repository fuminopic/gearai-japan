/*
 * 山支度 Service Worker —— 缓存静态资源与公开目录图片。
 * 策略(保守、自愈):
 *  - /_next/static、/fonts、图片/字体 → cache-first(内容带 hash,不可变)。
 *  - 用户数据页面(例如 /dashboard)不缓存 HTML,确保每次导航都走网络拿最新服务端数据。
 *  - 跨域的目录商品图(montbell/北面/gregory 等官网图) → cache-first,且带数量上限。
 *    注意:不缓存 Supabase 存储域名(*.supabase.co)的图片,因为那些是用户私有装备照片的
 *    签名 URL,1 小时后会过期,缓存了反而会导致图片"过期变灰图"。
 *  - 其它一律不拦截,走浏览器默认(保证 /auth/callback、API、登录等始终最新)。
 *  - 只缓存 GET、状态 200(或跨域的 opaque 响应)、非重定向的响应。
 * 风险控制:bumped CACHE_VERSION 即整体失效重建;fetch handler 全程 try/catch,异常一律回退网络。
 */
const CACHE_VERSION = "v2";
const STATIC_CACHE = `yj-static-${CACHE_VERSION}`;
const PAGE_CACHE = `yj-pages-${CACHE_VERSION}`;
const IMAGE_CACHE = `yj-images-${CACHE_VERSION}`;
const PAGE_CACHE_PATHS = [];
const MAX_IMAGE_CACHE_ENTRIES = 300;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(
            (k) => k !== STATIC_CACHE && k !== PAGE_CACHE && k !== IMAGE_CACHE
          )
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

function isSupabaseStorageHost(hostname) {
  // Supabase 项目域名固定形如 xxxx.supabase.co,私有装备图的签名 URL 都在这个域下,
  // 且带时效(1 小时),绝不能长期缓存。
  return hostname.endsWith(".supabase.co");
}

function looksLikeImage(pathname) {
  return /\.(?:png|jpe?g|gif|webp|avif|svg)$/i.test(pathname);
}

async function trimImageCache(cache) {
  const keys = await cache.keys();
  if (keys.length < MAX_IMAGE_CACHE_ENTRIES) return;
  // Cache API 的 keys() 大致按写入顺序返回,删除最早的一批给新图片腾位置,
  // 避免图片缓存无限膨胀。
  const overflow = keys.length - MAX_IMAGE_CACHE_ENTRIES + 1;
  await Promise.all(keys.slice(0, overflow).map((key) => cache.delete(key)));
}

async function cacheFirstCrossOriginImage(request) {
  try {
    const cache = await caches.open(IMAGE_CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;

    // 跨域图片大多没有 CORS 头,只能用 no-cors 拿到 opaque 响应;
    // opaque 响应读不到 status,但依然可以被 Cache API 缓存和复用。
    const res = await fetch(request, { mode: "no-cors" });
    await trimImageCache(cache);
    cache.put(request, res.clone());
    return res;
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

  if (url.origin === self.location.origin) {
    if (isImmutableAsset(url)) {
      event.respondWith(cacheFirst(request));
      return;
    }

    if (request.mode === "navigate" && PAGE_CACHE_PATHS.includes(url.pathname)) {
      event.respondWith(staleWhileRevalidate(request));
    }
    return;
  }

  // 跨域请求:只缓存目录商品图,且明确排除 Supabase 私有签名 URL。
  if (looksLikeImage(url.pathname) && !isSupabaseStorageHost(url.hostname)) {
    event.respondWith(cacheFirstCrossOriginImage(request));
  }
});
