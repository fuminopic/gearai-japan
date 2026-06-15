import fs from "node:fs";
import crypto from "node:crypto";
import os from "node:os";
import path from "node:path";

const INPUT_CSV =
  process.argv[2] ?? "montbell_100_products.csv";
const OUTPUT_JSON =
  process.argv[3] ?? path.join(os.tmpdir(), "montbell_official_matches.json");
const CACHE_DIR = path.join(os.tmpdir(), "montbell-official-cache");
const BASE_URL = "https://webshop.montbell.jp";

fs.mkdirSync(CACHE_DIR, { recursive: true });

function parseCsv(filePath) {
  const source = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  const lines = source.trim().split(/\r?\n/);
  const headers = lines[0].split(",");

  return lines.slice(1).map((line, index) => {
    const values = line.split(",");
    return Object.fromEntries([
      ["row_number", index + 1],
      ...headers.map((header, headerIndex) => [header, values[headerIndex] ?? ""])
    ]);
  });
}

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
  return decodeHtml(value.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function normalize(value) {
  return stripTags(String(value ?? ""))
    .normalize("NFKC")
    .toLowerCase()
    .replace(/women['’]s/g, "womens")
    .replace(/men['’]s/g, "mens")
    .replace(/u\.l\./g, "ul")
    .replace(/[®™]/g, "")
    .replace(/[・･]/g, "")
    .replace(/[（）()[\]#＃.,、。:：/／\\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compact(value) {
  return normalize(value).replace(/\s+/g, "");
}

function cacheFileFor(url) {
  const safe = crypto.createHash("sha256").update(url).digest("hex");
  return path.join(CACHE_DIR, `${safe}.html`);
}

async function fetchText(url) {
  const cacheFile = cacheFileFor(url);

  if (fs.existsSync(cacheFile)) {
    return fs.readFileSync(cacheFile, "utf8");
  }

  const response = await fetch(url, {
    headers: {
      "user-agent": "Yamajitaku catalog verifier; official product data import"
    }
  });

  if (!response.ok) {
    throw new Error(`GET ${url} failed: ${response.status}`);
  }

  const text = await response.text();
  fs.writeFileSync(cacheFile, text);
  await new Promise((resolve) => setTimeout(resolve, 250));
  return text;
}

function parseCards(html) {
  const units = [
    ...html.matchAll(
      /<div class="unit"[\s\S]*?(?=<div class="unit"|<div class="controlsArea"|<\/div>\s*<!-- \/#goodsList|$)/g
    )
  ].map((match) => match[0]);

  const cards = [];

  for (const unit of units) {
    const productId = unit.match(/product_id=(\d+)/)?.[1];
    const rawName =
      unit.match(/aria-label="([^"]+)の商品詳細へ"/)?.[1] ??
      unit.match(/<h3[^>]*>([\s\S]*?)<\/h3>/)?.[1];
    const rawImage = unit.match(/<img[^>]+src="([^"]*\/common\/images\/product\/prod_s\/[^"]+)"/)?.[1];

    if (!productId || !rawName || !rawImage) {
      continue;
    }

    const name = stripTags(rawName);
    const imageUrl = rawImage.startsWith("http") ? rawImage : `${BASE_URL}${rawImage}`;
    const officialUrl = `${BASE_URL}/goods/disp.php?product_id=${productId}`;

    cards.push({ productId, name, imageUrl, officialUrl });
  }

  return cards;
}

function numberMarkers(value) {
  const text = String(value ?? "").normalize("NFKC");
  return [
    ...text.matchAll(/#\s*(\d+)/g),
    ...text.matchAll(/(\d+)\s*型/g),
    ...text.matchAll(/\b(\d+)\b/g)
  ].map((match) => match[1]);
}

function hasGenderMismatch(row, candidateName) {
  const target = normalize(`${row.model} ${row.name_ja}`);
  const candidate = normalize(candidateName);
  const wantsWomen = target.includes("womens");
  const candidateWomen = candidate.includes("womens") || candidate.includes("women");

  if (wantsWomen) {
    return !candidateWomen;
  }

  return candidateWomen;
}

const familyHints = [
  ["ダウンハガー800", ["ダウンハガー800"]],
  ["バロウバッグ", ["バロウバッグ"]],
  ["ブリーズドライテック", ["ブリーズドライテック"]],
  ["スパイラルダウンハガー", ["スパイラル", "ダウンハガー"]],
  ["アルパインダウンハガー", ["アルパイン", "ダウンハガー"]],
  ["バーサライトパック", ["バーサライト", "パック"]],
  ["ガレナパック", ["ガレナ", "パック"]],
  ["チャチャパック", ["チャチャ", "パック"]],
  ["グラナイトパック", ["グラナイト", "パック"]],
  ["アルパインパック", ["アルパイン", "パック"]],
  ["アクシスパック", ["アクシス", "パック"]],
  ["ステラリッジ", ["ステラリッジ"]],
  ["ムーンライト", ["ムーンライト"]],
  ["クロノスドーム", ["クロノスドーム"]],
  ["ライトツェルト", ["ライトツェルト"]],
  ["バックパッカーテント", ["バックパッカーテント"]],
  ["ストームクルーザー", ["ストームクルーザー"]],
  ["サンダーパス", ["サンダーパス"]],
  ["バーサライト レイン", ["バーサライト", "レイン"]],
  ["レインウォーカー", ["レインウォーカー"]],
  ["ジオライン", ["ジオライン"]],
  ["WIC.ライト", ["wic", "ライト"]],
  ["スーパーメリノウール", ["スーパーメリノウール"]],
  ["アルパイン ダウンパーカ", ["アルパイン", "ダウンパーカ"]],
  ["プラズマ1000", ["プラズマ1000"]],
  ["EX ダウンパーカ", ["ex", "ダウンパーカ"]],
  ["スペリオダウン", ["スペリオダウン"]],
  ["クリマプラス200", ["クリマプラス200"]],
  ["クリマプラス100", ["クリマプラス100"]],
  ["ツオロミーブーツ", ["ツオロミー"]],
  ["テナヤブーツ", ["テナヤ"]],
  ["ロックオンブーツ", ["ロックオン"]],
  ["トレイルグリッパー", ["トレイルグリッパー"]],
  ["アルパインクッカー", ["アルパインクッカー"]],
  ["チタンクッカー", ["チタンクッカー"]],
  ["アルパインフライパン", ["アルパインフライパン"]],
  ["チタンシングルマグ", ["チタン", "シングル", "マグ"]],
  ["コンフォートシステムパッド", ["コンフォートシステム", "パッド"]],
  ["フォームパッド", ["フォームパッド"]],
  ["ヘッドランプ", ["ヘッドランプ"]],
  ["アルパインガス", ["アルパインガス"]],
  ["ウルトラアルパインガス", ["ウルトラアルパインガス"]],
  ["チェーンスパイク", ["チェーンスパイク"]],
  ["メリノウール インナーグローブ", ["メリノウール", "インナーグローブ"]],
  ["トレッキングポール", ["トレッキングポール"]]
];

function scoreCandidate(row, candidate) {
  if (hasGenderMismatch(row, candidate.name)) {
    return -1000;
  }

  const targetName = normalize(row.name_ja);
  const targetModel = normalize(row.model);
  const targetCompact = compact(`${row.name_ja} ${row.model}`);
  const candidateName = normalize(candidate.name);
  const candidateCompact = compact(candidate.name);
  let score = 0;

  if (candidateCompact === compact(row.name_ja)) {
    score += 140;
  }

  if (candidateCompact.includes(compact(row.name_ja))) {
    score += 90;
  }

  if (targetCompact.includes(candidateCompact)) {
    score += 35;
  }

  const modelWords = targetModel.split(" ").filter((word) => word.length >= 2);
  for (const word of modelWords) {
    if (candidateName.includes(word)) {
      score += 8;
    }
  }

  for (const [key, hints] of familyHints) {
    if (compact(row.name_ja).includes(compact(key)) || compact(row.model).includes(compact(key))) {
      for (const hint of hints) {
        if (candidateName.includes(normalize(hint))) {
          score += 28;
        }
      }
    }
  }

  const targetMarkers = new Set(numberMarkers(`${row.name_ja} ${row.model}`));
  const candidateMarkers = new Set(numberMarkers(candidate.name));
  for (const marker of targetMarkers) {
    if (candidateMarkers.has(marker)) {
      score += 45;
    }
  }

  if (targetName.includes("ジャケット") && candidateName.includes("ジャケット")) score += 25;
  if (targetName.includes("パンツ") && candidateName.includes("パンツ")) score += 25;
  if (targetName.includes("パーカ") && candidateName.includes("パーカ")) score += 25;
  if (targetName.includes("タイツ") && candidateName.includes("タイツ")) score += 25;
  if (targetName.includes("ブーツ") && candidateName.includes("ブーツ")) score += 25;
  if (targetName.includes("パック") && candidateName.includes("パック")) score += 25;
  if (targetName.includes("テント") && candidateName.includes("テント")) score += 25;

  if (/us | kids|ジュニア|ベビー|ドッグ|キッズ/.test(candidateName)) {
    score -= 80;
  }

  return score;
}

function queriesFor(row) {
  const values = new Set();
  const name = row.name_ja.trim();
  const model = row.model.trim();
  const withoutGender = name.replace(/\s*Women'?s$/i, "").trim();

  values.add(name);
  values.add(withoutGender);
  values.add(model);

  const replacements = [
    [withoutGender.replace(/^ダウンハガー800/, "シームレス ダウンハガー800")],
    [withoutGender.replace(/^バロウバッグ/, "シームレス バロウバッグ")],
    [withoutGender.replace(/^アルパインダウンハガー/, "アルパイン ダウンハガー")],
    [withoutGender.replace(/^シームレスダウンハガー/, "シームレス ダウンハガー")],
    [withoutGender.replace(/^ULコンフォートシステムパッド/, "U.L. コンフォートシステム パッド")],
    [withoutGender.replace(/^WIC\.ライト/, "WIC.ライト")],
    [withoutGender.replace(/^チタンシングルマグ/, "チタン シングルマグ")],
    [withoutGender.replace(/^アルパインクッカー/, "アルパインクッカー")],
    [withoutGender.replace(/^アルパインフライパン/, "アルパインフライパン")]
  ];

  for (const [candidate] of replacements) {
    if (candidate && candidate !== withoutGender) {
      values.add(candidate);
    }
  }

  return [...values].filter(Boolean).slice(0, 8);
}

async function search(row) {
  const candidatesById = new Map();
  const queries = queriesFor(row);

  for (const query of queries) {
    const url = `${BASE_URL}/goods/list_search.php?top_sk=${encodeURIComponent(query)}`;
    const html = await fetchText(url);
    const cards = parseCards(html);

    for (const card of cards) {
      const existing = candidatesById.get(card.productId);
      const scored = { ...card, query, score: scoreCandidate(row, card) };

      if (!existing || scored.score > existing.score) {
        candidatesById.set(card.productId, scored);
      }
    }
  }

  return [...candidatesById.values()].sort((a, b) => b.score - a.score);
}

function parseDetail(html, fallback) {
  const title =
    html.match(/<title>\s*モンベル\s*｜\s*オンラインストア\s*｜\s*([\s\S]*?)<\/title>/)?.[1] ??
    fallback.name;
  const price = html.match(/&yen;([\d,]+)（税込）/)?.[1]?.replace(/,/g, "");
  const weight =
    html.match(/【重量】\s*([\d,]+)g/)?.[1]?.replace(/,/g, "") ??
    html.match(/【総重量】\s*([\d,]+)g/)?.[1]?.replace(/,/g, "");
  const size = html.match(/【サイズ】\s*([\s\S]*?)(?:<br\s*\/?>|【)/)?.[1];
  const capacity = html.match(/【容量】\s*([\s\S]*?)(?:<br\s*\/?>|【)/)?.[1];
  const storageSize = html.match(/【収納サイズ】\s*([\s\S]*?)(?:<br\s*\/?>|【)/)?.[1];
  const material = html.match(/【素材】\s*([\s\S]*?)(?:<br\s*\/?>|【)/)?.[1];

  return {
    official_name: stripTags(title),
    msrp_jpy: price ? Number(price) : null,
    official_weight_grams: weight ? Number(weight) : null,
    size: size ? stripTags(size) : null,
    capacity: capacity ? stripTags(capacity) : null,
    volume: storageSize ? stripTags(storageSize) : null,
    material: material ? stripTags(material) : null
  };
}

const rows = parseCsv(INPUT_CSV);
const results = [];

for (const row of rows) {
  const candidates = await search(row);
  const best = candidates[0] ?? null;
  const status = best && best.score >= 75 ? "verified" : "needs_review";
  let detail = {};

  if (best) {
    const html = await fetchText(best.officialUrl);
    detail = parseDetail(html, best);
  }

  const result = {
    ...row,
    category: row.category === "carry" ? "backpack" : row.category,
    official: best
      ? {
          status,
          score: best.score,
          product_id: best.productId,
          query: best.query,
          official_url: best.officialUrl,
          image_url: best.imageUrl,
          list_name: best.name,
          ...detail
        }
      : null,
    candidates: candidates.slice(0, 5)
  };

  results.push(result);
  console.log(
    `${String(row.row_number).padStart(3, "0")} ${status.padEnd(12)} ${String(
      best?.score ?? 0
    ).padStart(4)} ${row.model} -> ${best?.name ?? "NO MATCH"}`
  );
}

fs.writeFileSync(OUTPUT_JSON, `${JSON.stringify(results, null, 2)}\n`);

const summary = results.reduce(
  (acc, item) => {
    acc.total += 1;
    acc[item.official?.status ?? "missing"] =
      (acc[item.official?.status ?? "missing"] ?? 0) + 1;
    return acc;
  },
  { total: 0 }
);

console.log(JSON.stringify(summary, null, 2));
