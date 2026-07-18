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
const appLayoutSource = readFileSync(
  new URL("../app/(app)/layout.tsx", import.meta.url),
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

test("app layout gates new users before rendering any app shell", () => {
  // ゲートは (app) レイアウトの AuthGate にあり、App Shell (AppNav) を
  // 返す前に redirect する。streaming でも下部ナビが先に flush されない。
  assert.match(appLayoutSource, /shouldAutoShowOnboarding/);
  assert.match(appLayoutSource, /redirect\("\/onboarding" as Route\)/);
  assert.match(appLayoutSource, /createdAt: user\.created_at/);
  assert.match(appLayoutSource, /metadata: user\.user_metadata/);

  const gateIndex = appLayoutSource.indexOf('redirect("/onboarding" as Route)');
  const navIndex = appLayoutSource.indexOf("<AppNav");
  assert.ok(gateIndex > -1 && navIndex > -1, "gate and AppNav must exist");
  assert.ok(gateIndex < navIndex, "gate must run before the app shell renders");

  // AppNav はゲート後の1箇所のみ。Suspense fallback (AppAuthLoading) にも
  // 下部ナビを含めない = ナビがオンボーディング判定より先に描画される
  // 経路が存在しない。
  const navMatches = appLayoutSource.match(/<AppNav/g) ?? [];
  assert.equal(navMatches.length, 1);
  const fallbackBody = appLayoutSource.slice(
    appLayoutSource.indexOf("function AppAuthLoading")
  );
  assert.doesNotMatch(fallbackBody, /<AppNav/);

  // 認証の一時エラー経路は従来どおり残す
  assert.match(appLayoutSource, /AuthValidationError/);
});

test("dashboard no longer duplicates the onboarding gate", () => {
  // 二重判定を避ける: ダッシュボードにはゲートを置かない。
  // 既存ユーザー/完了・スキップ済みユーザーはレイアウトのゲートを素通りし、
  // 従来どおりダッシュボードが描画される(判定ロジック自体の回帰は上の
  // shouldAutoShowOnboarding マトリクステストが担保する)。
  assert.doesNotMatch(dashboardSource, /shouldAutoShowOnboarding/);
  assert.doesNotMatch(dashboardSource, /redirect\("\/onboarding/);
  assert.match(dashboardSource, /<HomePageContent/);
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
  // 2行タイトルは読点位置で明示的に分割して保持する
  const titleLines = [
    "山へ行く前の不安を、なくす。",
    "条件を選ぶだけで、",
    "山行計画が完成",
    "必要な装備を、自動で整理",
    "装備も重量も、まとめて管理",
    "出発前の抜け漏れを、",
    "ひと目で確認"
  ];
  for (const line of titleLines) {
    assert.ok(carouselSource.includes(line), `missing title line: ${line}`);
  }

  const slideIds = carouselSource.match(/^    id: "/gm) ?? [];
  assert.equal(slideIds.length, 5);

  // 差別化の核: 所持済み / 不足 / 要確認
  assert.match(carouselSource, /「所持済み」「不足」「要確認」/);
  // 必須語彙
  assert.match(carouselSource, /登山前準備/);
  assert.match(carouselSource, /山行計画/);
  assert.match(carouselSource, /総重量や装備構成/);
  assert.match(carouselSource, /山・季節・スタイル・予定日/);
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
  assert.match(carouselSource, /max-\[359px\]:max-w-\[236px\]/);
  assert.match(carouselSource, /max-\[359px\]:px-5/);
  // 本文はモバイル可読性のため 15px / stone-700
  assert.match(carouselSource, /text-\[15px\][^"]*text-stone-700/);
  // ボタン跳ねを防ぐ固定領域(2行タイトル+3行本文ぶん)
  assert.match(carouselSource, /min-h-\[144px\]/);
  // コンテンツグループは上下スペーサーで Skip とインジケーターの間の中央に置く
  assert.match(carouselSource, /flex-\[0\.85\]/);
  const spacerCount = (carouselSource.match(/aria-hidden \/>/g) ?? []).length;
  assert.equal(spacerCount, 2);
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

  // 共通ビューボックス・共通背景ブロブとブランド色
  assert.match(illustrationsSource, /viewBox: "0 0 320 200"/);
  assert.match(illustrationsSource, /BLOB_PATH/);
  assert.match(illustrationsSource, /#14724e/);
  assert.match(illustrationsSource, /#1F7950/);
  assert.match(illustrationsSource, /#81AB44/);
  // ロゴ言語: 黄緑バンド + 山吹色アクセント + clipPath による曲面レイヤー
  assert.match(illustrationsSource, /#A8C455/);
  assert.match(illustrationsSource, /#E5B94B/);
  assert.match(illustrationsSource, /clipPath/);

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
