import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("..", import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), "utf8");
}

test("haptics wrapper is native-only, best-effort, and uses official enum values", async () => {
  const wrapper = await source("src/lib/haptics.ts");

  assert.match(wrapper, /Capacitor\.isNativePlatform\(\)/);
  assert.match(wrapper, /import\("@capacitor\/haptics"\)/);
  assert.match(wrapper, /ImpactStyle\.Light/);
  assert.match(wrapper, /NotificationType\.Success/);
  assert.match(wrapper, /NotificationType\.Error/);
  assert.match(wrapper, /export function hapticLight/);
  assert.match(wrapper, /export function hapticSelection/);
  assert.match(wrapper, /export function hapticSuccess/);
  assert.match(wrapper, /export function hapticError/);
});

test("haptics are wired once at the intended interaction boundaries", async () => {
  const files = {
    bottomNav: await source("src/components/app-bottom-nav.tsx"),
    packControls: await source("src/components/gear-pack-controls.tsx"),
    packSelector: await source("src/components/pack-gear-selector.tsx"),
    foodWater: await source("src/components/plan-food-water-settings.tsx"),
    gearForm: await source("src/components/gear-form.tsx"),
    planForm: await source("src/components/trip-planning-form.tsx"),
    planUi: await source("src/components/trip-planning-ui.tsx")
  };

  assert.match(files.bottomNav, /onClick=\{\(\) => \{[\s\S]*hapticLight\(\)/);
  assert.match(files.packControls, /hapticSelection\(\);/);
  assert.match(files.packSelector, /hapticSuccess\(\);/);
  assert.match(files.packSelector, /hapticError\(\);/);
  assert.match(files.foodWater, /hapticSelection\(\);/);
  assert.match(files.gearForm, /hapticSuccess\(\);/);
  assert.match(files.gearForm, /hapticError\(\);/);
  assert.match(files.planForm, /hapticSelection\(\);/);
  assert.match(files.planForm, /hapticLight\(\);/);
  assert.match(files.planUi, /hapticSuccess\(\);/);
  assert.match(files.planUi, /hapticError\(\);/);
});

test("Capacitor Haptics is in the web and iOS dependency manifests", async () => {
  const packageJson = await source("package.json");
  const packageSwift = await source("ios/App/CapApp-SPM/Package.swift");

  assert.match(packageJson, /"@capacitor\/haptics": "\^8/);
  assert.match(packageSwift, /CapacitorHaptics/);
});
