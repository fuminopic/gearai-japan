import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const cacheDir = "/tmp/yamajitaku-source-cache";
mkdirSync(cacheDir, { recursive: true });

const products = [
  ["Columbia", "Saber Five Mid Outdry", "Columbia Saber Five Mid Outdry"],
  ["Columbia", "Saber Five Low Outdry", "Columbia Saber Five Low Outdry"],
  ["Columbia", "Peakfreak II Outdry", "Columbia Peakfreak II Outdry"],
  ["Columbia", "Hazy Journey Waterproof", "Columbia Hazy Journey Waterproof"],
  ["Columbia", "Wabash Jacket", "Columbia Wabash Jacket"],
  ["Columbia", "Light Canyon Softshell", "Columbia Light Canyon Softshell"],
  ["Columbia", "Vizzavona Pass Jacket", "Columbia Vizzavona Pass Jacket"],
  ["Columbia", "Mountains Are Calling Jacket", "Columbia Mountains Are Calling Jacket"],
  ["Columbia", "Blue Ridge Mountain 30L", "Columbia Blue Ridge Mountain 30L"],
  ["Columbia", "Castle Rock 25L", "Columbia Castle Rock 25L"],
  ["MILLET", "SAAS FEE NX 30+5", "MILLET SAAS FEE NX 30+5"],
  ["MILLET", "SAAS FEE NX 40+5", "MILLET SAAS FEE NX 40+5"],
  ["MILLET", "KULA 30", "MILLET KULA 30"],
  ["MILLET", "WELKIN 30", "MILLET WELKIN 30"],
  ["MILLET", "TYPHON 50000 Stretch Jacket", "MILLET TYPHON 50000 Stretch Jacket"],
  ["MILLET", "TYPHON 50000 Stretch Pants", "MILLET TYPHON 50000 Stretch Pants"],
  ["MILLET", "Drynamic Mesh NS", "MILLET Drynamic Mesh NS"],
  ["MILLET", "Drynamic Mesh 3/4 Tights", "MILLET Drynamic Mesh 3/4 Tights"],
  ["MILLET", "Breathe Barrier Toi Alpha Direct Jacket", "MILLET Breathe Barrier Toi Alpha Direct Jacket"],
  ["MILLET", "Wanaka Stretch Pants", "MILLET Wanaka Stretch Pants"],
  ["Arc'teryx", "Beta Jacket", "Arc'teryx Beta Jacket"],
  ["Arc'teryx", "Beta AR Jacket", "Arc'teryx Beta AR Jacket"],
  ["Arc'teryx", "Alpha SV Jacket", "Arc'teryx Alpha SV Jacket"],
  ["Arc'teryx", "Atom Hoody", "Arc'teryx Atom Hoody"],
  ["Arc'teryx", "Proton Hoody", "Arc'teryx Proton Hoody"],
  ["Arc'teryx", "Cerium Hoody", "Arc'teryx Cerium Hoody"],
  ["Arc'teryx", "Kyanite Hoody", "Arc'teryx Kyanite Hoody"],
  ["Arc'teryx", "Gamma Pant", "Arc'teryx Gamma Pant"],
  ["Arc'teryx", "Aerios FL 2 GTX", "Arc'teryx Aerios FL 2 GTX"],
  ["Arc'teryx", "Bora 65", "Arc'teryx Bora 65"],
  ["patagonia", "Torrentshell 3L Jacket", "patagonia Torrentshell 3L Jacket"],
  ["patagonia", "Torrentshell 3L Pants", "patagonia Torrentshell 3L Pants"],
  ["patagonia", "Houdini Jacket", "patagonia Houdini Jacket"],
  ["patagonia", "R1 Air Zip-Neck", "patagonia R1 Air Zip-Neck"],
  ["patagonia", "R1 Air Hoody", "patagonia R1 Air Hoody"],
  ["patagonia", "Nano Puff Jacket", "patagonia Nano Puff Jacket"],
  ["patagonia", "Down Sweater Hoody", "patagonia Down Sweater Hoody"],
  ["patagonia", "Capilene Cool Daily Shirt", "patagonia Capilene Cool Daily Shirt"],
  ["patagonia", "Terrebonne Joggers", "patagonia Terrebonne Joggers"],
  ["patagonia", "Black Hole Pack 32L", "patagonia Black Hole Pack 32L"],
  ["GREGORY", "Zulu 30", "GREGORY Zulu 30"],
  ["GREGORY", "Zulu 35", "GREGORY Zulu 35"],
  ["GREGORY", "Zulu 45", "GREGORY Zulu 45"],
  ["GREGORY", "Jade 28", "GREGORY Jade 28"],
  ["GREGORY", "Jade 38", "GREGORY Jade 38"],
  ["GREGORY", "Baltoro 65", "GREGORY Baltoro 65"],
  ["GREGORY", "Deva 60", "GREGORY Deva 60"],
  ["GREGORY", "Paragon 48", "GREGORY Paragon 48"],
  ["GREGORY", "Maven 45", "GREGORY Maven 45"],
  ["GREGORY", "Focal 48", "GREGORY Focal 48"],
  ["LA SPORTIVA", "TX5 Evo GTX", "LA SPORTIVA TX5 Evo GTX"],
  ["LA SPORTIVA", "TX5 Evo Mid GTX", "LA SPORTIVA TX5 Evo Mid GTX"],
  ["LA SPORTIVA", "TX4 Evo GTX", "LA SPORTIVA TX4 Evo GTX"],
  ["LA SPORTIVA", "TX4 Evo Mid GTX", "LA SPORTIVA TX4 Evo Mid GTX"],
  ["LA SPORTIVA", "Ultra Raptor 3 GTX", "LA SPORTIVA Ultra Raptor 3 GTX"],
  ["LA SPORTIVA", "Ultra Raptor 3 Mid GTX", "LA SPORTIVA Ultra Raptor 3 Mid GTX"],
  ["LA SPORTIVA", "Aequilibrium ST GTX", "LA SPORTIVA Aequilibrium ST GTX"],
  ["LA SPORTIVA", "Trango Tech GTX", "LA SPORTIVA Trango Tech GTX"],
  ["LA SPORTIVA", "Akasha II", "LA SPORTIVA Akasha II"],
  ["LA SPORTIVA", "Prodigio", "LA SPORTIVA Prodigio"],
  ["Mammut", "Lithium 20", "Mammut Lithium 20"],
  ["Mammut", "Lithium 25", "Mammut Lithium 25"],
  ["Mammut", "Lithium 30", "Mammut Lithium 30"],
  ["Mammut", "Ducan 32", "Mammut Ducan 32"],
  ["Mammut", "Ducan Spine 28-35", "Mammut Ducan Spine 28-35"],
  ["Mammut", "Ducan Light HS Hooded Jacket", "Mammut Ducan Light HS Hooded Jacket"],
  ["Mammut", "Alto Light HS Hooded Jacket", "Mammut Alto Light HS Hooded Jacket"],
  ["Mammut", "Aconcagua ML Jacket", "Mammut Aconcagua ML Jacket"],
  ["Mammut", "Runbold Pants", "Mammut Runbold Pants"],
  ["Mammut", "Sertig II Mid GTX", "Mammut Sertig II Mid GTX"]
];

function cacheFile(index) {
  return `${cacheDir}/rakuten_${String(index).padStart(2, "0")}.html`;
}

function hasUsefulCache(file) {
  try {
    return statSync(file).size > 10000;
  } catch {
    return false;
  }
}

function scrapeSearchPage(query, file) {
  if (hasUsefulCache(file)) return true;
  const url = `https://search.rakuten.co.jp/search/mall/${encodeURIComponent(query)}/`;
  const result = spawnSync(
    "curl",
    ["-L", "-A", "Mozilla/5.0", url, "-o", file],
    { encoding: "utf8", timeout: 30000 }
  );
  return result.status === 0 && hasUsefulCache(file);
}

function readCarousel(file) {
  const html = readFileSync(file, "utf8");
  const match = html.match(/"structuredDataCarousel":"((?:\\.|[^"\\])*)"/);
  if (!match) return [];
  const decoded = JSON.parse(`"${match[1]}"`);
  return JSON.parse(decoded).itemListElement.map((element) => element.item);
}

function scoreItem(model, item) {
  const haystack = `${item.name ?? ""} ${item.url ?? ""}`.toLowerCase();
  const tokens = model
    .toLowerCase()
    .replaceAll("+", " ")
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 2);
  return tokens.reduce((score, token) => score + (haystack.includes(token) ? 1 : 0), 0);
}

const rows = [];
for (const [index, [brand, model, query]] of products.entries()) {
  const file = cacheFile(index);
  const ok = scrapeSearchPage(query, file);
  const items = ok ? readCarousel(file) : [];
  const best = [...items].sort((a, b) => scoreItem(model, b) - scoreItem(model, a))[0];
  const row = {
    index,
    brand,
    model,
    query,
    searchOk: ok,
    matchScore: best ? scoreItem(model, best) : 0,
    name: best?.name ?? null,
    price: best?.offers?.price ?? null,
    image: best?.image?.[0] ?? null,
    url: best?.url ?? null
  };
  rows.push(row);
  console.log(`${ok ? "OK" : "NG"} ${index} ${brand} ${model} ${row.price ?? ""}`);
}

writeFileSync(`${cacheDir}/popular-brand-source-candidates.json`, JSON.stringify(rows, null, 2));
console.log(`Wrote ${cacheDir}/popular-brand-source-candidates.json`);
