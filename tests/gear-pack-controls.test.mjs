import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const controlsSource = readFileSync(
  new URL("../src/components/gear-pack-controls.tsx", import.meta.url),
  "utf8"
);
const gearListSource = readFileSync(
  new URL("../src/components/gear-list.tsx", import.meta.url),
  "utf8"
);
const gearPageSource = readFileSync(
  new URL("../app/(app)/gear/page.tsx", import.meta.url),
  "utf8"
);
const packContentsSource = readFileSync(
  new URL("../src/components/pack-contents.tsx", import.meta.url),
  "utf8"
);
const packActionsSource = readFileSync(
  new URL("../src/lib/actions/pack.ts", import.meta.url),
  "utf8"
);
const stepHintSource = readFileSync(
  new URL("../src/components/gear-step-hint.tsx", import.meta.url),
  "utf8"
);

test("gear rows toggle pack membership through the existing server actions", () => {
  // 新しいAPIは作らない。既存の addPackItems / removePackItem をそのまま使う。
  assert.match(controlsSource, /^"use client";/);
  assert.match(controlsSource, /from "@\/lib\/actions\/pack"/);
  assert.match(controlsSource, /addPackItems\(\[gearId\]\)/);
  assert.match(controlsSource, /removePackItem\(gearId\)/);
  assert.doesNotMatch(controlsSource, /supabase/);

  // スイッチは行のリンクと同居するので、遷移を止める必要がある。
  assert.match(controlsSource, /role="switch"/);
  assert.match(controlsSource, /aria-checked=\{packed\}/);
  assert.match(controlsSource, /event\.preventDefault\(\)/);
  assert.match(controlsSource, /event\.stopPropagation\(\)/);
});

test("pack toggle applies optimistically and rolls back when the server rejects", () => {
  assert.match(controlsSource, /apply\(nextPacked\)/);
  // 失敗時は元の状態に戻し、理由を出す。
  assert.match(controlsSource, /if \(!result\.ok\) \{[\s\S]*apply\(packed\)/);
  assert.match(controlsSource, /setError\(result\.error\)/);
  // 同じ行の二重送信を防ぐ
  assert.match(controlsSource, /inFlightRef/);
  assert.match(controlsSource, /if \(inFlightRef\.current\.has\(gearId\)\) \{\s*return;/);
});

test("wishlist gear cannot be packed, matching the server rule", () => {
  // addPackItems は所有ギアしか受け付けない
  assert.match(packActionsSource, /\.eq\("status", "owned"\)/);
  // UI 側も同じ条件で無効化する(押せてしまってから失敗する、を避ける)
  assert.match(gearListSource, /disabled=\{item\.status !== "owned"\}/);
  assert.match(controlsSource, /disabled=\{disabled \|\| pending\}/);
  assert.match(controlsSource, /cursor-not-allowed/);
});

test("the pack bar reflects the whole pack, not the filtered list", () => {
  // 一覧のフィルタとは独立に、パック全体の点数と重量を渡す
  assert.match(gearPageSource, /getMyPack\(\)/);
  assert.match(gearPageSource, /packItemCount=\{myPack\.summary\.itemCount\}/);
  assert.match(gearPageSource, /packKnownWeightG=\{myPack\.summary\.knownWeightG\}/);

  // 見た目の指定(単色 #4e914a / 右下 / 矢印は1つ)
  assert.match(controlsSource, /bg-\[#4e914a\]/);
  assert.match(controlsSource, /fixed bottom-\[104px\] right-4/);
  const chevronCount = (controlsSource.match(/<ChevronRight/g) ?? []).length;
  assert.equal(chevronCount, 1);
  assert.match(controlsSource, /マイパック/);
});

test("switch geometry matches the agreed spec", () => {
  // 44x26 のピル、20px のノブ、上下中央(3px)、閉=灰 / 開=#4e914a
  assert.match(controlsSource, /h-\[26px\] w-11/);
  assert.match(controlsSource, /top-\[3px\] h-5 w-5/);
  assert.match(controlsSource, /left-\[22px\]/);
  assert.match(controlsSource, /left-\[4px\]/);
  assert.match(controlsSource, /bg-\[#d9d9d9\]/);
});

test("pack screen groups gear the same way my-gear does", () => {
  // 同じギアが画面ごとに別のグループに入らないよう、6大分類に統一する。
  assert.match(packContentsSource, /getRetailGearCategory/);
  assert.match(packContentsSource, /MAJOR_GEAR_CATEGORIES/);
  assert.match(packContentsSource, /sortOrder/);
  // 旧実装(DBの細分類を五十音順)には戻さない
  assert.doesNotMatch(packContentsSource, /const label = item\.gear_categories\?\.name_ja/);
  assert.doesNotMatch(packContentsSource, /localeCompare\(b\.label, "ja"\)/);
});

test("first-run hint is dismissible and disappears once the flow is done", () => {
  assert.match(stepHintSource, /^"use client";/);
  assert.match(stepHintSource, /localStorage/);
  assert.match(stepHintSource, /ギアを登録/);
  assert.match(stepHintSource, /パックに入れる/);
  assert.match(stepHintSource, /計画で確認/);
  // 登録もパックも済んでいる人には出さない
  assert.match(stepHintSource, /hasGear && hasPackItems/);
  // 判定前に描画してちらつかせない
  assert.match(stepHintSource, /status !== "visible"/);
  assert.match(gearListSource, /<GearStepHint/);
});
