import fs from "node:fs";

const manifest = JSON.parse(
  fs.readFileSync("tmp/gear-images/step-b-catalog-first-page-visible-manifest.json", "utf8")
);

function sqlString(value) {
  if (value == null || value === "") {
    return "null";
  }

  return `'${String(value).replaceAll("'", "''")}'`;
}

const values = manifest.processed
  .map((item) => `  (${sqlString(item.id)}::uuid, ${sqlString(item.source_image_url)}::text)`)
  .join(",\n");

const sql = [
  "-- Rollback to original source image URLs captured before Step C upload.",
  "-- Apply only if you need to restore the official/external source URLs.",
  "update public.gear_products as p",
  "set image_url = v.original_image_url",
  "from (values",
  values,
  ") as v(id, original_image_url)",
  "where p.id = v.id;",
  ""
].join("\n");

fs.writeFileSync("tmp/gear-images/step-c-first-page-visible-rollback-to-original.sql", sql);

console.log(JSON.stringify({
  rows: manifest.processed.length,
  path: "tmp/gear-images/step-c-first-page-visible-rollback-to-original.sql"
}, null, 2));
