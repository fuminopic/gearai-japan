import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const drawerSource = readFileSync("src/components/app-menu-drawer.tsx", "utf8");
const appNavSource = readFileSync("src/components/app-nav.tsx", "utf8");
const dashboardSource = readFileSync("app/(app)/dashboard/page.tsx", "utf8");

test("app menu drawer exposes the basic mobile menu structure", () => {
  assert.match(drawerSource, /role="dialog"/);
  assert.match(drawerSource, /aria-modal="true"/);
  assert.match(drawerSource, /createPortal\(drawerLayer, document\.body\)/);
  assert.match(drawerSource, /shouldRenderDrawer/);
  assert.match(drawerSource, /setShouldRenderDrawer\(false\)/);
  assert.match(drawerSource, /requestAnimationFrame/);
  assert.match(drawerSource, /translate-x-full/);
  assert.match(drawerSource, /z-\[9998\]/);
  assert.match(drawerSource, /z-\[9999\]/);
  assert.match(drawerSource, /bg-black\/35/);
  assert.match(drawerSource, /YAMAJITAKU v0\.1/);
  assert.match(drawerSource, /ログアウト/);

  for (const label of [
    "ホーム",
    "山行計画",
    "マイギア",
    "マイページ",
    "ヘルプ",
    "利用規約",
    "プライバシーポリシー"
  ]) {
    assert.match(drawerSource, new RegExp(label));
  }
});

test("app headers use the shared menu drawer", () => {
  assert.match(appNavSource, /AppMenuDrawer/);
  assert.match(dashboardSource, /AppMenuDrawer/);
  assert.doesNotMatch(dashboardSource, /M4 6h16M4 12h16M4 18h16/);
});
