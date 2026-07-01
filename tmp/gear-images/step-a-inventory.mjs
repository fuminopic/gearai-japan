import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const projectRoot = process.cwd();
const envPath = path.join(projectRoot, ".env.local");
const outRoot = path.join(projectRoot, "tmp", "gear-images");
const originalRoot = path.join(outRoot, "original", "catalog-visible");

const CATALOG_SELECT =
  "id,brand,model,name_ja,image_url,official_url,verification_status,discontinued,created_at";

function loadEnv(file) {
  if (!fs.existsSync(file)) {
    return;
  }

  const text = fs.readFileSync(file, "utf8");

  for (const line of text.split(/\r?\n/)) {
    if (!line || /^\s*#/.test(line)) {
      continue;
    }

    const separator = line.indexOf("=");
    if (separator < 0) {
      continue;
    }

    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();

    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function sanitizeExtension(extension) {
  const normalized = (extension || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  if (["jpg", "jpeg", "png", "webp", "gif", "heic", "avif"].includes(normalized)) {
    return normalized === "jpeg" ? "jpg" : normalized;
  }

  return "";
}

function extensionFromPathOrType(contentType, imageUrl) {
  if (imageUrl) {
    try {
      const extension = sanitizeExtension(path.extname(new URL(imageUrl).pathname).slice(1));

      if (extension) {
        return extension;
      }
    } catch {
      // Fall back to content type below.
    }
  }

  if (contentType?.includes("png")) {
    return "png";
  }
  if (contentType?.includes("webp")) {
    return "webp";
  }
  if (contentType?.includes("jpeg") || contentType?.includes("jpg")) {
    return "jpg";
  }

  return "bin";
}

function externalHost(url) {
  if (!url) {
    return null;
  }

  try {
    return new URL(url).host;
  } catch {
    return "invalid-url";
  }
}

function increment(map, key) {
  map.set(key, (map.get(key) || 0) + 1);
}

function counterToObject(map) {
  return Object.fromEntries([...map.entries()].sort());
}

async function fetchAllRows(queryFactory) {
  const rows = [];
  const pageSize = 1000;

  for (let from = 0; ; from += pageSize) {
    const to = from + pageSize - 1;
    const { data, error } = await queryFactory().range(from, to);

    if (error) {
      throw error;
    }

    rows.push(...(data ?? []));

    if (!data || data.length < pageSize) {
      break;
    }
  }

  return rows;
}

async function downloadExternalUrl(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return {
    buffer: Buffer.from(await response.arrayBuffer()),
    contentType: response.headers.get("content-type") || ""
  };
}

function getCatalogVisibleQuery(supabase) {
  return supabase
    .from("gear_products")
    .select(CATALOG_SELECT)
    .eq("discontinued", false)
    .order("brand", { ascending: true })
    .order("model", { ascending: true });
}

function getAllCatalogQuery(supabase) {
  return supabase
    .from("gear_products")
    .select("id,brand,model,name_ja,image_url,verification_status,discontinued")
    .order("brand", { ascending: true })
    .order("model", { ascending: true });
}

function buildBaseEntry(row) {
  const hasImageUrl = Boolean(row.image_url?.trim());

  return {
    source: "gear_products",
    table: "gear_products",
    catalog_visibility: "catalog_visible",
    id: row.id,
    name: row.name_ja ?? null,
    name_ja: row.name_ja ?? null,
    brand: row.brand ?? null,
    model: row.model ?? null,
    verification_status: row.verification_status ?? null,
    discontinued: Boolean(row.discontinued),
    has_image: hasImageUrl,
    source_type: hasImageUrl ? "external_url" : "missing",
    image_url: row.image_url || null,
    image_url_host: hasImageUrl ? externalHost(row.image_url) : null,
    official_url: row.official_url ?? null,
    downloaded_path: null,
    download_status: hasImageUrl ? "pending" : "missing_image",
    content_type: null,
    bytes: null,
    error: null
  };
}

async function main() {
  loadEnv(envPath);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase URL or API key in .env.local");
  }

  if (/[^\x00-\x7F]/.test(supabaseKey) || supabaseKey.includes("ここ") || supabaseKey.includes("这里")) {
    throw new Error(
      "SUPABASE_SECRET_KEY must be the actual Supabase service_role/secret key, not placeholder text."
    );
  }

  fs.mkdirSync(originalRoot, { recursive: true });

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const [catalogVisibleRows, allCatalogRows] = await Promise.all([
    fetchAllRows(() => getCatalogVisibleQuery(supabase)),
    fetchAllRows(() => getAllCatalogQuery(supabase))
  ]);

  const items = [];
  const brandDistribution = new Map();
  const hostDistribution = new Map();
  const verificationDistribution = new Map();
  let downloadedFromExternalUrl = 0;
  let failedDownloads = 0;

  for (const row of catalogVisibleRows) {
    if (row.brand) {
      increment(brandDistribution, row.brand);
    }
    if (row.verification_status) {
      increment(verificationDistribution, row.verification_status);
    }
    if (row.image_url) {
      increment(hostDistribution, externalHost(row.image_url));
    }

    const entry = buildBaseEntry(row);

    if (entry.source_type === "external_url") {
      try {
        const { buffer, contentType } = await downloadExternalUrl(row.image_url);
        const extension = extensionFromPathOrType(contentType, row.image_url);
        const absolutePath = path.join(originalRoot, `${row.id}.${extension}`);
        fs.writeFileSync(absolutePath, buffer);

        entry.downloaded_path = path.relative(projectRoot, absolutePath);
        entry.download_status = "downloaded_external_url";
        entry.content_type = contentType || null;
        entry.bytes = fs.statSync(absolutePath).size;
        downloadedFromExternalUrl += 1;
      } catch (error) {
        entry.download_status = "failed_external_url";
        entry.error = error instanceof Error ? error.message : String(error);
        failedDownloads += 1;
      }
    }

    items.push(entry);
  }

  const visibleWithImage = items.filter((item) => item.has_image).length;
  const visibleMissingImage = items.filter((item) => !item.has_image).length;
  const hiddenDiscontinuedCount = allCatalogRows.filter((row) => row.discontinued).length;
  const activeRowsWithoutImage = catalogVisibleRows.filter((row) => !row.image_url).map((row) => ({
    id: row.id,
    brand: row.brand,
    model: row.model,
    name_ja: row.name_ja,
    verification_status: row.verification_status
  }));
  const downloadFailures = items
    .filter((item) => item.download_status.startsWith("failed"))
    .map((item) => ({
      id: item.id,
      brand: item.brand,
      model: item.model,
      image_url: item.image_url,
      error: item.error
    }));

  const summary = {
    generated_at: new Date().toISOString(),
    definition:
      "gear_products where discontinued=false. This matches products shown in /gear/new official catalog picker; rows without image_url show fallback in the app and are not image-processing targets yet.",
    total_gear_products: allCatalogRows.length,
    catalog_visible_total: catalogVisibleRows.length,
    excluded_discontinued_count: hiddenDiscontinuedCount,
    catalog_visible_with_image: visibleWithImage,
    catalog_visible_missing_image: visibleMissingImage,
    downloaded_from_external_url: downloadedFromExternalUrl,
    failed_downloads: failedDownloads,
    image_processing_target_count: items.filter((item) => item.download_status === "downloaded_external_url").length,
    output_directory: path.relative(projectRoot, originalRoot),
    brand_distribution: counterToObject(brandDistribution),
    external_host_distribution: counterToObject(hostDistribution),
    verification_distribution: counterToObject(verificationDistribution),
    active_rows_without_image: activeRowsWithoutImage,
    download_failures: downloadFailures
  };

  fs.writeFileSync(
    path.join(outRoot, "inventory-catalog-visible.json"),
    `${JSON.stringify({ summary, items }, null, 2)}\n`
  );

  const lines = [
    "# Gear Image Pipeline Step A - Catalog Visible Inventory",
    "",
    `Generated: ${summary.generated_at}`,
    "",
    "## Definition",
    "",
    summary.definition,
    "",
    "## Summary",
    "",
    `- Total gear_products: ${summary.total_gear_products}`,
    `- Catalog-visible records: ${summary.catalog_visible_total}`,
    `- Excluded discontinued records: ${summary.excluded_discontinued_count}`,
    `- Catalog-visible with image_url: ${summary.catalog_visible_with_image}`,
    `- Catalog-visible missing image_url: ${summary.catalog_visible_missing_image}`,
    `- Downloaded external images: ${summary.downloaded_from_external_url}`,
    `- Failed downloads: ${summary.failed_downloads}`,
    `- Current image-processing target count: ${summary.image_processing_target_count}`,
    `- Original image output: ${summary.output_directory}`,
    "",
    "## Brand Distribution",
    ""
  ];

  const brandEntries = Object.entries(summary.brand_distribution);
  lines.push(...(brandEntries.length ? brandEntries.map(([key, value]) => `- ${key}: ${value}`) : ["- None"]));

  lines.push("", "## External Host Distribution", "");
  const hostEntries = Object.entries(summary.external_host_distribution);
  lines.push(...(hostEntries.length ? hostEntries.map(([key, value]) => `- ${key}: ${value}`) : ["- None"]));

  lines.push("", "## Verification Distribution", "");
  const verificationEntries = Object.entries(summary.verification_distribution);
  lines.push(...(verificationEntries.length ? verificationEntries.map(([key, value]) => `- ${key}: ${value}`) : ["- None"]));

  lines.push("", "## Active Rows Without Image", "");
  lines.push(
    ...(activeRowsWithoutImage.length
      ? activeRowsWithoutImage.map((item) => `- ${item.id} ${item.brand || ""} ${item.model || item.name_ja || ""}`)
      : ["- None"]),
    "",
    "## Download Failures",
    ""
  );
  lines.push(
    ...(downloadFailures.length
      ? downloadFailures.map((item) => `- ${item.id} ${item.brand || ""} ${item.model || ""}: ${item.error}`)
      : ["- None"]),
    ""
  );

  fs.writeFileSync(path.join(outRoot, "inventory-catalog-visible-summary.md"), `${lines.join("\n")}\n`);

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
