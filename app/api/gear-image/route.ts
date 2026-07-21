import { NextResponse } from "next/server";

// ギア写真の画像プロキシ。
//
// マイパックの共有画像は canvas にギア写真を描くが、カタログ商品の画像は
// 各メーカーの外部CDN(CORSヘッダー無し)にあり、直接 canvas に描くと
// 画布が汚染されて書き出せない。ここでサーバー側が取得し、自オリジンで
// 返すことで、canvas から見て同一オリジンになり汚染しない。
//
// SSRF対策: 取得先は「DBに実際に入っている画像ホスト」だけの許可リストに
// 限定する。それ以外のホストや http、内部アドレスは弾く。

// カタログ商品画像のホスト(supabase/migrations の image_url から採取)。
const ALLOWED_IMAGE_HOSTS = new Set<string>([
  "caravan.itembox.cloud",
  "cdn.shopify.com",
  "cdns3.yamatomichi.com",
  "edge.dis.commercecloud.salesforce.com",
  "image.rakuten.co.jp",
  "itemimg.goldwin.co.jp",
  "mammt.store-image.jp",
  "milletonline.itembox.cloud",
  "res.garmin.com",
  "soto.shinfuji.co.jp",
  "webshop.montbell.jp",
  "www.columbiasports.co.jp",
  "www.finetrack.com",
  "www.isuka.co.jp",
  "www.lostarrow.co.jp"
]);

// ユーザーがアップロードした写真は Supabase Storage の署名付きURL。
// ホストは環境変数から動的に許可する(プロジェクトごとに違うため)。
function isSupabaseStorageHost(hostname: string): boolean {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) {
    return false;
  }
  try {
    return new URL(base).hostname === hostname;
  } catch {
    return false;
  }
}

function isAllowed(target: URL): boolean {
  if (target.protocol !== "https:") {
    return false;
  }
  return ALLOWED_IMAGE_HOSTS.has(target.hostname) || isSupabaseStorageHost(target.hostname);
}

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("url");

  if (!raw) {
    return NextResponse.json({ error: "missing url" }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }

  if (!isAllowed(target)) {
    return NextResponse.json({ error: "host not allowed" }, { status: 403 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(target.toString(), {
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
      headers: { Accept: "image/*" }
    });
  } catch {
    return NextResponse.json({ error: "fetch failed" }, { status: 502 });
  }

  const contentType = upstream.headers.get("content-type") ?? "";
  if (!upstream.ok || !contentType.startsWith("image/")) {
    return NextResponse.json({ error: "not an image" }, { status: 502 });
  }

  const body = await upstream.arrayBuffer();

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600"
    }
  });
}
