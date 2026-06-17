import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const gearListSource = readFileSync(
  new URL("../src/components/gear-list.tsx", import.meta.url),
  "utf8"
);
const gearPageSource = readFileSync(
  new URL("../app/(app)/gear/page.tsx", import.meta.url),
  "utf8"
);
const gearDataSource = readFileSync(
  new URL("../src/lib/data/gear.ts", import.meta.url),
  "utf8"
);
const gearActionSource = readFileSync(
  new URL("../src/lib/actions/gear.ts", import.meta.url),
  "utf8"
);
const gearDetailSource = readFileSync(
  new URL("../app/(app)/gear/[id]/page.tsx", import.meta.url),
  "utf8"
);
const gearDisplaySource = readFileSync(
  new URL("../src/lib/gear-display.ts", import.meta.url),
  "utf8"
);
const brandLogoSource = readFileSync(
  new URL("../src/components/brand-logo.tsx", import.meta.url),
  "utf8"
);
const typesSource = readFileSync(new URL("../src/lib/types.ts", import.meta.url), "utf8");

test("gear list supports brand filtering from the gear page query", () => {
  assert.match(typesSource, /brand\?: string/);
  assert.match(gearPageSource, /brand\?: string/);
  assert.match(gearPageSource, /brand: params\.brand/);
  assert.match(gearDataSource, /filters\.brand/);
  assert.match(gearDataSource, /\.eq\("brand", filters\.brand\)/);
  assert.match(gearDataSource, /getUserGearBrands/);
});

test("gear list exposes brand and category-oriented list controls", () => {
  assert.match(gearListSource, /name="brand"/);
  assert.match(gearListSource, /FilterChip/);
  assert.match(gearListSource, /StatusChip/);
  assert.match(gearListSource, /buildGearHref/);
  assert.match(gearListSource, /label="ブランド"/);
  assert.match(gearListSource, /のカテゴリー/);
  assert.match(gearListSource, /BrandLogo/);
  assert.match(gearListSource, /<BrandLogo brand=\{brand\} compact/);
  assert.match(brandLogoSource, /role="img"/);
  assert.match(brandLogoSource, /viewBox=/);
  assert.match(gearDisplaySource, /compareGearBrands/);
});

test("gear list groups registered gear by category without changing cards", () => {
  assert.match(gearListSource, /groupGearByCategory/);
  assert.match(gearListSource, /gearGroups\.map/);
  assert.match(gearListSource, /group\.items\.map/);
  assert.match(gearListSource, /GearCard/);
  assert.match(gearListSource, /formatWeight\(group\.weightGrams\)/);
  assert.match(gearListSource, /InventoryStat/);
  assert.match(gearListSource, /totalWeightGrams/);
  assert.match(gearListSource, /装備庫/);
  assert.match(gearListSource, /divide-y divide-stone-100/);
});

test("gear list and actions provide clear post-save feedback", () => {
  assert.match(gearPageSource, /saved\?: string/);
  assert.match(gearPageSource, /getSavedMessage/);
  assert.match(gearPageSource, /装備を登録しました/);
  assert.match(gearPageSource, /装備を更新しました/);
  assert.match(gearPageSource, /装備を削除しました/);
  assert.match(gearActionSource, /\/gear\?saved=created/);
  assert.match(gearActionSource, /\/gear\?saved=updated/);
  assert.match(gearActionSource, /\/gear\?saved=deleted/);
});

test("gear delete action is kept on the detail page instead of the dense list", () => {
  assert.doesNotMatch(gearListSource, /deleteGear/);
  assert.doesNotMatch(gearListSource, /この装備を削除/);
  assert.match(gearDetailSource, /装備の管理/);
  assert.match(gearDetailSource, /deleteGear\.bind\(null, gear\.id\)/);
  assert.match(gearDetailSource, /この装備を削除/);
});

test("gear detail page uses user-facing Japanese labels instead of internal field names", () => {
  assert.match(gearDetailSource, /カタログ確認/);
  assert.match(gearDetailSource, /確認日/);
  assert.match(gearDetailSource, /価格ソース/);
  assert.match(gearDetailSource, /写真未登録/);
  assert.match(gearDetailSource, /購入情報/);
  assert.match(gearDetailSource, /公式情報/);
  assert.doesNotMatch(gearDetailSource, />verification_status</);
  assert.doesNotMatch(gearDetailSource, />last_verified_at</);
  assert.doesNotMatch(gearDetailSource, />MSRP source</);
});

test("gear display helpers avoid showing unknown weights as zero grams", () => {
  assert.match(gearDisplaySource, /getGearDisplayWeightLabel/);
  assert.match(gearDisplaySource, /item\.weight_grams > 0/);
  assert.match(gearDisplaySource, /return typeof grams === "number" \? formatWeight\(grams\) : "-"/);
  assert.match(gearListSource, /getGearDisplayWeightLabel\(item\)/);
});
