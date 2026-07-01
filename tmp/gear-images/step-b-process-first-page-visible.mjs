import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const projectRoot = process.cwd();
const outRoot = path.join(projectRoot, "tmp", "gear-images");
const inventoryPath = path.join(outRoot, "inventory-catalog-first-page-visible.json");
const processedRoot = path.join(outRoot, "processed", "catalog-first-page-visible");
const qaRoot = path.join(outRoot, "qa");
const manifestPath = path.join(outRoot, "step-b-catalog-first-page-visible-manifest.json");
const summaryPath = path.join(outRoot, "step-b-catalog-first-page-visible-summary.md");

const CANVAS_SIZE = 512;
const CONTACT_CELL_SIZE = 144;
const CONTACT_LABEL_HEIGHT = 48;
const CONTACT_COLS = 6;

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function escapeXml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function truncateLabel(value, maxLength = 32) {
  const text = String(value ?? "");
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function getProcessingTargets(inventory) {
  return inventory.items.filter((item) =>
    ["reused_existing_original", "downloaded_external_url"].includes(item.download_status)
  );
}

function getAbsoluteDownloadedPath(item) {
  if (!item.downloaded_path) {
    return null;
  }

  return path.join(projectRoot, item.downloaded_path);
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 255;
}

function estimateEdgeBackground(data, width, height) {
  const patch = Math.max(4, Math.min(24, Math.floor(Math.min(width, height) / 18)));
  const samples = [];

  const addPatch = (startX, startY) => {
    for (let y = startY; y < Math.min(height, startY + patch); y += 1) {
      for (let x = startX; x < Math.min(width, startX + patch); x += 1) {
        const i = (y * width + x) * 4;
        const alpha = data[i + 3];
        if (alpha < 8) {
          continue;
        }

        samples.push([data[i], data[i + 1], data[i + 2]]);
      }
    }
  };

  addPatch(0, 0);
  addPatch(Math.max(0, width - patch), 0);
  addPatch(0, Math.max(0, height - patch));
  addPatch(Math.max(0, width - patch), Math.max(0, height - patch));

  if (!samples.length) {
    return { r: 255, g: 255, b: 255 };
  }

  return {
    r: median(samples.map((item) => item[0])),
    g: median(samples.map((item) => item[1])),
    b: median(samples.map((item) => item[2]))
  };
}

function colorDistance(r, g, b, bg) {
  return Math.hypot(r - bg.r, g - bg.g, b - bg.b);
}

function isBackgroundCandidate(r, g, b, alpha, bg) {
  if (alpha < 8) {
    return true;
  }

  const brightness = (r + g + b) / 3;
  const span = Math.max(r, g, b) - Math.min(r, g, b);
  const distance = colorDistance(r, g, b, bg);
  const bgBrightness = (bg.r + bg.g + bg.b) / 3;

  if (distance < 30) {
    return true;
  }

  if (bgBrightness > 180 && brightness > 235 && span < 34) {
    return true;
  }

  if (bgBrightness > 180 && brightness > 205 && distance < 72) {
    return true;
  }

  return false;
}

function getEdgeConnectedBackground(data, width, height, bg) {
  const pixelCount = width * height;
  const candidate = new Uint8Array(pixelCount);
  const visited = new Uint8Array(pixelCount);
  const queue = new Int32Array(pixelCount);
  let head = 0;
  let tail = 0;

  for (let index = 0; index < pixelCount; index += 1) {
    const i = index * 4;
    candidate[index] = isBackgroundCandidate(
      data[i],
      data[i + 1],
      data[i + 2],
      data[i + 3],
      bg
    )
      ? 1
      : 0;
  }

  const enqueue = (index) => {
    if (!candidate[index] || visited[index]) {
      return;
    }
    visited[index] = 1;
    queue[tail] = index;
    tail += 1;
  };

  for (let x = 0; x < width; x += 1) {
    enqueue(x);
    enqueue((height - 1) * width + x);
  }

  for (let y = 1; y < height - 1; y += 1) {
    enqueue(y * width);
    enqueue(y * width + width - 1);
  }

  while (head < tail) {
    const index = queue[head];
    head += 1;
    const x = index % width;
    const y = Math.floor(index / width);

    if (x > 0) enqueue(index - 1);
    if (x < width - 1) enqueue(index + 1);
    if (y > 0) enqueue(index - width);
    if (y < height - 1) enqueue(index + width);
  }

  return visited;
}

function removeEdgeBackground(raw) {
  const { data, info } = raw;
  const { width, height } = info;
  const bg = estimateEdgeBackground(data, width, height);
  const connected = getEdgeConnectedBackground(data, width, height, bg);
  const output = Buffer.from(data);
  let transparentPixels = 0;

  for (let index = 0; index < connected.length; index += 1) {
    if (!connected[index]) {
      continue;
    }

    const alphaIndex = index * 4 + 3;
    if (output[alphaIndex] !== 0) {
      transparentPixels += 1;
    }
    output[alphaIndex] = 0;
  }

  return {
    data: output,
    info,
    background: bg,
    transparentPixels
  };
}

function findAlphaBounds(data, width, height) {
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha < 8) {
        continue;
      }

      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }

  if (right < left || bottom < top) {
    return null;
  }

  const margin = Math.max(3, Math.round(Math.max(right - left + 1, bottom - top + 1) * 0.012));

  return {
    left: Math.max(0, left - margin),
    top: Math.max(0, top - margin),
    right: Math.min(width - 1, right + margin),
    bottom: Math.min(height - 1, bottom + margin)
  };
}

async function normalizeToCanvas(inputPath, outputPath) {
  const raw = await sharp(inputPath, { failOn: "none" })
    .rotate()
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const backgroundRemoved = removeEdgeBackground(raw);
  const sourceWidth = backgroundRemoved.info.width;
  const sourceHeight = backgroundRemoved.info.height;
  const bounds = findAlphaBounds(backgroundRemoved.data, sourceWidth, sourceHeight);

  if (!bounds) {
    throw new Error("No non-transparent product pixels found after background removal");
  }

  const cropWidth = bounds.right - bounds.left + 1;
  const cropHeight = bounds.bottom - bounds.top + 1;
  const normalized = await sharp(backgroundRemoved.data, {
    raw: {
      width: sourceWidth,
      height: sourceHeight,
      channels: 4
    }
  })
    .extract({
      left: bounds.left,
      top: bounds.top,
      width: cropWidth,
      height: cropHeight
    })
    .resize({
      width: CANVAS_SIZE,
      height: CANVAS_SIZE,
      fit: "inside",
      withoutEnlargement: false,
      kernel: sharp.kernel.lanczos3
    })
    .png()
    .toBuffer({ resolveWithObject: true });

  const width = normalized.info.width;
  const height = normalized.info.height;
  const left = Math.max(0, Math.floor((CANVAS_SIZE - width) / 2));
  const top = Math.max(0, Math.floor((CANVAS_SIZE - height) / 2));

  await sharp({
    create: {
      width: CANVAS_SIZE,
      height: CANVAS_SIZE,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 0 }
    }
  })
    .composite([{ input: normalized.data, left, top }])
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(outputPath);

  return {
    source_width: sourceWidth,
    source_height: sourceHeight,
    crop_left: bounds.left,
    crop_top: bounds.top,
    crop_width: cropWidth,
    crop_height: cropHeight,
    placed_width: width,
    placed_height: height,
    offset_left: left,
    offset_top: top,
    background_rgb: backgroundRemoved.background,
    removed_edge_background_pixels: backgroundRemoved.transparentPixels
  };
}

function buildContactSheetSvg(items) {
  const rows = Math.ceil(items.length / CONTACT_COLS);
  const width = CONTACT_COLS * CONTACT_CELL_SIZE;
  const height = rows * (CONTACT_CELL_SIZE + CONTACT_LABEL_HEIGHT);
  const blocks = [];

  for (const [index, item] of items.entries()) {
    const col = index % CONTACT_COLS;
    const row = Math.floor(index / CONTACT_COLS);
    const x = col * CONTACT_CELL_SIZE;
    const y = row * (CONTACT_CELL_SIZE + CONTACT_LABEL_HEIGHT);
    const href = `data:image/png;base64,${fs.readFileSync(item.output_absolute_path).toString("base64")}`;
    const label = truncateLabel(`${item.brand || ""} ${item.model || item.name_ja || ""}`.trim(), 24);
    const category = truncateLabel(item.category_label || "", 18);

    blocks.push(`
      <rect x="${x}" y="${y}" width="${CONTACT_CELL_SIZE}" height="${CONTACT_CELL_SIZE + CONTACT_LABEL_HEIGHT}" fill="#f8f8f5"/>
      <rect x="${x + 8}" y="${y + 8}" width="${CONTACT_CELL_SIZE - 16}" height="${CONTACT_CELL_SIZE - 16}" rx="12" fill="url(#checker)"/>
      <image href="${href}" x="${x + 8}" y="${y + 8}" width="${CONTACT_CELL_SIZE - 16}" height="${CONTACT_CELL_SIZE - 16}" preserveAspectRatio="xMidYMid meet"/>
      <text x="${x + 10}" y="${y + CONTACT_CELL_SIZE + 16}" font-family="Helvetica, Arial, sans-serif" font-size="9" font-weight="700" fill="#111">${escapeXml(label)}</text>
      <text x="${x + 10}" y="${y + CONTACT_CELL_SIZE + 31}" font-family="Helvetica, Arial, sans-serif" font-size="8" fill="#666">${escapeXml(category)}</text>
    `);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <pattern id="checker" width="16" height="16" patternUnits="userSpaceOnUse">
      <rect width="16" height="16" fill="#ffffff"/>
      <rect width="8" height="8" fill="#e8eee9"/>
      <rect x="8" y="8" width="8" height="8" fill="#e8eee9"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="#f8f8f5"/>
  ${blocks.join("\n")}
</svg>`;
}

async function writeContactSheet(processedItems) {
  ensureDir(qaRoot);
  const svg = buildContactSheetSvg(processedItems);
  const sheetPath = path.join(qaRoot, "step-b-catalog-first-page-visible-contact-sheet.png");

  await sharp(Buffer.from(svg)).png().toFile(sheetPath);

  return sheetPath;
}

async function main() {
  ensureDir(processedRoot);
  ensureDir(qaRoot);

  const inventory = JSON.parse(fs.readFileSync(inventoryPath, "utf8"));
  const targets = getProcessingTargets(inventory);
  const processed = [];
  const failures = [];

  for (const item of targets) {
    const inputPath = getAbsoluteDownloadedPath(item);
    const outputPath = path.join(processedRoot, `${item.id}.png`);

    if (!inputPath || !fs.existsSync(inputPath)) {
      failures.push({
        id: item.id,
        brand: item.brand,
        model: item.model,
        error: "Original image file not found"
      });
      continue;
    }

    try {
      const metrics = await normalizeToCanvas(inputPath, outputPath);
      const stats = fs.statSync(outputPath);
      processed.push({
        id: item.id,
        brand: item.brand,
        model: item.model,
        name_ja: item.name_ja,
        category_label: item.category_label,
        source_image_url: item.image_url,
        input_path: path.relative(projectRoot, inputPath),
        output_path: path.relative(projectRoot, outputPath),
        output_absolute_path: outputPath,
        bytes: stats.size,
        ...metrics
      });
    } catch (error) {
      failures.push({
        id: item.id,
        brand: item.brand,
        model: item.model,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  const contactSheetPath = await writeContactSheet(processed);
  const manifest = {
    generated_at: new Date().toISOString(),
    source_inventory: path.relative(projectRoot, inventoryPath),
    definition:
      "512x512 transparent PNGs for the current /gear/new first-page-visible catalog products with images.",
    target_count: targets.length,
    processed_count: processed.length,
    failure_count: failures.length,
    output_directory: path.relative(projectRoot, processedRoot),
    contact_sheet: path.relative(projectRoot, contactSheetPath),
    processed: processed.map(({ output_absolute_path, ...item }) => item),
    failures
  };

  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const lines = [
    "# Gear Image Pipeline Step B - Catalog First Page Visible Processing",
    "",
    `Generated: ${manifest.generated_at}`,
    "",
    "## Summary",
    "",
    `- Source inventory: ${manifest.source_inventory}`,
    `- Target count: ${manifest.target_count}`,
    `- Processed count: ${manifest.processed_count}`,
    `- Failure count: ${manifest.failure_count}`,
    `- Output directory: ${manifest.output_directory}`,
    `- Contact sheet: ${manifest.contact_sheet}`,
    "",
    "## Failures",
    "",
    ...(failures.length
      ? failures.map((item) => `- ${item.id} ${item.brand || ""} ${item.model || ""}: ${item.error}`)
      : ["- None"]),
    ""
  ];

  fs.writeFileSync(summaryPath, `${lines.join("\n")}\n`);

  console.log(JSON.stringify({
    target_count: manifest.target_count,
    processed_count: manifest.processed_count,
    failure_count: manifest.failure_count,
    output_directory: manifest.output_directory,
    contact_sheet: manifest.contact_sheet
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
