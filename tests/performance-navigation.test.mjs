import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const prefetcherSource = readFileSync(
  new URL("../src/components/app-route-prefetcher.tsx", import.meta.url),
  "utf8"
);
const bottomNavSource = readFileSync(
  new URL("../src/components/app-bottom-nav.tsx", import.meta.url),
  "utf8"
);
const appNavSource = readFileSync(
  new URL("../src/components/app-nav.tsx", import.meta.url),
  "utf8"
);
const drawerSource = readFileSync(
  new URL("../src/components/app-menu-drawer.tsx", import.meta.url),
  "utf8"
);

test("global navigation prefetches only adjacent routes when the browser is idle", () => {
  assert.match(prefetcherSource, /usePathname/);
  assert.match(prefetcherSource, /function getPrefetchTargets/);
  assert.match(prefetcherSource, /primary: "\/pack"/);
  assert.match(prefetcherSource, /primary: "\/gear"/);
  assert.match(prefetcherSource, /requestIdleCallback/);
  assert.match(prefetcherSource, /saveData/);
  assert.match(prefetcherSource, /slow-2g/);
  assert.match(prefetcherSource, /effectiveType === "3g"/);
  assert.match(prefetcherSource, /router\.prefetch\(primary\)/);
  assert.match(prefetcherSource, /router\.prefetch\(secondary\)/);
  assert.doesNotMatch(prefetcherSource, /primaryPrefetchRoutes/);
  assert.doesNotMatch(prefetcherSource, /for \(const route of/);
});

test("persistent navigation delegates prefetch scheduling to the single controller", () => {
  assert.match(bottomNavSource, /prefetch=\{false\}/);
  assert.match(appNavSource, /prefetch=\{false\}/);
  assert.match(drawerSource, /prefetch=\{false\}/);
});

test("bottom navigation acknowledges the intended tab before a dynamic route responds", () => {
  assert.match(bottomNavSource, /const \[pendingHref, setPendingHref\] = useState<Route \| null>\(null\)/);
  assert.match(bottomNavSource, /const activePath = pendingHref \?\? pathname/);
  assert.match(bottomNavSource, /onPointerDown=\{\(\) => \{\s*setPendingHref\(item\.href\)/);
  assert.match(
    bottomNavSource,
    /onClick=\{\(\) => \{\s*setPendingHref\(item\.href\);\s*hapticLight\(\);\s*\}\}/
  );
  assert.match(bottomNavSource, /setPendingHref\(null\)/);
  // ここで新しいユーザー RSC / HTML のキャッシュは作らない。
  assert.doesNotMatch(bottomNavSource, /router\.prefetch/);
});
