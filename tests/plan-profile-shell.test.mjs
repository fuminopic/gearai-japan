import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const planPageSource = readFileSync(
  new URL("../app/(app)/plan/page.tsx", import.meta.url),
  "utf8"
);
const profilePageSource = readFileSync(
  new URL("../app/(app)/profile/page.tsx", import.meta.url),
  "utf8"
);
const planUiSource = readFileSync(
  new URL("../src/components/trip-planning-ui.tsx", import.meta.url),
  "utf8"
);
const planFormSource = readFileSync(
  new URL("../src/components/trip-planning-form.tsx", import.meta.url),
  "utf8"
);
const planChecklistSource = readFileSync(
  new URL("../src/lib/plan-checklist.ts", import.meta.url),
  "utf8"
);
const packPageSource = readFileSync(
  new URL("../app/(app)/pack/page.tsx", import.meta.url),
  "utf8"
);
const packContentsSource = readFileSync(
  new URL("../src/components/pack-contents.tsx", import.meta.url),
  "utf8"
);
const appChromeSource = readFileSync(
  new URL("../src/components/app-chrome.tsx", import.meta.url),
  "utf8"
);

test("plan, profile and pack use the same shell geometry as home and gear", () => {
  for (const source of [planPageSource, profilePageSource, packPageSource]) {
    assert.match(source, /brand-shell min-h-screen bg-\[#E5EBE9\]/);
    assert.match(source, /bg-gradient-to-br from-\[#1F7950\] to-\[#81AB44\]/);
    // バンド150 + 重なり51 → カード上端はホームと同じ safe+99
    assert.match(source, /\+ 150px\)/);
    assert.match(source, /-mt-\[51px\]/);
    // 白ヘッダーを隠すのでメニューはバンド側に置く
    assert.match(source, /AppMenuDrawer/);
  }
});

test("the pack screen matches the my-gear card, not its own style", () => {
  // 34px 見出し + eyebrow はやめ、カード内 16px 見出し + 追加ボタンにする
  assert.doesNotMatch(packPageSource, /text-\[34px\]/);
  assert.doesNotMatch(packPageSource, /パック管理/);
  assert.match(packContentsSource, /<h1 className="text-base font-bold">マイパック<\/h1>/);
  assert.match(packContentsSource, /マイギアから追加/);
  // 指標はマイギアと同じ metric-*.png + font-din 22px
  assert.match(packContentsSource, /metric-count\.png/);
  assert.match(packContentsSource, /metric-weight\.png/);
  assert.match(packContentsSource, /font-din text-\[22px\]/);
  // カードのトークン
  assert.match(packContentsSource, /rounded-\[20px\] bg-white px-5 pt-4 pb-4 shadow-sm/);
  assert.match(packContentsSource, /rounded-\[20px\] bg-white px-4 py-3 shadow-sm/);
  assert.doesNotMatch(packContentsSource, /rounded-2xl bg-white p-3 shadow-sm/);
  // 白ヘッダーを隠すルートに /pack も含める
  assert.match(appChromeSource, /"\/pack"/);
});

test("plan and profile adopt the shared card tokens", () => {
  // 角丸は 20px に統一(計画は 8px、マイページは 22px だった)
  assert.match(planFormSource, /rounded-\[20px\] bg-white p-4 shadow-sm/);
  assert.match(planUiSource, /rounded-\[20px\] bg-white p-4 shadow-sm/);
  assert.match(profilePageSource, /rounded-\[20px\] bg-white p-5 shadow-sm/);
  assert.doesNotMatch(profilePageSource, /rounded-\[22px\]/);
  assert.doesNotMatch(profilePageSource, /shadow-soft/);
  // カード間隔もホームと同じ 11px
  assert.match(planUiSource, /space-y-\[11px\] \$\{plan \? "pb-44" : "pb-24"\}/);
  assert.match(profilePageSource, /space-y-\[11px\]/);
});

test("profile drops the oversized heading in favour of an in-card title", () => {
  assert.doesNotMatch(profilePageSource, /text-\[34px\]/);
  assert.doesNotMatch(profilePageSource, /text-sm font-bold text-\[#14724e\]">アカウント/);
  assert.match(profilePageSource, /<h1 className="text-base font-bold">マイページ<\/h1>/);
  assert.match(profilePageSource, /border-b border-\[#EEEDE6\]/);
});

test("the plan screen keeps its checklist untouched", () => {
  // 見た目の統一で、計画の中身(安全に関わる表示)を変えていないこと。
  assert.doesNotMatch(planPageSource, /所持|不足|要確認/);
  for (const label of ["所持", "不足", "確認済み"]) {
    assert.ok(planUiSource.includes(label), `checklist wording must remain: ${label}`);
  }
  assert.match(planChecklistSource, /ACTION_GEAR/);
  // 計画ページには見出しを足さない(指示どおり)
  assert.doesNotMatch(planPageSource, /山行計画<\/h1>/);
});
