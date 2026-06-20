import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { test } from "node:test";

const brandLogoSource = readFileSync(
  new URL("../src/components/brand-logo.tsx", import.meta.url),
  "utf8"
);

const logoFiles = [
  "columbia.png",
  "millet.png",
  "arcteryx.png",
  "patagonia.png",
  "gregory.png",
  "la-sportiva.png",
  "mammut.png"
];

test("popular Japan brand logos are wired into BrandLogo", () => {
  for (const logoFile of logoFiles) {
    assert.match(brandLogoSource, new RegExp(`/brand-logos/${logoFile}`));
  }

  for (const normalizedBrand of [
    "columbia",
    "millet",
    "arcteryx",
    "patagonia",
    "gregory",
    "lasportiva",
    "mammut"
  ]) {
    assert.match(brandLogoSource, new RegExp(`${normalizedBrand}:`));
  }
});

test("popular Japan brand logos follow the existing 575x203 PNG asset spec", () => {
  for (const logoFile of logoFiles) {
    const assetUrl = new URL(`../public/brand-logos/${logoFile}`, import.meta.url);
    assert.equal(existsSync(assetUrl), true, `${logoFile} missing`);

    const metadata = execFileSync("sips", ["-g", "pixelWidth", "-g", "pixelHeight", assetUrl.pathname], {
      encoding: "utf8"
    });
    assert.match(metadata, /pixelWidth: 575/);
    assert.match(metadata, /pixelHeight: 203/);
  }
});
