import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { existsSync, readFileSync } from "node:fs";
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

test("carousel has exactly 4 slides with the approved Japanese copy", () => {
  // 2行タイトルは読点位置で明示的に分割して保持する
  const titleLines = [
    "山へ行く前の不安を、なくす。",
    "条件を選ぶだけで、",
    "山行計画が完成",
    "装備も重量も、まとめて管理",
    "出発前の抜け漏れを、",
    "ひと目で確認"
  ];
  for (const line of titleLines) {
    assert.ok(carouselSource.includes(line), `missing title line: ${line}`);
  }

  const slideIds = carouselSource.match(/^    id: "/gm) ?? [];
  assert.equal(slideIds.length, 4);

  // 「必要な装備を、自動で整理」のページは削除済み
  assert.doesNotMatch(carouselSource, /必要な装備を、自動で整理/);
  assert.doesNotMatch(carouselSource, /gear-sort/);

  // 必須語彙
  assert.match(carouselSource, /登山前準備/);
  assert.match(carouselSource, /山行計画/);
  assert.match(carouselSource, /総重量や装備構成/);
  assert.match(carouselSource, /山・季節・スタイル・予定日/);
});

test("body copy is exactly two lines per page and never breaks mid-token", () => {
  // 各行は inline-block で描画され、折り返しは行の境目でのみ起きる
  assert.match(carouselSource, /description: \[/);
  assert.match(carouselSource, /slide\.description\.map/);
  assert.match(carouselSource, /className="inline-block"/);

  // 実機で割れていた語が、ひとつの行の内側に収まっていること
  for (const token of ["ひとつにつなぐ、", "ブランド・カテゴリー別に登録。", "一つずつチェック。"]) {
    assert.ok(carouselSource.includes(token), `token must stay unbroken: ${token}`);
  }

  // 全4ページとも本文は2行ちょうど
  const blocks = [...carouselSource.matchAll(/description: \[([\s\S]*?)\],/g)];
  assert.equal(blocks.length, 4);
  const LONGEST_SUPPORTED_LINE = 25;
  for (const [, body] of blocks) {
    const lines = [...body.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
    assert.equal(lines.length, 2, `expected 2 body lines, got ${lines.length}`);
    for (const line of lines) {
      assert.ok(
        line.length <= LONGEST_SUPPORTED_LINE,
        `line longer than the sizing budget (${LONGEST_SUPPORTED_LINE}): ${line}`
      );
    }
  }

  // 最長行(25文字)が各幅で1行に収まる文字サイズが指定されていること
  assert.match(carouselSource, /text-\[13px\]/);
  assert.match(carouselSource, /max-\[389px\]:text-\[12px\]/);
  assert.match(carouselSource, /max-\[359px\]:text-\[11px\]/);
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
  assert.match(carouselSource, /さっそく始めよう！/);
  assert.doesNotMatch(carouselSource, /山行計画をつくる/);
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
  assert.match(carouselSource, /max-\[359px\]:max-w-\[200px\]/);
  assert.match(carouselSource, /max-\[359px\]:px-5/);
  // 本文は 13px / stone-700(サイズ切替は本文2行テストが担保)
  assert.match(carouselSource, /text-\[13px\][^"]*text-stone-700/);
  // ボタン跳ねを防ぐ固定領域(2行タイトル+2行本文ぶん)
  assert.match(carouselSource, /min-h-\[128px\]/);
  // コンテンツグループは上下スペーサーで Skip とインジケーターの間の中央に置く
  assert.match(carouselSource, /flex-\[0\.85\]/);
  const spacerCount = (carouselSource.match(/aria-hidden \/>/g) ?? []).length;
  assert.equal(spacerCount, 2);
});

test("illustrations are the four supplied assets, served locally", () => {
  for (const name of [
    "WelcomeIllustration",
    "PlanIllustration",
    "MyGearIllustration",
    "FinalCheckIllustration"
  ]) {
    assert.ok(
      illustrationsSource.includes(`export function ${name}`),
      `missing illustration: ${name}`
    );
  }
  // 3ページ目の削除に伴い、対応するイラストも残さない
  assert.doesNotMatch(illustrationsSource, /GearSortIllustration/);

  // アセットは public/onboarding/ 配下のみ。外部URL・リモート素材は使わない。
  const sources = [...illustrationsSource.matchAll(/src="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(sources.length, 4);
  for (const src of sources) {
    assert.match(src, /^\/onboarding\/[a-z-]+\.png$/);
  }
  assert.doesNotMatch(illustrationsSource, /https?:\/\//);

  // next/image で最適化し、装飾画像として読み上げから除外する
  assert.match(illustrationsSource, /from "next\/image"/);
  assert.match(illustrationsSource, /alt=""/);
  assert.match(illustrationsSource, /aria-hidden/);
  assert.match(illustrationsSource, /priority/);
});

test("supplied illustration assets exist in public/onboarding", () => {
  const expected = ["welcome.png", "plan.png", "my-gear.png", "final-check.png"];
  for (const file of expected) {
    const assetUrl = new URL(`../public/onboarding/${file}`, import.meta.url);
    assert.equal(existsSync(assetUrl), true, `missing asset: public/onboarding/${file}`);
  }
});
