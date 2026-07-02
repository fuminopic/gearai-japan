import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const rootUrl = new URL("../", import.meta.url);

function readSource(relativePath) {
  return readFileSync(new URL(relativePath, rootUrl), "utf8");
}

function readSourceTree(relativeDir) {
  const dirPath = fileURLToPath(new URL(`${relativeDir}/`, rootUrl));
  const sources = [];
  const allowedExtensions = new Set([".js", ".ts", ".tsx"]);

  function visit(pathname) {
    for (const entry of readdirSync(pathname)) {
      const nextPath = join(pathname, entry);
      const stat = statSync(nextPath);

      if (stat.isDirectory()) {
        visit(nextPath);
        continue;
      }

      if (allowedExtensions.has(extname(nextPath))) {
        sources.push(readFileSync(nextPath, "utf8"));
      }
    }
  }

  visit(dirPath);

  return sources.join("\n");
}

const gearActionsSource = readSource("src/lib/actions/gear.ts");
const tripActionsSource = readSource("src/lib/actions/trip-plans.ts");
const serviceWorkerSource = readSource("public/sw.js");
const planChecklistSource = readSource("src/lib/plan-checklist.ts");
const tripPlanLocalMetaSource = readSource("src/lib/trip-plan-local-meta.ts");
const tripPlanStorageSource = readSource("src/lib/trip-plan-storage.ts");
const tripPlanningUiSource = readSource("src/components/trip-planning-ui.tsx");
const recommendationDeleteControlsSource = readSource(
  "src/components/recommendation-delete-controls.tsx"
);
const accountDeleteButtonSource = readSource("src/components/account-delete-button.tsx");
const gearDataSource = readSource("src/lib/data/gear.ts");
const mountainFoundationDataSource = readSource("src/lib/data/mountain-foundation.ts");
const heroGaugeSource = readSource("src/components/hero-gauge.tsx");
const dashboardChecklistSource = readSource(
  "src/components/dashboard-plan-checklist-summary.tsx"
);
const swRegisterSource = readSource("src/components/sw-register.tsx");
const appMenuDrawerSource = readSource("src/components/app-menu-drawer.tsx");
const appSource = readSourceTree("app");
const srcSource = readSourceTree("src");
const publicSource = readSourceTree("public");
const runtimeSource = `${appSource}\n${srcSource}\n${publicSource}`;

test("gear and trip mutations keep their current revalidation boundaries", () => {
  for (const path of ["/dashboard", "/gear", "/plan"]) {
    assert.match(gearActionsSource, new RegExp(`revalidatePath\\("${path}"\\)`));
  }

  assert.match(gearActionsSource, /revalidatePath\(`\/gear\/\$\{id\}\/edit`\)/);

  for (const path of ["/dashboard", "/plan"]) {
    assert.match(tripActionsSource, new RegExp(`revalidatePath\\("${path}"\\)`));
  }

  assert.doesNotMatch(tripActionsSource, /revalidatePath\("\/gear"\)/);
});

test("service worker cache boundary keeps dashboard html network-first", () => {
  assert.match(serviceWorkerSource, /const PAGE_CACHE_PATHS = \[\];/);
  assert.match(serviceWorkerSource, /用户数据页面\(例如 \/dashboard\)不缓存 HTML/);
  assert.match(serviceWorkerSource, /url\.pathname\.startsWith\("\/_next\/static\/"\)/);
  assert.match(serviceWorkerSource, /url\.pathname\.startsWith\("\/fonts\/"\)/);
  assert.match(serviceWorkerSource, /event\.respondWith\(cacheFirst\(request\)\)/);
  assert.match(serviceWorkerSource, /event\.respondWith\(cacheFirstCrossOriginImage\(request\)\)/);
  assert.match(serviceWorkerSource, /function isSupabaseStorageHost\(hostname\)/);
  assert.match(serviceWorkerSource, /hostname\.endsWith\("\.supabase\.co"\)/);
  assert.match(
    serviceWorkerSource,
    /looksLikeImage\(url\.pathname\) && !isSupabaseStorageHost\(url\.hostname\)/
  );

  assert.doesNotMatch(serviceWorkerSource, /PAGE_CACHE_PATHS = \[[^\]]*\/dashboard/);
  assert.doesNotMatch(serviceWorkerSource, /PAGE_CACHE_PATHS = \[[^\]]*\/login/);
  assert.doesNotMatch(serviceWorkerSource, /PAGE_CACHE_PATHS = \[[^\]]*\/auth/);
  assert.doesNotMatch(serviceWorkerSource, /PAGE_CACHE_PATHS = \[[^\]]*\/api/);
  assert.doesNotMatch(serviceWorkerSource, /\buser_gear\b|\btrip_plans\b|\bai_recommendations\b/);
});

test("trip checklist localStorage keys keep their legacy plan-id-only shape", () => {
  assert.match(
    planChecklistSource,
    /const checkedSlotsStoragePrefix = "yamajitaku:trip-plan:checked-slots:";/
  );
  assert.match(
    planChecklistSource,
    /return `yamajitaku:trip-plan:checklist-only:\$\{planId\}`;/
  );
  assert.match(planChecklistSource, /return `\$\{checkedSlotsStoragePrefix\}\$\{planId\}`;/);
  for (const source of [planChecklistSource]) {
    assert.doesNotMatch(source, /schemaVersion|expiresAt|yamajitaku:v1:user:/);
  }

  assert.match(tripPlanLocalMetaSource, /readTripPlanMeta\(\{ planId, userId: options\.userId \}\)/);
  assert.match(
    tripPlanStorageSource,
    /return `yamajitaku:trip-plan-meta:\$\{planId\}`;/
  );
});

test("state, refresh, and cache primitives are visible at their current boundaries", () => {
  assert.match(tripPlanningUiSource, /router\.refresh\(\)/);
  assert.match(recommendationDeleteControlsSource, /router\.refresh\(\)/);
  assert.match(accountDeleteButtonSource, /router\.refresh\(\)/);

  assert.match(runtimeSource, /revalidatePath\(/);
  assert.match(gearDataSource, /cache\(async function getGearCategories/);
  assert.match(gearDataSource, /cache\(async function getGearProducts/);
  assert.match(mountainFoundationDataSource, /cache\(/);

  assert.match(tripPlanningUiSource, /readTripPlanCheckedSlots/);
  assert.match(tripPlanningUiSource, /writeTripPlanChecklistOnlyIds/);
  assert.match(heroGaugeSource, /readTripPlanCheckedSlots/);
  assert.match(dashboardChecklistSource, /readTripPlanChecklistOnlyIds/);

  for (const source of [heroGaugeSource, tripPlanStorageSource]) {
    assert.match(source, /localStorage/);
  }

  assert.match(swRegisterSource, /navigator\.serviceWorker\.register\("\/sw\.js"\)/);
  assert.match(appMenuDrawerSource, /navigator\.serviceWorker\?\.controller\?\.postMessage/);
  assert.doesNotMatch(runtimeSource, /sessionStorage/);
});
