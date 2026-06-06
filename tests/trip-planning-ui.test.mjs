import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const aiPageSource = readFileSync(
  new URL("../app/(app)/ai/page.tsx", import.meta.url),
  "utf8"
);
const tripPlanningUiSource = readFileSync(
  new URL("../src/components/trip-planning-ui.tsx", import.meta.url),
  "utf8"
);
const appNavSource = readFileSync(
  new URL("../src/components/app-nav.tsx", import.meta.url),
  "utf8"
);
const labelsSource = readFileSync(
  new URL("../src/lib/i18n/labels.ts", import.meta.url),
  "utf8"
);
const authFormSource = readFileSync(
  new URL("../src/components/auth-form.tsx", import.meta.url),
  "utf8"
);

test("trip planning page exposes the pack planning architecture", () => {
  assert.match(aiPageSource, /TripPlanningUI/);
  assert.match(aiPageSource, /getMountainFoundationProfiles/);
  assert.match(aiPageSource, /getPackRequirementPlan/);
  assert.match(aiPageSource, /matchGearForRequirementSlot/);
  assert.match(aiPageSource, /getGearProducts/);
  assert.match(aiPageSource, /requireUser/);

  assert.doesNotMatch(aiPageSource, /AIRecommendationForm/);
  assert.doesNotMatch(aiPageSource, /createRecommendation/);
});

test("trip planning UI emphasizes required systems, coverage, and missing gear", () => {
  for (const copy of [
    "山行サマリー",
    "必要システム",
    "カバー状況",
    "不足装備",
    "対応装備",
    "計画メモ",
    "パック計画を作成"
  ]) {
    assert.match(tripPlanningUiSource, new RegExp(copy));
  }

  assert.match(tripPlanningUiSource, /plan\.required_systems/);
  assert.match(tripPlanningUiSource, /plan\.covered_slots/);
  assert.match(tripPlanningUiSource, /plan\.missing_slots/);
  assert.match(tripPlanningUiSource, /matching_owned_gear/);
  assert.match(tripPlanningUiSource, /matching_database_gear/);
  assert.match(tripPlanningUiSource, /coveragePercent/);
});

test("trip planning UI avoids recommendation and shopping language", () => {
  for (const source of [aiPageSource, tripPlanningUiSource]) {
    assert.doesNotMatch(source, /推薦|購入|予算|価格|買う|wishlist/i);
    assert.doesNotMatch(source, /\b(recommend|shopping|upgrade|best|price)\b/i);
  }
});

test("navigation and labels are Japanese-first planning copy", () => {
  assert.match(appNavSource, /label: "計画"/);
  assert.doesNotMatch(appNavSource, /AI推薦/);

  assert.match(labelsSource, /WATER_SYSTEM: "水分補給"/);
  assert.match(labelsSource, /RAIN_SYSTEM: "雨対策"/);
  assert.match(labelsSource, /HEADLAMP: "ヘッドランプ"/);
});

test("auth form shows submit progress for login and signup", () => {
  assert.match(authFormSource, /ログイン中\.\.\./);
  assert.match(authFormSource, /作成中\.\.\./);
});
