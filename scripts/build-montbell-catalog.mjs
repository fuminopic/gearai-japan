import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const CANDIDATE_JSON =
  process.argv[2] ?? path.join(os.tmpdir(), "montbell_candidate_pool.json");
const OUTPUT_JSON =
  process.argv[3] ?? path.join(os.tmpdir(), "montbell_catalog_verified_100.json");
const BASE_URL = "https://webshop.montbell.jp";

const selection = [
  ["1121484", "sleep", "sleeping_bag", ["Down Hugger 800 #0", "ダウンハガー800 #0"]],
  ["1121485", "sleep", "sleeping_bag", ["Down Hugger 800 #1", "ダウンハガー800 #1"]],
  ["1121499", "sleep", "sleeping_bag", ["Down Hugger 800 Women's #1", "ダウンハガー800 #1 Women's"]],
  ["1121486", "sleep", "sleeping_bag", ["Down Hugger 800 #2", "ダウンハガー800 #2"]],
  ["1121500", "sleep", "sleeping_bag", ["Down Hugger 800 Women's #2", "ダウンハガー800 #2 Women's"]],
  ["1121487", "sleep", "sleeping_bag", ["Down Hugger 800 #3", "ダウンハガー800 #3"]],
  ["1121501", "sleep", "sleeping_bag", ["Down Hugger 800 Women's #3", "ダウンハガー800 #3 Women's"]],
  ["1121488", "sleep", "sleeping_bag", ["Down Hugger 800 #5", "ダウンハガー800 #5"]],
  ["1121489", "sleep", "sleeping_bag", ["Down Hugger 800 #7", "ダウンハガー800 #7"]],
  ["1121470", "sleep", "sleeping_bag", ["Dry Seamless Down Hugger 900 #1"]],
  ["1121471", "sleep", "sleeping_bag", ["Dry Seamless Down Hugger 900 #2"]],
  ["1121472", "sleep", "sleeping_bag", ["Dry Seamless Down Hugger 900 #3"]],
  ["1121434", "sleep", "sleeping_bag", ["Barrow Bag #0", "バロウバッグ #0"]],
  ["1121435", "sleep", "sleeping_bag", ["Barrow Bag #1", "バロウバッグ #1"]],
  ["1121437", "sleep", "sleeping_bag", ["Barrow Bag #3", "バロウバッグ #3"]],
  ["1121438", "sleep", "sleeping_bag", ["Barrow Bag #5", "バロウバッグ #5"]],
  ["1121426", "sleep", "sleeping_bag", ["Barrow Bag #3", "シームレス バロウバッグ #3"]],
  ["1121427", "sleep", "sleeping_bag", ["Barrow Bag #5", "シームレス バロウバッグ #5"]],
  ["1133321", "backpack", "backpack", ["Versalite Pack 15", "バーサライトパック 15"]],
  ["1133322", "backpack", "backpack", ["Versalite Pack 20", "バーサライトパック 20"]],
  ["1133323", "backpack", "backpack", ["Versalite Pack 30", "バーサライトパック 30"]],
  ["1133324", "backpack", "backpack", ["Versalite Pack 40", "バーサライトパック 40"]],
  ["1133161", "backpack", "backpack", ["Galena Pack 20", "ガレナパック 20"]],
  ["1133162", "backpack", "backpack", ["Galena Pack 25", "ガレナパック 25"]],
  ["1133163", "backpack", "backpack", ["Galena Pack 30", "ガレナパック 30"]],
  ["1133164", "backpack", "backpack", ["Galena Pack 25 Women's", "ガレナパック 25 Women's"]],
  ["1133165", "backpack", "backpack", ["Galena Pack 30 Women's", "ガレナパック 30 Women's"]],
  ["1133512", "backpack", "backpack", ["ChaCha Pack 30", "チャチャパック 30"]],
  ["1133514", "backpack", "backpack", ["ChaCha Pack 35", "チャチャパック 35"]],
  ["1133516", "backpack", "backpack", ["ChaCha Pack 40", "チャチャパック 40"]],
  ["1133364", "backpack", "backpack", ["Alpine Pack 40", "アルパインパック 40"]],
  ["1122814", "shelter", "tent", ["Stellaridge Tent 1", "ステラリッジ テント1 本体"]],
  ["1122815", "shelter", "tent", ["Stellaridge Tent 2", "ステラリッジ テント2 本体"]],
  ["1122816", "shelter", "tent", ["Stellaridge Tent 3", "ステラリッジ テント3 本体"]],
  ["1122817", "shelter", "tent", ["Stellaridge Tent 4", "ステラリッジ テント4 本体"]],
  ["1122823", "shelter", "tent", ["Stellaridge Tent Trail 1"]],
  ["1122824", "shelter", "tent", ["Stellaridge Tent Trail 2"]],
  ["1122762", "shelter", "tent", ["Moonlight Tent 1", "ムーンライト テント1"]],
  ["1122763", "shelter", "tent", ["Moonlight Tent 2", "ムーンライト テント2"]],
  ["1122764", "shelter", "tent", ["Moonlight Tent 4", "ムーンライト テント4"]],
  ["1122718", "shelter", "tent", ["Chronos Dome 2", "クロノスドーム2"]],
  ["1122704", "shelter", "tarp", ["Light Zelt", "ライトツェルト"]],
  ["1122792", "shelter", "tarp", ["Light Zelt L", "ライトツェルト L"]],
  ["1128733", "rainwear", "rain_jacket", ["Storm Cruiser Jacket Men's", "ストームクルーザー ジャケット Men's"]],
  ["1128735", "rainwear", "rain_jacket", ["Storm Cruiser Jacket Women's", "ストームクルーザー ジャケット Women's"]],
  ["1128562", "rainwear", "rain_pants", ["Storm Cruiser Pants Men's", "ストームクルーザー パンツ Men's"]],
  ["1128536", "rainwear", "rain_pants", ["Storm Cruiser Pants Women's", "ストームクルーザー パンツ Women's"]],
  ["1128770", "rainwear", "rain_jacket", ["Thunder Pass Jacket Men's", "サンダーパス ジャケット Men's"]],
  ["1128771", "rainwear", "rain_jacket", ["Thunder Pass Jacket Women's", "サンダーパス ジャケット Women's"]],
  ["1128637", "rainwear", "rain_pants", ["Thunder Pass Pants Men's", "サンダーパス パンツ Men's"]],
  ["1128743", "rainwear", "rain_jacket", ["Versalite Jacket Men's", "バーサライト ジャケット Men's"]],
  ["1128744", "rainwear", "rain_jacket", ["Versalite Jacket Women's", "バーサライト ジャケット Women's"]],
  ["1128665", "rainwear", "rain_pants", ["Versalite Pants Men's", "バーサライトパンツ Men's"]],
  ["1107712", "clothing", "base_layer", ["Geo Line EXP Round Neck Men's", "ジオライン EXP.ラウンドネックシャツ Men's"]],
  ["1107716", "clothing", "base_layer", ["Geo Line EXP Tights Men's", "ジオライン EXP.タイツ Men's"]],
  ["1107713", "clothing", "base_layer", ["Geo Line EXP Round Neck Women's", "ジオライン EXP.ラウンドネックシャツ Women's"]],
  ["1107704", "clothing", "base_layer", ["Geo Line MW Round Neck Men's", "ジオライン M.W.ラウンドネックシャツ Men's"]],
  ["1107709", "clothing", "base_layer", ["Geo Line MW Tights Men's", "ジオライン M.W.タイツ Men's"]],
  ["1107732", "clothing", "base_layer", ["Geo Line LW Round Neck Men's", "ジオライン L.W.ラウンドネックシャツ Men's"]],
  ["1107742", "clothing", "base_layer", ["Geo Line LW Tights Men's", "ジオライン L.W.タイツ Men's"]],
  ["1107659", "clothing", "base_layer", ["Super Merino Wool MW Tights Men's"]],
  ["1107655", "clothing", "base_layer", ["Super Merino Wool MW Round Neck Women's"]],
  ["1114834", "clothing", "base_layer", ["WIC. Light Long Sleeve Shirt Men's"]],
  ["1101528", "clothing", "down_jacket", ["Plasma 1000 Alpine Down Parka Men's"]],
  ["1101578", "clothing", "down_jacket", ["Plasma 1000 Alpine Down Parka Women's"]],
  ["1101708", "clothing", "down_jacket", ["Alpine Down Parka Men's"]],
  ["1101709", "clothing", "down_jacket", ["Alpine Down Parka Women's"]],
  ["1101666", "clothing", "down_jacket", ["Superior Down Round Neck Jacket Men's"]],
  ["1101667", "clothing", "down_jacket", ["Superior Down Round Neck Jacket Women's"]],
  ["1106580", "clothing", "insulation", ["Climaplus 200 Jacket Men's"]],
  ["1106591", "clothing", "insulation", ["Climaplus 100 Jacket Men's"]],
  ["1129467", "clothing", "footwear", ["Tsuromi Boot Men's"]],
  ["1129468", "clothing", "footwear", ["Tsuromi Boot Women's"]],
  ["1129466", "clothing", "footwear", ["Tenaya Boot Women's"]],
  ["1129758", "clothing", "footwear", ["Mountain Cruiser 400 Men's"]],
  ["1129759", "clothing", "footwear", ["Mountain Cruiser 400 Women's"]],
  ["1129748", "clothing", "footwear", ["Mountain Cruiser 600 Men's"]],
  ["1129749", "clothing", "footwear", ["Mountain Cruiser 600 Women's"]],
  ["1124900", "cooking", "cookware", ["Alpine Cooker 14", "アルパインクッカー 14"]],
  ["1124901", "cooking", "cookware", ["Alpine Cooker 16", "アルパインクッカー 16"]],
  ["1124902", "cooking", "cookware", ["Alpine Cooker 18", "アルパインクッカー 18"]],
  ["1124903", "cooking", "cookware", ["Alpine Cooker 20", "アルパインクッカー 20"]],
  ["1124905", "cooking", "cookware", ["Alpine Cooker 11 Deep", "アルパインクッカー 11 ディープ"]],
  ["1124907", "cooking", "cookware", ["Alpine Cooker 11+13 Set Deep"]],
  ["1124911", "cooking", "cookware", ["Alpine Cooker Solo Set"]],
  ["1124961", "cooking", "cookware", ["Alpine Frypan 16 Deep"]],
  ["1824332", "cooking", "gas_canister", ["Jetpower 100G", "ジェットパワー100G"]],
  ["1824379", "cooking", "gas_canister", ["Jetpower 230G", "ジェットパワー230G"]],
  ["1124660", "sleep", "sleeping_pad", ["U.L. Comfort System Alpine Pad 25 150"]],
  ["1124659", "sleep", "sleeping_pad", ["U.L. Comfort System Alpine Pad 25 180"]],
  ["1124827", "sleep", "sleeping_pad", ["Foam Pad 120"]],
  ["1124826", "sleep", "sleeping_pad", ["Foam Pad 150"]],
  ["1124825", "sleep", "sleeping_pad", ["Foam Pad 180"]],
  ["1134204", "electronics", "headlamp", ["Multi Power Head Lamp"]],
  ["1124833", "electronics", "headlamp", ["Compact Headlamp"]],
  ["1124777", "electronics", "headlamp", ["EX Power Head Lamp"]],
  ["1129740", "other", "traction_device", ["Chain Spike"]],
  ["1129685", "other", "traction_device", ["L.W. Chain Spike"]],
  ["1118994", "other", "gloves", ["L.W. Inner Gloves Men's"]],
  ["1140189", "other", "trekking_pole", ["Alpine Carbon Pole"]]
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

async function fetchDetail(productId) {
  const url = `${BASE_URL}/goods/disp.php?product_id=${productId}`;
  const response = await fetch(url, {
    headers: {
      "user-agent": "Yamajitaku catalog verifier; official mont-bell import"
    }
  });

  if (!response.ok) {
    throw new Error(`GET ${url} failed: ${response.status}`);
  }

  return response.text();
}

function parseDetail(html, fallbackName) {
  const title =
    html.match(/<title>\s*モンベル\s*｜\s*オンラインストア\s*｜\s*([\s\S]*?)<\/title>/)?.[1] ??
    fallbackName;
  const price = html.match(/&yen;([\d,]+)（税込）/)?.[1]?.replace(/,/g, "");
  const rawWeight =
    html.match(/【重量】\s*([\d,.]+)\s*(kg|g)/i) ??
    html.match(/【平均重量】\s*([\d,.]+)\s*(kg|g)/i) ??
    html.match(/【本体重量】\s*([\d,.]+)\s*(kg|g)/i) ??
    html.match(/【総重量】\s*([\d,.]+)\s*(kg|g)/i);
  const weight =
    rawWeight?.[2]?.toLowerCase() === "kg"
      ? Math.round(Number(rawWeight[1].replace(/,/g, "")) * 1000)
      : rawWeight?.[1]?.replace(/,/g, "");
  const size = html.match(/【サイズ】\s*([\s\S]*?)(?:<br\s*\/?>|【)/)?.[1];
  const capacity = html.match(/【容量】\s*([\s\S]*?)(?:<br\s*\/?>|【)/)?.[1];
  const volume = html.match(/【収納サイズ】\s*([\s\S]*?)(?:<br\s*\/?>|【)/)?.[1];
  const material = html.match(/【素材】\s*([\s\S]*?)(?:<br\s*\/?>|【)/)?.[1];

  return {
    name_ja: stripTags(title),
    msrp_jpy: price ? Number(price) : null,
    official_weight_grams: weight ? Number(weight) : null,
    size: size ? stripTags(size) : null,
    volume: volume ? stripTags(volume) : null,
    capacity: capacity ? stripTags(capacity) : null,
    material: material ? stripTags(material) : null
  };
}

const candidates = JSON.parse(fs.readFileSync(CANDIDATE_JSON, "utf8"));
const byId = new Map(candidates.map((candidate) => [candidate.productId, candidate]));

const selected = [];
const seen = new Set();

for (const [productId, category, subcategory, aliases] of selection) {
  if (seen.has(productId)) {
    throw new Error(`Duplicate product id in selection: ${productId}`);
  }

  const candidate = byId.get(productId);
  if (!candidate) {
    const html = await fetchDetail(productId);
    const detail = parseDetail(html, `#${productId}`);
    selected.push({
      product_id: productId,
      brand: "mont-bell",
      model: detail.name_ja,
      category,
      subcategory,
      official_url: `${BASE_URL}/goods/disp.php?product_id=${productId}`,
      image_url: null,
      aliases: [`#${productId}`, ...aliases],
      ...detail
    });
  } else {
    const html = await fetchDetail(productId);
    const detail = parseDetail(html, candidate.name);
    selected.push({
      product_id: productId,
      brand: "mont-bell",
      model: detail.name_ja,
      category,
      subcategory,
      official_url: candidate.officialUrl,
      image_url: candidate.imageUrl,
      aliases: [`#${productId}`, ...aliases],
      ...detail
    });
  }

  seen.add(productId);
  console.log(`${String(selected.length).padStart(3, "0")} ${productId}`);
  await new Promise((resolve) => setTimeout(resolve, 150));
}

if (selected.length !== 100) {
  throw new Error(`Expected 100 products, got ${selected.length}`);
}

const missingImages = selected.filter((item) => !item.image_url);
if (missingImages.length > 0) {
  throw new Error(
    `Missing official image URLs: ${missingImages
      .map((item) => item.product_id)
      .join(", ")}`
  );
}

fs.writeFileSync(OUTPUT_JSON, `${JSON.stringify(selected, null, 2)}\n`);
console.log(`wrote ${OUTPUT_JSON}`);
