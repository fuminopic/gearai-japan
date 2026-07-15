import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const migrationSource = readFileSync(
  new URL("../supabase/migrations/20260715132756_user_pack_items.sql", import.meta.url),
  "utf8"
);
const packSummarySource = readFileSync(
  new URL("../src/lib/pack-summary.ts", import.meta.url),
  "utf8"
);
const majorCategoriesSource = readFileSync(
  new URL("../src/lib/gear-major-categories.ts", import.meta.url),
  "utf8"
);
const packDataSource = readFileSync(
  new URL("../src/lib/data/pack.ts", import.meta.url),
  "utf8"
);
const packActionsSource = readFileSync(
  new URL("../src/lib/actions/pack.ts", import.meta.url),
  "utf8"
);
const packPageSource = readFileSync(
  new URL("../app/(app)/pack/page.tsx", import.meta.url),
  "utf8"
);
const packSelectPageSource = readFileSync(
  new URL("../app/(app)/pack/select/page.tsx", import.meta.url),
  "utf8"
);
const selectorSource = readFileSync(
  new URL("../src/components/pack-gear-selector.tsx", import.meta.url),
  "utf8"
);
const removeButtonSource = readFileSync(
  new URL("../src/components/pack-remove-button.tsx", import.meta.url),
  "utf8"
);
const packContentsSource = readFileSync(
  new URL("../src/components/pack-contents.tsx", import.meta.url),
  "utf8"
);
const dashboardDataSource = readFileSync(
  new URL("../src/lib/data/dashboard.ts", import.meta.url),
  "utf8"
);
const dashboardPageSource = readFileSync(
  new URL("../app/(app)/dashboard/page.tsx", import.meta.url),
  "utf8"
);

const majorCategoriesDataUrl = await toTranspiledDataUrl(majorCategoriesSource);
const { buildPackSummary, getPackItemWeightGrams } = await importTranspiled(
  packSummarySource.replace(
    'from "@/lib/gear-major-categories"',
    `from "${majorCategoriesDataUrl}"`
  )
);

function gear(overrides = {}) {
  return {
    id: "gear-id",
    name: "テスト装備",
    brand: null,
    model: null,
    category_id: "backpack",
    subcategory_id: null,
    weight_grams: 0,
    official_weight_grams: null,
    gear_categories: { id: "backpack", name_ja: "ザック", name_en: "backpack" },
    gear_subcategories: null,
    ...overrides
  };
}

test("pack migration keeps a one-pack relation with cascade cleanup and RLS", () => {
  assert.match(migrationSource, /create table public\.user_pack_items/);
  assert.match(migrationSource, /primary key \(user_id, gear_id\)/);
  assert.match(migrationSource, /references public\.user_gear\(id\) on delete cascade/);
  assert.match(migrationSource, /alter table public\.user_pack_items enable row level security/);
  assert.match(migrationSource, /revoke all privileges\s+on table public\.user_pack_items\s+from anon, authenticated/);
  assert.match(migrationSource, /grant select, insert, delete on table public\.user_pack_items to authenticated/);
  assert.match(migrationSource, /user_pack_items_select_own/);
  assert.match(migrationSource, /user_pack_items_delete_own/);
  assert.match(migrationSource, /user_pack_items_insert_own_owned_gear/);
  assert.match(migrationSource, /user_gear\.user_id = user_pack_items\.user_id/);
  assert.match(migrationSource, /user_gear\.status = 'owned'/);
  assert.doesNotMatch(migrationSource, /plan_id|pack_name|template/i);
});

test("pack summary counts weight-less gear without adding it to known weight", () => {
  const unknown = gear({ id: "unknown" });
  const known = gear({
    id: "known",
    category_id: "clothing",
    weight_grams: 0,
    official_weight_grams: 350,
    gear_categories: { id: "clothing", name_ja: "ウェア", name_en: "clothing" }
  });
  const summary = buildPackSummary([unknown, known]);

  assert.equal(getPackItemWeightGrams(unknown), null);
  assert.equal(getPackItemWeightGrams(known), 350);
  assert.equal(summary.itemCount, 2);
  assert.equal(summary.knownWeightG, 350);
  assert.equal(summary.missingWeightCount, 1);
  assert.equal(summary.categoryWeights[0].weightG, 350);
});

test("pack actions recheck owned ownership, deduplicate, and only remove the relation", () => {
  assert.match(packActionsSource, /\.eq\("user_id", user\.id\)/);
  assert.match(packActionsSource, /\.eq\("status", "owned"\)/);
  assert.match(packActionsSource, /\.in\("id", uniqueIds\)/);
  assert.match(packActionsSource, /new Set\(gearIds\.filter\(isUuid\)\)/);
  assert.match(packActionsSource, /onConflict: "user_id,gear_id", ignoreDuplicates: true/);
  assert.match(packActionsSource, /\.from\("user_pack_items"\)[\s\S]*\.delete\(\)/);
  const removeActionSource = packActionsSource.slice(
    packActionsSource.indexOf("export async function removePackItem")
  );
  assert.doesNotMatch(removeActionSource, /\.from\("user_gear"\)/);
  assert.match(packActionsSource, /revalidatePath\("\/dashboard"\)/);
});

test("pack data filters pack membership through currently owned gear", () => {
  assert.match(packDataSource, /getUserGear\(\{ status: "owned" \}\)/);
  assert.match(packDataSource, /flatMap/);
  assert.match(packDataSource, /\.from\("user_pack_items"\)/);
});

test("pack pages provide grouped contents, accessible direct removal, and a multi-select add flow", () => {
  assert.match(packPageSource, /マイパック/);
  assert.match(packPageSource, /装備庫から追加/);
  assert.match(packPageSource, /PackContents/);
  assert.doesNotMatch(packPageSource, /重量未入力/);
  assert.match(packContentsSource, /grid-cols-2/);
  assert.doesNotMatch(packContentsSource, /重量未入力/);
  assert.match(packContentsSource, /weightG === null \? null/);
  assert.match(packContentsSource, /setItems\(\(current\) => current\.filter/);
  assert.match(packContentsSource, /removePackItem\(item\.id\)/);
  assert.match(packContentsSource, /restorePackItem/);
  assert.match(packContentsSource, /router\.refresh\(\)/);
  assert.match(packSelectPageSource, /PackGearSelector/);
  assert.match(selectorSource, /装備名・ブランドで検索/);
  assert.match(selectorSource, /getCategories/);
  assert.match(selectorSource, /new Set\(packGearIds\)/);
  assert.match(selectorSource, /選択した\$\{selectedCount\}点を追加/);
  assert.match(selectorSource, /h-12 w-full/);
  assert.match(removeButtonSource, /aria-label="パックから外す"/);
  assert.match(removeButtonSource, /h-11 w-11/);
  assert.match(removeButtonSource, /h-7 w-7/);
  assert.match(removeButtonSource, /bg-red-800/);
});

test("dashboard derives pack metrics and composition only from current owned pack gear", () => {
  assert.match(dashboardDataSource, /\.from\("user_pack_items"\)/);
  assert.match(dashboardDataSource, /gear\.filter\(\(item\) => item\.status === "owned"\)/);
  assert.match(dashboardDataSource, /buildPackSummary\(ownedGear\.filter/);
  assert.match(dashboardPageSource, /packItemCount/);
  assert.match(dashboardPageSource, /packKnownWeightG/);
  assert.match(dashboardPageSource, /パック重量構成/);
  assert.match(dashboardPageSource, /マイパック &gt;/);
  assert.doesNotMatch(dashboardPageSource, /重量未入力/);
  assert.match(dashboardPageSource, /マイパックはまだ空です/);
  assert.doesNotMatch(dashboardPageSource, /summary\.totalWeightG/);
});

async function importTranspiled(source) {
  return import(await toTranspiledDataUrl(source));
}

async function toTranspiledDataUrl(source) {
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
     target: ts.ScriptTarget.ES2022
    }
  });

  return `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`;
}
