import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

const brandNormalizationSource = readFileSync(
  new URL("../src/lib/brand-normalization.ts", import.meta.url),
  "utf8"
);

const { outputText } = ts.transpileModule(brandNormalizationSource, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022
  }
});
const brandNormalizationModule = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);
const {
  canonicalizeBrandName,
  getBrandAliasesForQuery,
  normalizeBrandKey
} = brandNormalizationModule;

test("brand key normalization removes case, spacing, and separator differences", () => {
  assert.equal(normalizeBrandKey("mont-bell"), normalizeBrandKey("montbell"));
  assert.equal(normalizeBrandKey("Mont Bell"), normalizeBrandKey("montbell"));
  assert.equal(
    normalizeBrandKey("Black Diamond"),
    normalizeBrandKey("black-diamond")
  );
  assert.equal(
    normalizeBrandKey("THE NORTH FACE"),
    normalizeBrandKey("the north face")
  );
});

test("canonical brand names resolve common English and Japanese aliases", () => {
  assert.equal(canonicalizeBrandName("montbell", ["mont-bell"]), "mont-bell");
  assert.equal(canonicalizeBrandName("Mont Bell", ["mont-bell"]), "mont-bell");
  assert.equal(canonicalizeBrandName("モンベル", ["mont-bell"]), "mont-bell");
  assert.equal(
    canonicalizeBrandName("blackdiamond", ["Black Diamond"]),
    "Black Diamond"
  );
  assert.equal(
    canonicalizeBrandName("ブラックダイヤモンド", ["Black Diamond"]),
    "Black Diamond"
  );
  assert.equal(
    canonicalizeBrandName("the-north-face", ["THE NORTH FACE"]),
    "THE NORTH FACE"
  );
  assert.equal(
    canonicalizeBrandName("ノースフェイス", ["THE NORTH FACE"]),
    "THE NORTH FACE"
  );
  assert.equal(
    canonicalizeBrandName("ザ・ノース・フェイス", ["THE NORTH FACE"]),
    "THE NORTH FACE"
  );
  assert.equal(canonicalizeBrandName("パタゴニア", ["Patagonia"]), "Patagonia");
  assert.equal(canonicalizeBrandName("Thermarest", ["Therm-a-Rest"]), "Therm-a-Rest");
  assert.equal(canonicalizeBrandName(" サーマレスト ", ["Therm-a-Rest"]), "Therm-a-Rest");
});

test("unknown brand names are trimmed without forced lowercasing or translation", () => {
  assert.equal(canonicalizeBrandName("  Mystery Brand  "), "Mystery Brand");
  assert.equal(canonicalizeBrandName("  未知ブランド  "), "未知ブランド");
});

test("brand query aliases include historical raw values for canonical filters", () => {
  assert.deepEqual(getBrandAliasesForQuery("mont-bell", ["mont-bell"]), [
    "mont-bell",
    "montbell",
    "Mont Bell",
    "Montbell",
    "モンベル"
  ]);
  assert.deepEqual(getBrandAliasesForQuery("THE NORTH FACE", ["THE NORTH FACE"]), [
    "THE NORTH FACE",
    "the north face",
    "thenorthface",
    "the-north-face",
    "ノースフェイス",
    "ザノースフェイス",
    "ザ・ノース・フェイス"
  ]);
});
