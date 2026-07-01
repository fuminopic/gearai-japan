import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const projectRoot = process.cwd();
const envPath = path.join(projectRoot, ".env.local");
const outRoot = path.join(projectRoot, "tmp", "gear-images");
const existingOriginalRoot = path.join(outRoot, "original", "catalog-visible");
const firstPageOriginalRoot = path.join(outRoot, "original", "catalog-first-page-visible");

const PRODUCT_SELECT =
  "id,brand,model,name_ja,image_url,official_url,verification_status,discontinued,created_at,category_id,subcategory_id,gear_categories:category_id(id,name_ja,name_en,sort_order),gear_subcategories:subcategory_id(id,name_ja,name_en)";

const FIRST_PAGE_LIMIT_PER_CATEGORY = 12;

const brandCollator = new Intl.Collator("ja");

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

function increment(map, key) {
  map.set(key, (map.get(key) || 0) + 1);
}

function counterToObject(map) {
  return Object.fromEntries([...map.entries()].sort());
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

function getProductCategoryLabel(row) {
  return row.gear_categories?.name_ja ?? "その他";
}

function getProductCategorySortOrder(row) {
  const value = row.gear_categories?.sort_order;
  return Number.isFinite(value) ? value : Number.MAX_SAFE_INTEGER;
}

function compareProductPickerItems(a, b, categorySortOrder) {
  const categoryA = categorySortOrder.get(a.category_id) ?? Number.MAX_SAFE_INTEGER;
  const categoryB = categorySortOrder.get(b.category_id) ?? Number.MAX_SAFE_INTEGER;

  if (categoryA !== categoryB) {
    return categoryA - categoryB;
  }

  const categoryLabel = brandCollator.compare(
    getProductCategoryLabel(a),
    getProductCategoryLabel(b)
  );

  if (categoryLabel !== 0) {
    return categoryLabel;
  }

  return brandCollator.compare(a.model ?? "", b.model ?? "");
}

function getCategoryOrder(rows) {
  const categories = new Map();

  for (const row of rows) {
    if (!categories.has(row.category_id)) {
      categories.set(row.category_id, {
        id: row.category_id,
        label: getProductCategoryLabel(row),
        sortOrder: getProductCategorySortOrder(row)
      });
    }
  }

  return [...categories.values()].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder;
    }

    return brandCollator.compare(a.label, b.label);
  });
}

function getFirstPageRows(rows) {
  const categories = getCategoryOrder(rows);
  const categorySortOrder = new Map(
    categories.map((category, index) => [
      category.id,
      category.sortOrder === Number.MAX_SAFE_INTEGER ? index : category.sortOrder
    ])
  );
  const sortedRows = [...rows].sort((a, b) =>
    compareProductPickerItems(a, b, categorySortOrder)
  );
  const rowsByCategory = new Map();

  for (const row of sortedRows) {
    const current = rowsByCategory.get(row.category_id) ?? [];
    current.push(row);
    rowsByCategory.set(row.category_id, current);
  }

  return categories.flatMap((category) =>
    (rowsByCategory.get(category.id) ?? []).slice(0, FIRST_PAGE_LIMIT_PER_CATEGORY)
  );
}

function findExistingOriginalPath(id) {
  if (!fs.existsSync(existingOriginalRoot)) {
    return null;
  }

  const match = fs.readdirSync(existingOriginalRoot).find((name) =>
    name.startsWith(`${id}.`)
  );

  return match ? path.join(existingOriginalRoot, match) : null;
}

function buildEntry(row, firstPageIndex) {
  const hasImageUrl = Boolean(row.image_url?.trim());

  return {
    source: "gear_products",
    table: "gear_products",
    catalog_visibility: "catalog_first_page_visible",
    first_page_index: firstPageIndex,
    id: row.id,
    name: row.name_ja ?? null,
    name_ja: row.name_ja ?? null,
    brand: row.brand ?? null,
    model: row.model ?? null,
    category_id: row.category_id ?? null,
    category_label: getProductCategoryLabel(row),
    subcategory_id: row.subcategory_id ?? null,
    subcategory_label: row.gear_subcategories?.name_ja ?? null,
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

function getActiveCatalogQuery(supabase) {
  return supabase
    .from("gear_products")
    .select(PRODUCT_SELECT)
    .eq("discontinued", false)
    .order("brand", { ascending: true })
    .order("model", { ascending: true });
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

  fs.mkdirSync(firstPageOriginalRoot, { recursive: true });

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const activeRows = await fetchAllRows(() => getActiveCatalogQuery(supabase));
  const firstPageRows = getFirstPageRows(activeRows);
  const items = [];
  const brandDistribution = new Map();
  const categoryDistribution = new Map();
  const hostDistribution = new Map();
  const verificationDistribution = new Map();
  let reusedExistingOriginal = 0;
  let downloadedFromExternalUrl = 0;
  let failedDownloads = 0;

  for (const [index, row] of firstPageRows.entries()) {
    const entry = buildEntry(row, index + 1);

    if (row.brand) {
      increment(brandDistribution, row.brand);
    }
    if (entry.category_label) {
      increment(categoryDistribution, entry.category_label);
    }
    if (row.verification_status) {
      increment(verificationDistribution, row.verification_status);
    }
    if (row.image_url) {
      increment(hostDistribution, externalHost(row.image_url));
    }

    if (entry.source_type === "external_url") {
      const existingOriginalPath = findExistingOriginalPath(row.id);

      if (existingOriginalPath) {
        entry.downloaded_path = path.relative(projectRoot, existingOriginalPath);
        entry.download_status = "reused_existing_original";
        entry.bytes = fs.statSync(existingOriginalPath).size;
        reusedExistingOriginal += 1;
      } else {
        try {
          const { buffer, contentType } = await downloadExternalUrl(row.image_url);
          const extension = extensionFromPathOrType(contentType, row.image_url);
          const absolutePath = path.join(firstPageOriginalRoot, `${row.id}.${extension}`);
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
    }

    items.push(entry);
  }

  const firstPageWithImage = items.filter((item) => item.has_image).length;
  const firstPageMissingImage = items.filter((item) => !item.has_image).length;
  const imageProcessingTargets = items.filter((item) =>
    ["reused_existing_original", "downloaded_external_url"].includes(item.download_status)
  );
  const downloadFailures = items
    .filter((item) => item.download_status.startsWith("failed"))
    .map((item) => ({
      id: item.id,
      brand: item.brand,
      model: item.model,
      category_label: item.category_label,
      image_url: item.image_url,
      error: item.error
    }));

  const summary = {
    generated_at: new Date().toISOString(),
    definition:
      "gear_products where discontinued=false, sorted like /gear/new, then first 12 products per category chip with no search query. This approximates the products currently visible on mobile when checking categories one by one.",
    active_catalog_total: activeRows.length,
    first_page_visible_total: items.length,
    first_page_visible_with_image: firstPageWithImage,
    first_page_visible_missing_image: firstPageMissingImage,
    reused_existing_original: reusedExistingOriginal,
    downloaded_from_external_url: downloadedFromExternalUrl,
    failed_downloads: failedDownloads,
    image_processing_target_count: imageProcessingTargets.length,
    existing_original_directory: path.relative(projectRoot, existingOriginalRoot),
    first_page_original_directory: path.relative(projectRoot, firstPageOriginalRoot),
    brand_distribution: counterToObject(brandDistribution),
    category_distribution: counterToObject(categoryDistribution),
    external_host_distribution: counterToObject(hostDistribution),
    verification_distribution: counterToObject(verificationDistribution),
    download_failures: downloadFailures
  };

  fs.writeFileSync(
    path.join(outRoot, "inventory-catalog-first-page-visible.json"),
    `${JSON.stringify({ summary, items }, null, 2)}\n`
  );

  const lines = [
    "# Gear Image Pipeline Step A - Catalog First Page Visible Inventory",
    "",
    `Generated: ${summary.generated_at}`,
    "",
    "## Definition",
    "",
    summary.definition,
    "",
    "## Summary",
    "",
    `- Active catalog records: ${summary.active_catalog_total}`,
    `- First-page visible records: ${summary.first_page_visible_total}`,
    `- First-page visible with image_url: ${summary.first_page_visible_with_image}`,
    `- First-page visible missing image_url: ${summary.first_page_visible_missing_image}`,
    `- Reused existing originals: ${summary.reused_existing_original}`,
    `- Downloaded external images: ${summary.downloaded_from_external_url}`,
    `- Failed downloads: ${summary.failed_downloads}`,
    `- Current image-processing target count: ${summary.image_processing_target_count}`,
    `- Existing original image directory: ${summary.existing_original_directory}`,
    `- First-page original image directory: ${summary.first_page_original_directory}`,
    "",
    "## Category Distribution",
    ""
  ];

  const categoryEntries = Object.entries(summary.category_distribution);
  lines.push(...(categoryEntries.length ? categoryEntries.map(([key, value]) => `- ${key}: ${value}`) : ["- None"]));

  lines.push("", "## Brand Distribution", "");
  const brandEntries = Object.entries(summary.brand_distribution);
  lines.push(...(brandEntries.length ? brandEntries.map(([key, value]) => `- ${key}: ${value}`) : ["- None"]));

  lines.push("", "## External Host Distribution", "");
  const hostEntries = Object.entries(summary.external_host_distribution);
  lines.push(...(hostEntries.length ? hostEntries.map(([key, value]) => `- ${key}: ${value}`) : ["- None"]));

  lines.push("", "## Download Failures", "");
  lines.push(
    ...(downloadFailures.length
      ? downloadFailures.map((item) => `- ${item.id} ${item.brand || ""} ${item.model || ""}: ${item.error}`)
      : ["- None"]),
    ""
  );

  fs.writeFileSync(
    path.join(outRoot, "inventory-catalog-first-page-visible-summary.md"),
    `${lines.join("\n")}\n`
  );

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
