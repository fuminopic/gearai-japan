import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const instrumentationSource = readFileSync("instrumentation-client.ts", "utf8");
const analyticsSource = readFileSync("src/lib/analytics.ts", "utf8");
const appLayoutSource = readFileSync("app/(app)/layout.tsx", "utf8");
const tripPlanningSource = readFileSync("src/components/trip-planning-ui.tsx", "utf8");
const gearFormSource = readFileSync("src/components/gear-form.tsx", "utf8");
const tripPlanActionsSource = readFileSync("src/lib/actions/trip-plans.ts", "utf8");
const privacySource = readFileSync("app/privacy/page.tsx", "utf8");
const envExampleSource = readFileSync(".env.example", "utf8");

test("PostHog allows only the explicit product events and disables automatic capture", () => {
  for (const config of [
    "autocapture: false",
    "capture_pageview: false",
    "capture_pageleave: false",
    "capture_dead_clicks: false",
    "rageclick: false",
    "disable_session_recording: true",
    "enable_heatmaps: false",
    "advanced_disable_flags: true"
  ]) {
    assert.match(instrumentationSource, new RegExp(config));
  }

  for (const event of [
    "plan_generate",
    "gap_view",
    "gear_mark_owned",
    "plan_save",
    "preparation_complete",
    "second_plan_create"
  ]) {
    assert.match(instrumentationSource, new RegExp(`"${event}"`));
    assert.match(analyticsSource, new RegExp(`${event}:`));
  }

  assert.match(instrumentationSource, /property_denylist/);
  assert.match(instrumentationSource, /\$current_url/);
  assert.match(instrumentationSource, /before_send/);
  assert.match(instrumentationSource, /__yamajitakuPostHogInitialized/);
  assert.match(envExampleSource, /NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=/);
  assert.match(envExampleSource, /NEXT_PUBLIC_POSTHOG_HOST=/);
  assert.match(analyticsSource, /Analytics must never interrupt a plan or gear mutation/);
});

test("analytics identity and event triggers avoid personal plan and gear details", () => {
  assert.match(appLayoutSource, /<AnalyticsIdentity userId=\{userId\} \/>/);
  assert.match(analyticsSource, /posthog\.identify\(userId\)/);
  assert.match(tripPlanningSource, /captureAnalyticsEvent\("plan_generate"/);
  assert.match(tripPlanningSource, /event: "gap_view"/);
  assert.match(tripPlanningSource, /event: "plan_save"/);
  assert.match(tripPlanningSource, /event: "preparation_complete"/);
  assert.match(tripPlanningSource, /event: "second_plan_create"/);
  assert.match(gearFormSource, /captureAnalyticsEvent\("gear_mark_owned"/);
  assert.match(gearFormSource, /source: "gear_form"/);
  assert.match(gearFormSource, /is_catalog_item: Boolean\(productId\)/);
  assert.match(tripPlanActionsSource, /planCount: await getTripPlanCount\(supabase, user\.id\)/);
  assert.match(tripPlanActionsSource, /count: "exact"/);

  for (const sensitiveField of ["email", "memo", "mountain_slug", "mountainName", "productId"]) {
    assert.doesNotMatch(analyticsSource, new RegExp(sensitiveField));
  }
});

test("privacy policy discloses the narrowly scoped PostHog analytics use", () => {
  assert.match(privacySource, /PostHog/);
  assert.match(privacySource, /セッション録画およびヒートマップには利用しません/);
  assert.match(privacySource, /メールアドレス、氏名、メモ、正確な計画日/);
  assert.doesNotMatch(privacySource, /現時点では、広告配信SDK・アクセス解析ツール/);
});
