import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const projectRoot = process.cwd();
const outRoot = path.join(projectRoot, "tmp", "gear-images");
const manifestPath = path.join(outRoot, "step-b-catalog-first-page-visible-manifest.json");
const backupPath = path.join(outRoot, "step-c-first-page-visible-backup.json");
const rollbackSqlPath = path.join(outRoot, "step-c-first-page-visible-rollback.sql");
const reportPath = path.join(outRoot, "step-c-first-page-visible-report.json");

const BUCKET = "gear-images-processed";
const STORAGE_PREFIX = "gear-products/first-page-visible";
const dryRun = process.argv.includes("--dry-run");

function parseDotenv(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const env = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const index = trimmed.indexOf("=");
    if (index === -1) {
      continue;
    }

    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }

  return env;
}

function requireEnv() {
  const fileEnv = parseDotenv(path.join(projectRoot, ".env.local"));
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || fileEnv.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_ACCESS_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL in .env.local or environment.");
  }

  if (!serviceKey || serviceKey.includes("ここ") || serviceKey.includes("这里")) {
    throw new Error(
      "Missing SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY. Use the Supabase Secret key or service_role key."
    );
  }

  return { supabaseUrl, serviceKey };
}

function sqlString(value) {
  if (value == null) {
    return "null";
  }
  return `'${String(value).replaceAll("'", "''")}'`;
}

async function ensureBucket(supabase) {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    throw new Error(`Failed to list storage buckets: ${listError.message}`);
  }

  if (buckets?.some((bucket) => bucket.name === BUCKET)) {
    return "existing";
  }

  if (dryRun) {
    return "would_create";
  }

  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: "5MB",
    allowedMimeTypes: ["image/png"]
  });

  if (error) {
    throw new Error(`Failed to create storage bucket ${BUCKET}: ${error.message}`);
  }

  return "created";
}

async function fetchCurrentRows(supabase, ids) {
  const { data, error } = await supabase
    .from("gear_products")
    .select("id, brand, model, name_ja, image_url")
    .in("id", ids);

  if (error) {
    throw new Error(`Failed to fetch current gear_products rows: ${error.message}`);
  }

  return data ?? [];
}

async function uploadPng(supabase, item) {
  const absolutePath = path.join(projectRoot, item.output_path);
  const storagePath = `${STORAGE_PREFIX}/${item.id}.png`;

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Processed PNG not found: ${item.output_path}`);
  }

  if (!dryRun) {
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, fs.readFileSync(absolutePath), {
        cacheControl: "31536000",
        contentType: "image/png",
        upsert: true
      });

    if (error) {
      throw new Error(`Upload failed for ${item.id}: ${error.message}`);
    }
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return {
    storage_path: storagePath,
    public_url: data.publicUrl
  };
}

async function updateImageUrl(supabase, id, publicUrl) {
  if (dryRun) {
    return;
  }

  const { error } = await supabase.from("gear_products").update({ image_url: publicUrl }).eq("id", id);

  if (error) {
    throw new Error(`DB update failed for ${id}: ${error.message}`);
  }
}

async function main() {
  const { supabaseUrl, serviceKey } = requireEnv();
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const targets = manifest.processed ?? [];
  const ids = targets.map((item) => item.id);

  if (!targets.length) {
    throw new Error(`No processed items found in ${manifestPath}`);
  }

  const bucketStatus = await ensureBucket(supabase);
  const currentRows = await fetchCurrentRows(supabase, ids);
  const currentById = new Map(currentRows.map((row) => [row.id, row]));
  const missingRows = ids.filter((id) => !currentById.has(id));

  if (missingRows.length) {
    throw new Error(`Target rows missing from gear_products: ${missingRows.join(", ")}`);
  }

  const backup = {
    generated_at: new Date().toISOString(),
    dry_run: dryRun,
    bucket: BUCKET,
    storage_prefix: STORAGE_PREFIX,
    source_manifest: path.relative(projectRoot, manifestPath),
    rows: targets.map((item) => {
      const current = currentById.get(item.id);
      return {
        id: item.id,
        brand: current.brand,
        model: current.model,
        name_ja: current.name_ja,
        previous_image_url: current.image_url,
        processed_output_path: item.output_path
      };
    })
  };

  fs.writeFileSync(backupPath, `${JSON.stringify(backup, null, 2)}\n`);

  const rollbackSql = [
    "-- Rollback for Step C first-page-visible processed gear product images.",
    "-- Apply only if you need to restore the original external image URLs.",
    "update public.gear_products as p",
    "set image_url = v.previous_image_url",
    "from (values",
    backup.rows
      .map((row) => `  (${sqlString(row.id)}::uuid, ${sqlString(row.previous_image_url)}::text)`)
      .join(",\n"),
    ") as v(id, previous_image_url)",
    "where p.id = v.id;",
    ""
  ].join("\n");
  fs.writeFileSync(rollbackSqlPath, rollbackSql);

  const uploaded = [];
  const failures = [];

  for (const item of targets) {
    try {
      const upload = await uploadPng(supabase, item);
      await updateImageUrl(supabase, item.id, upload.public_url);
      uploaded.push({
        id: item.id,
        brand: item.brand,
        model: item.model,
        output_path: item.output_path,
        ...upload
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

  const report = {
    generated_at: new Date().toISOString(),
    dry_run: dryRun,
    bucket_status: bucketStatus,
    target_count: targets.length,
    uploaded_count: uploaded.length,
    failure_count: failures.length,
    backup_path: path.relative(projectRoot, backupPath),
    rollback_sql_path: path.relative(projectRoot, rollbackSqlPath),
    report_path: path.relative(projectRoot, reportPath),
    uploaded,
    failures
  };

  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

  console.log(JSON.stringify({
    dry_run: report.dry_run,
    bucket_status: report.bucket_status,
    target_count: report.target_count,
    uploaded_count: report.uploaded_count,
    failure_count: report.failure_count,
    backup_path: report.backup_path,
    rollback_sql_path: report.rollback_sql_path,
    report_path: report.report_path
  }, null, 2));

  if (failures.length) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
