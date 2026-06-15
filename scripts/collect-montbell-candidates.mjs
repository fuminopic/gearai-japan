import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const OUTPUT_JSON =
  process.argv[2] ?? path.join(os.tmpdir(), "montbell_candidate_pool.json");
const BASE_URL = "https://webshop.montbell.jp";

const queries = [
  "シームレス ダウンハガー800",
  "シームレス ダウンハガー800 Women",
  "ドライ シームレス ダウンハガー",
  "アルパイン ダウンハガー",
  "アルパイン バロウバッグ",
  "バロウバッグ",
  "寝袋",
  "バーサライトパック",
  "ガレナパック",
  "チャチャパック",
  "グラナイト パック",
  "アルパインパック",
  "アクシスパック",
  "リッジラインパック",
  "キトラパック",
  "ステラリッジ テント",
  "ムーンライト テント",
  "クロノスドーム",
  "マイティドーム",
  "ライトツェルト",
  "バックパッカーテント",
  "山岳テント",
  "ストームクルーザー",
  "サンダーパス",
  "バーサライト ジャケット",
  "バーサライト パンツ",
  "レインウォーカー",
  "ジオライン",
  "WIC.ライト",
  "スーパーメリノウール",
  "アルパインダウン パーカ",
  "プラズマ1000",
  "スペリオダウン",
  "クリマプラス",
  "シャミース",
  "ツオロミー ブーツ",
  "テナヤ ブーツ",
  "マウンテンクルーザー",
  "ロックオン",
  "トレールウォーカー",
  "アルパインクッカー",
  "アルパインクッカー ディープ",
  "チタンクッカー",
  "チタン クッカー",
  "アルパインフライパン",
  "チタン シングルマグ",
  "チタンマグ",
  "フューエルカートリッジ",
  "ガスカートリッジ",
  "ジェットボイル フューエル",
  "OD缶",
  "U.L. コンフォートシステム アルパインパッド",
  "フォームパッド",
  "スリーピングパッド",
  "ヘッドランプ",
  "チェーンスパイク",
  "メリノウール グローブ",
  "インナーグローブ",
  "トレッキングポール",
  "アルパイン カーボンポール",
  "フォールディングポール"
];

function decodeHtml(value) {
  return value
    .replace(/&#0*39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&yen;/g, "¥")
    .replace(/&reg;/g, "®")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
}

function stripTags(value) {
  return decodeHtml(String(value ?? "").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function parseCards(html, query) {
  return [
    ...html.matchAll(
      /<div class="unit"[\s\S]*?(?=<div class="unit"|<div class="controlsArea"|$)/g
    )
  ]
    .map((match) => match[0])
    .map((unit) => {
      const productId = unit.match(/product_id=(\d+)/)?.[1];
      const name = stripTags(
        unit.match(/aria-label="([^"]+)の商品詳細へ"/)?.[1] ?? ""
      );
      const imagePath = unit.match(/src="([^"]*\/common\/images\/product\/prod_s\/[^"]+)"/)?.[1];

      if (!productId || !name || !imagePath) {
        return null;
      }

      return {
        productId,
        name,
        officialUrl: `${BASE_URL}/goods/disp.php?product_id=${productId}`,
        imageUrl: imagePath.startsWith("http") ? imagePath : `${BASE_URL}${imagePath}`,
        query
      };
    })
    .filter(Boolean);
}

const byId = new Map();

for (const query of queries) {
  const url = `${BASE_URL}/goods/list_search.php?top_sk=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    headers: {
      "user-agent": "Yamajitaku catalog verifier; official mont-bell import"
    }
  });

  if (!response.ok) {
    throw new Error(`GET ${url} failed: ${response.status}`);
  }

  const html = await response.text();
  const cards = parseCards(html, query);

  for (const card of cards) {
    if (!byId.has(card.productId)) {
      byId.set(card.productId, card);
    }
  }

  console.log(`${String(cards.length).padStart(3, " ")} ${query}`);
  await new Promise((resolve) => setTimeout(resolve, 200));
}

const candidates = [...byId.values()].sort((a, b) =>
  a.name.localeCompare(b.name, "ja")
);

fs.writeFileSync(OUTPUT_JSON, `${JSON.stringify(candidates, null, 2)}\n`);

console.log(`unique ${candidates.length}`);
