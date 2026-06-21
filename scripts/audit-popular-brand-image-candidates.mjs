import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";

const projectRoot = new URL("../", import.meta.url);
const candidateMigrationUrl = new URL("supabase/migrations/043_popular_japan_brand_catalog_p0.sql", projectRoot);
const migrationsUrl = new URL("supabase/migrations/", projectRoot);
const reportUrl = new URL("docs/popular-brand-image-candidate-audit.md", projectRoot);
const sourceCandidatePath = "/tmp/yamajitaku-source-cache/popular-brand-source-candidates.json";

export const targetBrands = [
  "Columbia",
  "MILLET",
  "Arc'teryx",
  "patagonia",
  "GREGORY",
  "LA SPORTIVA",
  "Mammut"
];

export const allowedCleanImageHosts = [
  "www.columbiasports.co.jp",
  "milletonline.itembox.cloud",
  "edge.dis.commercecloud.salesforce.com",
  "www.gregory.jp",
  "mammt.store-image.jp",
  "arcteryx.scene7.com",
  "images-dynamic-arcteryx.imgix.net",
  "www.sportivajapan.com"
];

export const forbiddenImagePatterns = [
  /rakuten/i,
  /r10s/i,
  /amazon/i,
  /shopping\.c\.yimg/i,
  /yahoo/i,
  /thumbnail/i,
  /thumb/i,
  /search/i,
  /banner/i,
  /promo/i,
  /campaign/i,
  /coupon/i,
  /coordinate/i,
  /lifestyle/i,
  /model/i,
  /ranking/i,
  /watermark/i,
  /collage/i,
  /sw=256/i,
  /w_380\.h_380/i
];

function unescapeSql(value) {
  return value.replaceAll("''", "'");
}

function parseSqlNullable(value) {
  return value === "null" ? null : unescapeSql(value.slice(1, -1));
}

export function extractP0Candidates(source) {
  const productPattern =
    /\(\s*'([^']*(?:''[^']*)*)',\s*'([^']*(?:''[^']*)*)',\s*'([^']*(?:''[^']*)*)',\s*'([^']+)',\s*'([^']+)',\s*(null|'[^']*'),\s*'([^']+)'\s*\)/g;

  return [...source.matchAll(productPattern)]
    .map((match) => ({
      brand: unescapeSql(match[1]),
      model: unescapeSql(match[2]),
      nameJa: unescapeSql(match[3]),
      category: match[4],
      subcategory: match[5],
      volume: parseSqlNullable(match[6]),
      officialUrl: match[7]
    }))
    .filter((row) => targetBrands.includes(row.brand));
}

export function extractVerifiedRows(source) {
  const verifiedPattern =
    /\(\s*'([^']*(?:''[^']*)*)',\s*'([^']*(?:''[^']*)*)',\s*'([^']*(?:''[^']*)*)',\s*'([^']+)',\s*'([^']+)',\s*(\d+),\s*(\d+),\s*(null|'[^']*'),\s*(null|'[^']*'),\s*(null|'[^']*'),\s*'([^']+)',\s*'([^']+)'\s*\)/g;

  return [...source.matchAll(verifiedPattern)]
    .map((match) => ({
      brand: unescapeSql(match[1]),
      model: unescapeSql(match[2]),
      nameJa: unescapeSql(match[3]),
      category: match[4],
      subcategory: match[5],
      officialWeightGrams: Number(match[6]),
      msrpJpy: Number(match[7]),
      size: parseSqlNullable(match[8]),
      volume: parseSqlNullable(match[9]),
      capacity: parseSqlNullable(match[10]),
      officialUrl: match[11],
      imageUrl: match[12]
    }))
    .filter((row) => targetBrands.includes(row.brand));
}

function readSourceCandidates() {
  if (!existsSync(sourceCandidatePath)) return [];
  try {
    return JSON.parse(readFileSync(sourceCandidatePath, "utf8"));
  } catch {
    return [];
  }
}

export function cleanImageUrlGrade(imageUrl) {
  if (!imageUrl) return { ok: false, reason: "image_url missing" };

  let host = "";
  try {
    host = new URL(imageUrl).host;
  } catch {
    return { ok: false, reason: "image_url is not a valid URL" };
  }

  if (!allowedCleanImageHosts.includes(host)) {
    return { ok: false, reason: `host ${host} is not allowlisted` };
  }

  const forbidden = forbiddenImagePatterns.find((pattern) => pattern.test(imageUrl));
  if (forbidden) {
    return { ok: false, reason: `image_url matches forbidden pattern ${forbidden}` };
  }

  return { ok: true, reason: "clean allowlisted product image" };
}

function countByBrand(rows) {
  return targetBrands.reduce((counts, brand) => {
    counts[brand] = rows.filter((row) => row.brand === brand).length;
    return counts;
  }, {});
}

export function buildAuditRows({
  candidateSource,
  repairSource,
  sourceCandidates = readSourceCandidates()
}) {
  const candidates = extractP0Candidates(candidateSource);
  const verifiedRows = extractVerifiedRows(repairSource);
  const verifiedByKey = new Map(verifiedRows.map((row) => [`${row.brand}::${row.model}`, row]));
  const candidateKeys = new Set(candidates.map((row) => `${row.brand}::${row.model}`));
  const sourceByKey = new Map(sourceCandidates.map((row) => [`${row.brand}::${row.model}`, row]));

  const auditRows = candidates.map((candidate) => {
    const key = `${candidate.brand}::${candidate.model}`;
    const verified = verifiedByKey.get(key);
    if (verified) {
      const imageGrade = cleanImageUrlGrade(verified.imageUrl);
      return {
        ...candidate,
        grade: imageGrade.ok ? "A" : "C",
        status: imageGrade.ok ? "verified_visible" : "verified_but_image_blocked",
        imageUrl: verified.imageUrl,
        sourceUrl: verified.officialUrl,
        reason: imageGrade.reason
      };
    }

    const sourceCandidate = sourceByKey.get(key);
    if (sourceCandidate?.image) {
      const imageGrade = cleanImageUrlGrade(sourceCandidate.image);
      return {
        ...candidate,
        grade: imageGrade.ok ? "B" : "C",
        status: imageGrade.ok ? "candidate_needs_manual_review" : "hidden_needs_clean_source",
        imageUrl: sourceCandidate.image,
        sourceUrl: sourceCandidate.url,
        reason: imageGrade.ok
          ? "clean candidate found; still needs official detail verification"
          : imageGrade.reason
      };
    }

    return {
      ...candidate,
      grade: "C",
      status: "hidden_needs_clean_source",
      imageUrl: null,
      sourceUrl: candidate.officialUrl,
      reason: "no clean product image candidate has been verified"
    };
  });

  for (const verified of verifiedRows) {
    const key = `${verified.brand}::${verified.model}`;
    if (candidateKeys.has(key)) continue;
    const imageGrade = cleanImageUrlGrade(verified.imageUrl);
    auditRows.push({
      brand: verified.brand,
      model: verified.model,
      nameJa: verified.nameJa,
      category: verified.category,
      subcategory: verified.subcategory,
      volume: verified.volume,
      officialUrl: verified.officialUrl,
      grade: imageGrade.ok ? "A" : "C",
      status: imageGrade.ok ? "verified_replacement_visible" : "verified_replacement_but_image_blocked",
      imageUrl: verified.imageUrl,
      sourceUrl: verified.officialUrl,
      reason: imageGrade.ok ? "clean verified replacement product" : imageGrade.reason
    });
  }

  return auditRows;
}

function escapeTable(value) {
  return String(value ?? "")
    .replaceAll("|", "\\|")
    .replaceAll("\n", " ");
}

export function buildReport() {
  const candidateSource = readFileSync(candidateMigrationUrl, "utf8");
  const repairSource = readdirSync(migrationsUrl)
    .filter((file) => /^0(?:4[6-9]|[5-9]\d)_.*\.sql$/.test(file))
    .sort()
    .map((file) => readFileSync(new URL(file, migrationsUrl), "utf8"))
    .join("\n");
  const auditRows = buildAuditRows({ candidateSource, repairSource });
  const gradeCounts = ["A", "B", "C"].reduce((counts, grade) => {
    counts[grade] = auditRows.filter((row) => row.grade === grade).length;
    return counts;
  }, {});
  const verifiedRows = auditRows.filter((row) => row.grade === "A");
  const hiddenRows = auditRows.filter((row) => row.grade === "C");
  const brandTotals = countByBrand(auditRows);
  const brandVerified = countByBrand(verifiedRows);

  const lines = [
    "# Popular Brand Image Candidate Audit",
    "",
    "This report is generated by `scripts/audit-popular-brand-image-candidates.mjs`.",
    "It makes the seven-brand catalog repair repeatable: candidate inventory, image-source quality gate, and rollout status are visible before another migration is written.",
    "",
    "## Summary",
    "",
    `- Target brands: ${targetBrands.join(", ")}`,
    `- Audit rows: ${auditRows.length}`,
    `- Grade A / verified and visible: ${gradeCounts.A}`,
    `- Grade B / clean candidate, still needs manual product-detail verification: ${gradeCounts.B}`,
    `- Grade C / hidden until a clean source is verified: ${gradeCounts.C}`,
    "",
    "## Brand Status",
    "",
    "| Brand | Verified visible | Candidate inventory | Next action |",
    "|---|---:|---:|---|"
  ];

  for (const brand of targetBrands) {
    const verified = brandVerified[brand];
    const total = brandTotals[brand];
    const action =
      verified === 0
        ? "Find official/official-agent clean product images first"
        : verified < Math.min(5, total)
          ? "Batch verify next clean candidates"
          : "Maintain and expand after higher-gap brands";
    lines.push(`| ${brand} | ${verified} | ${total} | ${action} |`);
  }

  lines.push(
    "",
    "## Image Quality Gate",
    "",
    "Allowed clean image hosts:",
    "",
    ...allowedCleanImageHosts.map((host) => `- ${host}`),
    "",
    "Blocked URL signals:",
    "",
    ...forbiddenImagePatterns.map((pattern) => `- \`${pattern}\``),
    "",
    "## Grade A Rows",
    "",
    "| Brand | Model | Image host | Source |",
    "|---|---|---|---|"
  );

  for (const row of verifiedRows) {
    lines.push(
      `| ${escapeTable(row.brand)} | ${escapeTable(row.model)} | ${new URL(row.imageUrl).host} | ${escapeTable(row.sourceUrl)} |`
    );
  }

  lines.push(
    "",
    "## Hidden / Needs Clean Source",
    "",
    "| Brand | Model | Reason |",
    "|---|---|---|"
  );

  for (const row of hiddenRows) {
    lines.push(`| ${escapeTable(row.brand)} | ${escapeTable(row.model)} | ${escapeTable(row.reason)} |`);
  }

  lines.push(
    "",
    "## Next Batch Rule",
    "",
    "1. Collect candidates in batches by brand from official or official-agent product pages first.",
    "2. Use this audit script to reject low-quality image sources before SQL is written.",
    "3. Only Grade A rows get restored as `verification_status = 'verified'` and `discontinued = false`.",
    "4. Grade B rows stay out of production until weight, price, official URL, and image URL are all verified.",
    "5. Grade C rows remain hidden; replace the product if a clean image cannot be found quickly."
  );

  return `${lines.join("\n")}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = buildReport();

  if (process.argv.includes("--stdout")) {
    process.stdout.write(report);
  } else {
    mkdirSync(new URL("docs/", projectRoot), { recursive: true });
    writeFileSync(reportUrl, report);
    console.log(`Wrote ${reportUrl.pathname}`);
  }
}
