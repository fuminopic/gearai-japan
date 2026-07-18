import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

const onboardingLibSource = readFileSync(
  new URL("../src/lib/onboarding.ts", import.meta.url),
  "utf8"
);
const onboardingActionsSource = readFileSync(
  new URL("../src/lib/actions/onboarding.ts", import.meta.url),
  "utf8"
);
const onboardingPageSource = readFileSync(
  new URL("../app/onboarding/page.tsx", import.meta.url),
  "utf8"
);
const carouselSource = readFileSync(
  new URL("../src/components/onboarding-carousel.tsx", import.meta.url),
  "utf8"
);
const illustrationsSource = readFileSync(
  new URL("../src/components/onboarding-illustrations.tsx", import.meta.url),
  "utf8"
);
const dashboardSource = readFileSync(
  new URL("../app/(app)/dashboard/page.tsx", import.meta.url),
  "utf8"
);
const authActionsSource = readFileSync(
  new URL("../src/lib/actions/auth.ts", import.meta.url),
  "utf8"
);
const tripPlanningUiSource = readFileSync(
  new URL("../src/components/trip-planning-ui.tsx", import.meta.url),
  "utf8"
);

const { outputText } = ts.transpileModule(onboardingLibSource, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022
  }
});
const onboarding = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);

const AFTER_LAUNCH = "2026-08-01T09:00:00.000Z";
const BEFORE_LAUNCH = "2026-06-01T09:00:00.000Z";

test("new accounts created after the launch baseline auto-show onboarding once", () => {
  assert.equal(
    onboarding.shouldAutoShowOnboarding({
      createdAt: AFTER_LAUNCH,
      metadata: {}
    }),
    true
  );

  // 無関係な metadata (表示名など) があっても新規ユーザー扱いは変わらない
  assert.equal(
    onboarding.shouldAutoShowOnboarding({
      createdAt: AFTER_LAUNCH,
      metadata: { display_name: "テスト", mountain_insurance_status: "active" }
    }),
    true
  );
});

test("existing accounts (created before the baseline) are never auto-shown", () => {
  assert.equal(
    onboarding.shouldAutoShowOnboarding({
      createdAt: BEFORE_LAUNCH,
      metadata: {}
    }),
    false
  );
  assert.equal(
    onboarding.shouldAutoShowOnboarding({
      createdAt: BEFORE_LAUNCH,
      metadata: null
    }),
    false
  );
});

test("completed or skipped state persists across re-login (metadata based)", () => {
  for (const state of ["completed", "skipped"]) {
    assert.equal(
      onboarding.shouldAutoShowOnboarding({
        createdAt: AFTER_LAUNCH,
        metadata: { onboarding_state: state }
      }),
      false
    );
    assert.equal(onboarding.hasFinishedOnboarding({ onboarding_state: state }), true);
  }

  // 不明な値は終了記録として扱わない
  assert.equal(onboarding.hasFinishedOnboarding({ onboarding_state: "unknown" }), false);
  assert.equal(onboarding.hasFinishedOnboarding({}), false);
  assert.equal(onboarding.hasFinishedOnboarding(null), false);
});

test("unknown account age fails safe: never force onboarding", () => {
  for (const createdAt of [undefined, null, "", "not-a-date"]) {
    assert.equal(
      onboarding.shouldAutoShowOnboarding({ createdAt, metadata: {} }),
      false
    );
  }
});

test("launch baseline is a fixed ISO instant", () => {
  assert.equal(typeof onboarding.ONBOARDING_LAUNCH_ISO, "string");
  assert.ok(!Number.isNaN(Date.parse(onboarding.ONBOARDING_LAUNCH_ISO)));
  assert.equal(onboarding.ONBOARDING_STATE_METADATA_KEY, "onboarding_state");
});

test("dashboard gates first entry before rendering home content", () => {
  assert.match(dashboardSource, /shouldAutoShowOnboarding/);
  assert.match(dashboardSource, /redirect\("\/onboarding"\)/);
  assert.match(dashboardSource, /createdAt: user\.created_at/);
  assert.match(dashboardSource, /metadata: user\.user_metadata/);

  const gateIndex = dashboardSource.indexOf('redirect("/onboarding")');
  const renderIndex = dashboardSource.indexOf("<HomePageContent");
  assert.ok(gateIndex > -1 && renderIndex > -1 && gateIndex < renderIndex);
});

test("onboarding page is a fullscreen authed route outside the (app) shell", () => {
  assert.match(onboardingPageSource, /requireUser/);
  assert.match(onboardingPageSource, /AuthValidationError/);
  assert.match(onboardingPageSource, /redirect\("\/dashboard"\)/);
  assert.match(onboardingPageSource, /OnboardingCarousel/);
  assert.match(onboardingPageSource, /force-dynamic/);
  // (app) レイアウト(AppNav)を継承しないパスにあることは読み込み元パスで担保される
});

test("finish/skip only touch auth user metadata — no tables, no schema", () => {
  assert.match(onboardingActionsSource, /^"use server";/);
  assert.match(onboardingActionsSource, /auth\.updateUser/);
  assert.match(onboardingActionsSource, /ONBOARDING_STATE_METADATA_KEY/);
  assert.doesNotMatch(onboardingActionsSource, /\.from\(/);
  assert.doesNotMatch(onboardingActionsSource, /insert|upsert|delete/i);

  // 完了 → 計画作成 / スキップ → ホーム
  const completeBody = onboardingActionsSource.slice(
    onboardingActionsSource.indexOf("completeOnboarding"),
    onboardingActionsSource.indexOf("skipOnboarding")
  );
  assert.match(completeBody, /redirect\("\/plan"\)/);
  const skipBody = onboardingActionsSource.slice(
    onboardingActionsSource.indexOf("export async function skipOnboarding")
  );
  assert.match(skipBody, /redirect\("\/dashboard"\)/);
});

test("auth actions stay untouched by onboarding (no auth architecture change)", () => {
  assert.doesNotMatch(authActionsSource, /onboarding/i);
  assert.match(authActionsSource, /redirect\("\/dashboard"\)/);
});

test("carousel has exactly 5 slides with the approved Japanese copy", () => {
  const titles = [
    "山行準備を、もっと確実に",
    "山を選ぶだけで、準備が始まる",
    "必要な装備を、自動で整理",
    "マイ装備を、ひとつにまとめる",
    "出発前に、最後の確認"
  ];
  for (const title of titles) {
    assert.ok(carouselSource.includes(title), `missing title: ${title}`);
  }

  const slideIds = carouselSource.match(/^    id: "/gm) ?? [];
  assert.equal(slideIds.length, 5);

  // 差別化の核: 所持 / 不足 / 要確認
  assert.match(carouselSource, /「所持」「不足」「要確認」/);
  // 既存プロダクト語彙
  assert.match(carouselSource, /日帰りや山小屋泊/);
  assert.match(carouselSource, /ザック全体の重量/);
});

test("onboarding copy avoids off-positioning pitches", () => {
  for (const banned of ["AI", "コミュニティ", "シェア", "共有", "フォロー", "地図", "ナビ"]) {
    assert.ok(
      !carouselSource.includes(banned),
      `carousel copy must not pitch: ${banned}`
    );
  }
});

test("carousel provides skip, dots, next and the final plan CTA", () => {
  assert.match(carouselSource, /スキップ/);
  assert.match(carouselSource, /次へ/);
  assert.match(carouselSource, /山行計画をつくる/);
  assert.match(carouselSource, /skipOnboarding/);
  assert.match(carouselSource, /completeOnboarding/);
  assert.match(carouselSource, /ページ目を表示/); // ドットの aria-label
  assert.match(carouselSource, /aria-current/);
  assert.match(carouselSource, /onTouchStart/);
  assert.match(carouselSource, /onTouchEnd/);
});

test("carousel respects small screens and safe areas", () => {
  assert.match(carouselSource, /min-h-\[100dvh\]/);
  assert.match(carouselSource, /env\(safe-area-inset-top\)/);
  assert.match(carouselSource, /env\(safe-area-inset-bottom\)/);
  // 320px 帯(iPhone SE 1st / mini 幅未満)への調整
  assert.match(carouselSource, /max-\[359px\]:text-\[19px\]/);
  assert.match(carouselSource, /max-\[359px\]:max-w-\[252px\]/);
  assert.match(carouselSource, /max-\[359px\]:px-5/);
  // ボタン跳ねを防ぐ固定領域
  assert.match(carouselSource, /min-h-\[128px\]/);
});

test("illustrations form one flat vector system in brand colors", () => {
  for (const name of [
    "WelcomeIllustration",
    "PlanIllustration",
    "GearSortIllustration",
    "MyGearIllustration",
    "FinalCheckIllustration"
  ]) {
    assert.ok(
      illustrationsSource.includes(`export function ${name}`),
      `missing illustration: ${name}`
    );
  }

  // 共通ビューボックスとブランド色
  assert.match(illustrationsSource, /viewBox: "0 0 320 220"/);
  assert.match(illustrationsSource, /#14724e/);
  assert.match(illustrationsSource, /#1F7950/);
  assert.match(illustrationsSource, /#81AB44/);

  // 状態色はチェックリストUIと同じ値を引用する
  assert.ok(tripPlanningUiSource.includes("#B91C1C"));
  assert.ok(tripPlanningUiSource.includes("#14724e"));
  assert.ok(tripPlanningUiSource.includes("#1D4ED8"));
  assert.match(illustrationsSource, /#B91C1C/);
  assert.match(illustrationsSource, /#1D4ED8/);

  // 出所不明素材・外部画像・ラスタ画像は使わない
  assert.doesNotMatch(illustrationsSource, /<image/);
  assert.doesNotMatch(illustrationsSource, /https?:\/\/(?!www\.w3\.org)/);
  assert.doesNotMatch(illustrationsSource, /\.(png|jpg|jpeg|webp|gif)/);
  assert.match(illustrationsSource, /aria-hidden/);
});
