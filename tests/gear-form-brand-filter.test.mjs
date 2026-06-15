import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const gearFormSource = readFileSync(
  new URL("../src/components/gear-form.tsx", import.meta.url),
  "utf8"
);

test("gear add form exposes a product brand filter beside product search", () => {
  assert.match(gearFormSource, /brandFilter/);
  assert.match(gearFormSource, /<option value="all">すべて<\/option>/);
  assert.match(gearFormSource, /sm:grid-cols-\[minmax\(0,1fr\)_12rem\]/);
  assert.match(gearFormSource, /productsForBrand/);
});

test("gear add form keeps common Japanese outdoor brands at the top", () => {
  for (const brand of [
    "mont-bell",
    "THE NORTH FACE",
    "Black Diamond",
    "NANGA",
    "ISUKA",
    "NEMO",
    "Therm-a-Rest",
    "SOTO"
  ]) {
    assert.match(gearFormSource, new RegExp(`"${brand}"`));
  }

  assert.match(gearFormSource, /compareProductBrands/);
});
