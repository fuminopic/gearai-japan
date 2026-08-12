import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const migrationSource = readFileSync(
  new URL(
    "../supabase/migrations/20260812041946_enforce_manual_gear_updates.sql",
    import.meta.url
  ),
  "utf8"
);
const imagePathMigrationSource = readFileSync(
  new URL(
    "../supabase/migrations/20260812055247_enforce_user_gear_image_storage_path_owner.sql",
    import.meta.url
  ),
  "utf8"
);
const gearActionsSource = readFileSync(
  new URL("../src/lib/actions/gear.ts", import.meta.url),
  "utf8"
);
const packActionsSource = readFileSync(
  new URL("../src/lib/actions/pack.ts", import.meta.url),
  "utf8"
);

test("the user_gear UPDATE policy permits only the owner to update manual gear", () => {
  assert.match(migrationSource, /^begin;/m);
  assert.match(
    migrationSource,
    /drop policy if exists "user_gear_update_own" on public\.user_gear;/
  );
  assert.match(
    migrationSource,
    /create policy "user_gear_update_own"[\s\S]*?on public\.user_gear[\s\S]*?for update[\s\S]*?to authenticated/
  );

  const ownerAndManual = /\(select auth\.uid\(\)\) = user_id\s*and product_id is null/gi;
  assert.equal(
    (migrationSource.match(ownerAndManual) ?? []).length,
    2,
    "both USING and WITH CHECK must restrict the owner and product_id"
  );
  assert.match(migrationSource, /commit;/);
});

test("the migration changes only user_gear UPDATE authorization", () => {
  assert.doesNotMatch(migrationSource, /create table|alter table|drop table/i);
  assert.doesNotMatch(migrationSource, /for select|for insert|for delete/i);
  assert.doesNotMatch(migrationSource, /user_pack_items/i);
});

test("the image-path migration keeps the owner/manual boundary and binds image paths to that owner", () => {
  assert.match(imagePathMigrationSource, /^begin;/m);
  assert.match(
    imagePathMigrationSource,
    /drop policy if exists "user_gear_update_own" on public\.user_gear;/
  );
  assert.match(
    imagePathMigrationSource,
    /using \([\s\S]*?\(select auth\.uid\(\)\) = user_id[\s\S]*?and product_id is null[\s\S]*?\)/
  );
  assert.match(
    imagePathMigrationSource,
    /with check \([\s\S]*?\(select auth\.uid\(\)\) = user_id[\s\S]*?and product_id is null[\s\S]*?image_storage_path is null[\s\S]*?split_part\(image_storage_path, '\/', 1\) = \(select auth\.uid\(\)\)::text[\s\S]*?\)/
  );
  assert.doesNotMatch(imagePathMigrationSource, /create table|alter table|drop table/i);
  assert.doesNotMatch(imagePathMigrationSource, /for select|for insert|for delete/i);
  assert.doesNotMatch(imagePathMigrationSource, /storage\.objects|storage\.buckets|user_pack_items/i);
  assert.match(imagePathMigrationSource, /commit;/);
});

test("existing Web mutations retain the manual-only boundary and Pack writes stay separate", () => {
  assert.match(gearActionsSource, /\.eq\("user_id", user\.id\)[\s\S]*?\.is\("product_id", null\)/);
  assert.match(packActionsSource, /\.from\("user_pack_items"\)\s*\.upsert/);
  assert.match(
    packActionsSource,
    /\.from\("user_pack_items"\)[\s\S]*?\.delete\(\)/
  );
  assert.doesNotMatch(packActionsSource, /\.from\("user_gear"\)\.update/);
});
