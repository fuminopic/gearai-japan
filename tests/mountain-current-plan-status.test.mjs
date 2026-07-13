import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

const statusHelperSource = readFileSync(
  new URL("../src/lib/mountain-current-plan-status.ts", import.meta.url),
  "utf8"
);
const statusDataSource = readFileSync(
  new URL("../src/lib/data/mountain-current-plan-status.ts", import.meta.url),
  "utf8"
);
const planPageContentSource = readFileSync(
  new URL("../src/components/plan-page-content.tsx", import.meta.url),
  "utf8"
);
const tripPlanningFormSource = readFileSync(
  new URL("../src/components/trip-planning-form.tsx", import.meta.url),
  "utf8"
);
const tripPlanningUiSource = readFileSync(
  new URL("../src/components/trip-planning-ui.tsx", import.meta.url),
  "utf8"
);
const migrationSource = readFileSync(
  new URL("../supabase/migrations/055_mountain_current_plan_status.sql", import.meta.url),
  "utf8"
);
const stableProfileMigrationSource = readFileSync(
  new URL("../supabase/migrations/056_mountain_stable_profile_corrections.sql", import.meta.url),
  "utf8"
);

const { outputText } = ts.transpileModule(statusHelperSource, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022
  }
});
const statusHelper = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);

const statusRow = {
  mountain_slug: "example-san",
  status: "REVIEW_REQUIRED",
  reason_code: "VOLCANO_RESTRICTION",
  message_ja: "公式情報を確認してください。",
  source_url: "https://example.com/official",
  verified_at: "2026-07-01",
  review_after: "2026-07-10"
};

test("mountain current plan status schema is constrained, read-only, and has no seeded dynamic rows", () => {
  assert.match(migrationSource, /create table if not exists public\.mountain_current_plan_status/i);
  assert.match(migrationSource, /mountain_slug text primary key/);
  assert.match(migrationSource, /references public\.mountain_foundation_profiles\(slug\)/);
  assert.match(migrationSource, /status in \('REVIEW_REQUIRED', 'BLOCKED'\)/);
  assert.match(
    migrationSource,
    /reason_code in \([\s\S]*'VOLCANO_RESTRICTION'[\s\S]*'TRAIL_CLOSURE'[\s\S]*'SEASONAL_SNOW'[\s\S]*'OTHER'/
  );
  assert.match(migrationSource, /check \(review_after >= verified_at\)/);
  assert.match(migrationSource, /check \(btrim\(message_ja\) <> ''\)/);
  assert.match(migrationSource, /check \(btrim\(source_url\) <> ''\)/);
  assert.ok(migrationSource.includes("check (source_url ~ '^https?://')"));
  assert.match(migrationSource, /alter table public\.mountain_current_plan_status enable row level security/i);
  assert.match(
    migrationSource,
    /revoke all on table public\.mountain_current_plan_status from public, anon, authenticated/i
  );
  assert.match(
    migrationSource,
    /grant select on table public\.mountain_current_plan_status to authenticated/i
  );
  assert.match(
    migrationSource,
    /grant select, insert, update, delete on table public\.mountain_current_plan_status to service_role/i
  );
  assert.match(migrationSource, /for select\s+to authenticated\s+using \(true\)/i);
  assert.match(
    migrationSource,
    /drop trigger if exists set_mountain_current_plan_status_updated_at/
  );
  assert.match(
    migrationSource,
    /create trigger set_mountain_current_plan_status_updated_at\s+before update on public\.mountain_current_plan_status\s+for each row execute function public\.set_updated_at\(\)/i
  );
  assert.doesNotMatch(migrationSource, /insert into public\.mountain_current_plan_status/i);
  assert.doesNotMatch(migrationSource, /tokachi-dake|rausu-dake/i);
  assert.doesNotMatch(migrationSource, /update public\.mountain_foundation_profiles/i);
});

test("mountain current plan access keeps review required plans available and blocks only BLOCKED", () => {
  const reviewStatus = statusHelper.resolveMountainCurrentPlanStatus(statusRow, "2026-07-10");
  const staleReviewStatus = statusHelper.resolveMountainCurrentPlanStatus(statusRow, "2026-07-11");
  const blockedStatus = statusHelper.resolveMountainCurrentPlanStatus(
    { ...statusRow, status: "BLOCKED" },
    "2026-07-10"
  );
  const reviewAccess = statusHelper.resolveMountainPlanAccess({
    mountain: { volcanic_risk: "ACTIVE_MONITORED", planning_status: "PLANNABLE" },
    currentPlanStatus: reviewStatus
  });
  const blockedAccess = statusHelper.resolveMountainPlanAccess({
    mountain: { volcanic_risk: "ACTIVE_MONITORED", planning_status: "PLANNABLE" },
    currentPlanStatus: blockedStatus
  });
  const noStatusAccess = statusHelper.resolveMountainPlanAccess({
    mountain: { volcanic_risk: "NONE", planning_status: "PLANNABLE" }
  });
  const queryFailureAccess = statusHelper.resolveMountainPlanAccess({
    mountain: { volcanic_risk: "NONE", planning_status: "PLANNABLE" },
    currentPlanStatusReadFailed: true
  });
  const restrictedAccess = statusHelper.resolveMountainPlanAccess({
    mountain: { volcanic_risk: "ACTIVE_RESTRICTED", planning_status: "PLANNABLE" }
  });

  assert.equal(reviewStatus.isStale, false);
  assert.equal(staleReviewStatus.isStale, true);
  assert.equal(statusHelper.isMountainCurrentPlanStatusBlocked(reviewStatus), false);
  assert.equal(statusHelper.isMountainCurrentPlanStatusBlocked(blockedStatus), true);
  assert.equal(statusHelper.isMountainCurrentPlanStatusBlocked(undefined), false);
  assert.equal(reviewAccess.isGenerationBlocked, false);
  assert.equal(reviewAccess.currentPlanStatus.messageJa, statusRow.message_ja);
  assert.equal(reviewAccess.currentPlanStatus.sourceUrl, statusRow.source_url);
  assert.equal(blockedAccess.isGenerationBlocked, true);
  assert.equal(blockedAccess.planningBlockMessage, statusRow.message_ja);
  assert.equal(noStatusAccess.isGenerationBlocked, false);
  assert.equal(queryFailureAccess.isGenerationBlocked, true);
  assert.equal(queryFailureAccess.planningBlockMessage, null);
  assert.equal(restrictedAccess.isGenerationBlocked, true);
  assert.equal(
    restrictedAccess.planningBlockMessage,
    statusHelper.restrictedVolcanoPlanningMessage
  );
  assert.equal(
    statusHelper.mountainCurrentPlanStatusStaleMessage,
    "情報の確認期限を過ぎています。最新の公式情報を確認してください。"
  );
});

test("current plan status data reads fail closed and plan page consumes the executable guard", () => {
  assert.match(statusDataSource, /\.from\("mountain_current_plan_status"\)/);
  assert.match(statusDataSource, /resolveMountainCurrentPlanStatus\(row\)/);
  assert.match(statusDataSource, /if \(error\) \{\s*throw new Error\(error\.message\);\s*\}/);
  assert.doesNotMatch(statusDataSource, /isMissingMountainCurrentPlanStatusTableError/);
  assert.match(planPageContentSource, /getMountainCurrentPlanStatuses/);
  assert.match(planPageContentSource, /resolveMountainPlanAccess/);
  assert.match(planPageContentSource, /currentPlanStatusReadFailed/);
  assert.match(planPageContentSource, /mountainCurrentPlanStatusStaleMessage/);
  assert.match(planPageContentSource, /公式情報を確認/);
  assert.match(
    planPageContentSource,
    /else if \(!requestedPlanAccess\.isGenerationBlocked && shouldGeneratePlan && selectedMountain\)/
  );
  assert.match(
    planPageContentSource,
    /if \(planningBlockMessage\) \{[\s\S]*\} else if \(!requestedPlanAccess\.isGenerationBlocked && shouldGeneratePlan && selectedMountain\) \{[\s\S]*getPackRequirementPlan/
  );
  assert.match(
    planPageContentSource,
    /!plan && planStatusNotice[\s\S]*<MountainCurrentPlanStatusNotice status=\{planStatusNotice\} \/>/
  );
  assert.match(planPageContentSource, /planStatusNotice=\{planStatusNotice\}/);
  assert.match(tripPlanningUiSource, /planStatusNotice\?: MountainCurrentPlanStatus/);
  assert.match(
    tripPlanningUiSource,
    /<div ref=\{resultSectionRef\}[\s\S]*<MountainCurrentPlanStatusNotice status=\{planStatusNotice\} \/>[\s\S]*<TripPlanningResult/
  );
  assert.match(tripPlanningUiSource, /mountainCurrentPlanStatusStaleMessage/);
  assert.match(tripPlanningFormSource, /blockedMountainSlugs/);
  assert.match(tripPlanningFormSource, /blockedMountainSlugs\.has\(mountain\.slug\)/);
});

test("schema migration leaves all mountain profiles unchanged", () => {
  assert.doesNotMatch(migrationSource, /update public\.mountain_foundation_profiles/i);
  assert.doesNotMatch(migrationSource, /ontake-san|aso-san/i);
});

test("stable profile migration changes only Aso without prematurely changing Ontake", () => {
  assert.match(
    stableProfileMigrationSource,
    /update public\.mountain_foundation_profiles\s+set supported_styles = array\['DAY_HIKE'\]::text\[],[\s\S]*hut_support = 'NONE',[\s\S]*where slug = 'aso-san';/i
  );
  assert.doesNotMatch(stableProfileMigrationSource, /ontake-san/i);
  assert.doesNotMatch(stableProfileMigrationSource, /mountain_current_plan_status/i);
  assert.doesNotMatch(stableProfileMigrationSource, /2026年|500m|ヘリ事故|レベル連動/);
  assert.doesNotMatch(stableProfileMigrationSource, /insert|delete|alter|drop|create/i);
});
