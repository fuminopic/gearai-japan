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
  assert.match(gearListSource, /aria-label="ブランド"/);
  assert.match(gearListSource, /ブランドを選択/);
  assert.match(gearListSource, /sm:grid-cols-4/);
});

test("gear list groups registered gear by category without changing cards", () => {
  assert.match(gearListSource, /groupGearByCategory/);
  assert.match(gearListSource, /gearGroups\.map/);
  assert.match(gearListSource, /group\.items\.map/);
  assert.match(gearListSource, /GearCard/);
  assert.match(gearListSource, /formatWeight\(group\.weightGrams\)/);
});
