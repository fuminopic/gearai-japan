import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const rootUrl = new URL("../", import.meta.url);

function readSource(relativePath) {
  return readFileSync(new URL(relativePath, rootUrl), "utf8");
}

const planChecklistSource = readSource("src/lib/plan-checklist.ts");
const tripPlanStorageSource = readSource("src/lib/trip-plan-storage.ts");
const tripPlanningUiSource = readSource("src/components/trip-planning-ui.tsx");
const heroGaugeSource = readSource("src/components/hero-gauge.tsx");
const dashboardChecklistSource = readSource(
  "src/components/dashboard-plan-checklist-summary.tsx"
);
const dashboardPlanMetaSource = readSource("src/components/dashboard-plan-meta.tsx");
const heroCountdownSource = readSource("src/components/hero-countdown.tsx");

const targetStorageVersion = "v1";
const targetStorageKinds = {
  checkedSlots: "checked-slots",
  checklistOnly: "checklist-only",
  meta: "meta"
};

function buildDocumentedTargetKey({ userId, planId, kind }) {
  return `yamajitaku:${targetStorageVersion}:user:${userId}:trip-plan:${planId}:${kind}`;
}

function makeDocumentedEnvelope({ value, nowMs, ttlMs }) {
  return {
    schemaVersion: targetStorageVersion,
    updatedAt: new Date(nowMs).toISOString(),
    expiresAt: new Date(nowMs + ttlMs).toISOString(),
    value
  };
}

function readDocumentedEnvelope(envelope, nowMs, emptyValue) {
  if (!envelope || envelope.schemaVersion !== targetStorageVersion) {
    return emptyValue;
  }

  if (Date.parse(envelope.expiresAt) <= nowMs) {
    return emptyValue;
  }

  return envelope.value;
}

function getDocumentedReadCandidates({ userId, planId, kind, legacyKey }) {
  return [
    buildDocumentedTargetKey({ userId, planId, kind }),
    legacyKey
  ];
}

function getDocumentedLegacyCleanupKeys(planId) {
  return [
    `yamajitaku:trip-plan:checked-slots:${planId}`,
    `yamajitaku:trip-plan:checklist-only:${planId}`,
    `yamajitaku:trip-plan-meta:${planId}`
  ];
}

test("current checklist localStorage keys remain legacy plan-id-only keys", () => {
  assert.match(
    planChecklistSource,
    /const checkedSlotsStoragePrefix = "yamajitaku:trip-plan:checked-slots:";/
  );
  assert.match(
    planChecklistSource,
    /return `yamajitaku:trip-plan:checklist-only:\$\{planId\}`;/
  );
  assert.match(
    planChecklistSource,
    /return `\$\{checkedSlotsStoragePrefix\}\$\{planId\}`;/
  );
});

test("current checklist payloads do not yet include user scope, version, or ttl", () => {
  assert.doesNotMatch(planChecklistSource, /schemaVersion/);
  assert.doesNotMatch(planChecklistSource, /expiresAt/);
  assert.doesNotMatch(planChecklistSource, /updatedAt/);
  assert.doesNotMatch(planChecklistSource, /userId|user_id/);

  assert.match(tripPlanningUiSource, /window\.localStorage\.setItem/);
});

test("future scoped key contract includes version, user id, plan id, and value kind", () => {
  const userId = "user_123";
  const planId = "plan_456";

  assert.equal(
    buildDocumentedTargetKey({
      userId,
      planId,
      kind: targetStorageKinds.checkedSlots
    }),
    "yamajitaku:v1:user:user_123:trip-plan:plan_456:checked-slots"
  );
  assert.equal(
    buildDocumentedTargetKey({
      userId,
      planId,
      kind: targetStorageKinds.checklistOnly
    }),
    "yamajitaku:v1:user:user_123:trip-plan:plan_456:checklist-only"
  );
  assert.equal(
    buildDocumentedTargetKey({ userId, planId, kind: targetStorageKinds.meta }),
    "yamajitaku:v1:user:user_123:trip-plan:plan_456:meta"
  );
});

test("trip plan meta storage now exposes the scoped key contract", () => {
  assert.match(tripPlanStorageSource, /const TRIP_PLAN_STORAGE_VERSION = "v1";/);
  assert.match(
    tripPlanStorageSource,
    /yamajitaku:\$\{TRIP_PLAN_STORAGE_VERSION\}:user:\$\{userId\}:trip-plan:\$\{planId\}:meta/
  );
  assert.match(
    tripPlanStorageSource,
    /return `yamajitaku:trip-plan-meta:\$\{planId\}`;/
  );
});

test("future payload envelope contract includes version, timestamps, ttl, and value", () => {
  const nowMs = Date.parse("2026-07-02T00:00:00.000Z");
  const envelope = makeDocumentedEnvelope({
    value: ["WATER_STORAGE"],
    nowMs,
    ttlMs: 30 * 24 * 60 * 60 * 1000
  });

  assert.deepEqual(Object.keys(envelope), [
    "schemaVersion",
    "updatedAt",
    "expiresAt",
    "value"
  ]);
  assert.equal(envelope.schemaVersion, "v1");
  assert.equal(envelope.updatedAt, "2026-07-02T00:00:00.000Z");
  assert.equal(envelope.expiresAt, "2026-08-01T00:00:00.000Z");
  assert.deepEqual(envelope.value, ["WATER_STORAGE"]);
});

test("trip plan meta storage now writes the scoped payload envelope", () => {
  for (const field of ["schemaVersion", "updatedAt", "expiresAt", "value"]) {
    assert.match(tripPlanStorageSource, new RegExp(`${field}:`));
  }

  assert.match(tripPlanStorageSource, /JSON\.stringify\(envelope\)/);
});

test("future ttl contract accepts fresh values and rejects expired values", () => {
  const nowMs = Date.parse("2026-07-02T00:00:00.000Z");
  const freshEnvelope = makeDocumentedEnvelope({
    value: ["FIRST_AID_KIT"],
    nowMs,
    ttlMs: 60_000
  });
  const expiredEnvelope = makeDocumentedEnvelope({
    value: ["FIRST_AID_KIT"],
    nowMs,
    ttlMs: -1
  });

  assert.deepEqual(readDocumentedEnvelope(freshEnvelope, nowMs, []), [
    "FIRST_AID_KIT"
  ]);
  assert.deepEqual(readDocumentedEnvelope(expiredEnvelope, nowMs, []), []);
  assert.equal(readDocumentedEnvelope(expiredEnvelope, nowMs, null), null);
});

test("trip plan meta storage now applies ttl expiry and removes expired scoped keys", () => {
  assert.match(tripPlanStorageSource, /Date\.parse\(parsed\.expiresAt\) <= Date\.now\(\)/);
  assert.match(tripPlanStorageSource, /storage\.removeItem\(storageKey\)/);
  assert.match(tripPlanStorageSource, /return \{ status: "found", value: null \};/);
});

test("future legacy fallback contract prefers scoped keys and cleans only the current plan", () => {
  const userId = "user_123";
  const planId = "plan_456";
  const legacyKey = `yamajitaku:trip-plan:checked-slots:${planId}`;
  const candidates = getDocumentedReadCandidates({
    userId,
    planId,
    kind: targetStorageKinds.checkedSlots,
    legacyKey
  });

  assert.deepEqual(candidates, [
    "yamajitaku:v1:user:user_123:trip-plan:plan_456:checked-slots",
    "yamajitaku:trip-plan:checked-slots:plan_456"
  ]);
  assert.deepEqual(getDocumentedLegacyCleanupKeys(planId), [
    "yamajitaku:trip-plan:checked-slots:plan_456",
    "yamajitaku:trip-plan:checklist-only:plan_456",
    "yamajitaku:trip-plan-meta:plan_456"
  ]);
});

test("trip plan meta storage now falls back to legacy and migrates only the current plan", () => {
  assert.match(tripPlanStorageSource, /const legacyKey = buildLegacyTripPlanMetaStorageKey\(planId\);/);
  assert.match(tripPlanStorageSource, /writeTripPlanMeta\(\{ userId, planId, value: legacyValue \}\);/);
  assert.match(tripPlanStorageSource, /storage\.removeItem\(legacyKey\);/);
  assert.doesNotMatch(tripPlanStorageSource, /for\s*\([^)]*localStorage|Object\.keys\(localStorage\)/);
});

test("current localStorage reads can affect dashboard, hero, and checklist displays", () => {
  assert.match(tripPlanningUiSource, /readStoredCheckedSlots\(planId\)/);
  assert.match(tripPlanningUiSource, /readStoredChecklistOnlyIds\(planId\)/);
  assert.match(heroGaugeSource, /window\.localStorage\.getItem/);
  assert.match(dashboardChecklistSource, /window\.localStorage\.getItem/);
  assert.match(dashboardPlanMetaSource, /readTripPlanLocalMeta\(planId\)/);
  assert.match(heroCountdownSource, /readTripPlanLocalMeta\(planId\)/);
});

test("trip planning meta calls can pass user scope without migrating checklist calls", () => {
  assert.match(tripPlanningUiSource, /readTripPlanLocalMeta\(planId, \{ userId: currentPlanUserId \}\)/);
  assert.match(tripPlanningUiSource, /writeTripPlanLocalMeta\([\s\S]*\{ userId: currentPlanUserId \}/);
  assert.match(tripPlanningUiSource, /writeTripPlanLocalMeta\([\s\S]*\{ userId \}/);
  assert.match(tripPlanningUiSource, /writeStoredCheckedSlots\(savedPlanId, checkedSlots\)/);
  assert.match(tripPlanningUiSource, /writeStoredChecklistOnlyIds\(savedPlanId, checklistOnlyIds\)/);
});
