import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const packageJson = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8")
);
const tripReminderSource = readFileSync(
  new URL("../src/lib/trip-reminder.ts", import.meta.url),
  "utf8"
);
const tripReminderSyncSource = readFileSync(
  new URL("../src/components/trip-reminder-sync.tsx", import.meta.url),
  "utf8"
);
const planTripReminderSyncSource = readFileSync(
  new URL("../src/components/plan-trip-reminder-sync.tsx", import.meta.url),
  "utf8"
);
const planPageContentSource = readFileSync(
  new URL("../src/components/plan-page-content.tsx", import.meta.url),
  "utf8"
);
const appLayoutSource = readFileSync(
  new URL("../app/(app)/layout.tsx", import.meta.url),
  "utf8"
);
const tripPlanningUiSource = readFileSync(
  new URL("../src/components/trip-planning-ui.tsx", import.meta.url),
  "utf8"
);

test("trip reminders use the Capacitor local notifications plugin dynamically", () => {
  assert.match(
    packageJson.dependencies["@capacitor/local-notifications"],
    /^\^8\./
  );
  assert.match(tripReminderSource, /import\("@capacitor\/local-notifications"\)/);
  assert.match(tripReminderSource, /import\("@capacitor\/core"\)/);
  assert.match(tripReminderSource, /Capacitor\.isNativePlatform\(\)/);
  assert.match(tripReminderSource, /Capacitor\.getPlatform\(\) !== "ios"/);
  assert.match(tripReminderSource, /catch \{/);
});

test("trip reminders derive stable ids and schedule previous-day local 20:00", () => {
  assert.match(tripReminderSource, /getTripReminderNotificationId/);
  assert.match(tripReminderSource, /Math\.imul\(hash, 16777619\)/);
  assert.match(tripReminderSource, /TRIP_REMINDER_ID_OFFSET/);
  assert.match(tripReminderSource, /new Date\(year, monthIndex, day, 20, 0, 0, 0\)/);
  assert.match(tripReminderSource, /reminderDate\.setDate\(reminderDate\.getDate\(\) - 1\)/);
  assert.match(tripReminderSource, /notifyAt\.getTime\(\) <= now\.getTime\(\)/);
});

test("trip reminders reconcile scoped local plan metadata without server push", () => {
  assert.match(tripReminderSource, /readTripReminderPlansFromLocalStorage/);
  assert.match(tripReminderSource, /yamajitaku:v1:user:/);
  assert.match(tripReminderSource, /:trip-plan:/);
  assert.match(tripReminderSource, /:meta/);
  assert.match(tripReminderSource, /reconcileTripReminders/);
  assert.match(tripReminderSource, /getPending/);
  assert.match(tripReminderSource, /notifications\.cancel/);
  assert.match(tripReminderSource, /notifications\.schedule/);
  assert.doesNotMatch(tripReminderSource, /createClient/);
  assert.doesNotMatch(tripReminderSource, /fetch\(/);
});

test("trip reminder sync mounts in the authenticated app layout", () => {
  assert.match(tripReminderSyncSource, /"use client"/);
  assert.match(tripReminderSyncSource, /registerTripReminderActionListener/);
  assert.doesNotMatch(tripReminderSyncSource, /requestReminderPermission/);
  assert.doesNotMatch(tripReminderSyncSource, /reconcileTripReminders/);
  assert.doesNotMatch(tripReminderSyncSource, /readTripReminderPlansFromLocalStorage/);
  assert.match(
    tripReminderSyncSource,
    /router\.push\(`\/plan\?id=\$\{encodeURIComponent\(planId\)\}&focus=checklist`\)/
  );
  assert.match(appLayoutSource, /<TripReminderSync userId=\{user\.id\} \/>/);
});

test("trip reminders request permission and schedule from the current plan page", () => {
  assert.match(planTripReminderSyncSource, /"use client"/);
  assert.match(planTripReminderSyncSource, /requestReminderPermission/);
  assert.match(planTripReminderSyncSource, /requestReminderPermission\(\)\.then/);
  assert.match(planTripReminderSyncSource, /scheduleTripReminder/);
  assert.match(planTripReminderSyncSource, /scheduleTripReminder\(planId, plannedDate\)/);
  assert.match(planTripReminderSyncSource, /planId: string \| null/);
  assert.match(planTripReminderSyncSource, /plannedDate: string \| null/);
  assert.match(planTripReminderSyncSource, /planTitle\?: string \| null/);
  assert.doesNotMatch(planTripReminderSyncSource, /readTripReminderPlansFromLocalStorage/);
  assert.match(planPageContentSource, /planId=\{selectedSavedPlan\?\.id \?\? null\}/);
  assert.match(planPageContentSource, /plannedDate=\{selectedSavedPlan\?\.planned_date \?\? null\}/);
  assert.match(planPageContentSource, /planTitle=\{selectedSavedPlan\?\.mountain_name \?\? null\}/);
});

test("trip reminders request native notification permission whenever not granted", () => {
  assert.match(tripReminderSource, /notifications\.checkPermissions\(\)/);
  assert.match(tripReminderSource, /console\.debug\("\[TripReminder\] checkPermissions result"/);
  assert.match(tripReminderSource, /if \(current\.display === "granted"\) \{/);
  assert.match(tripReminderSource, /console\.debug\("\[TripReminder\] requestPermissions called"\)/);
  assert.match(tripReminderSource, /notifications\.requestPermissions\(\)/);
  assert.match(tripReminderSource, /console\.debug\("\[TripReminder\] requestPermissions result"/);
  assert.doesNotMatch(tripReminderSource, /if \(current\.display === "denied"\) \{\s*return false;/);
});

test("trip reminder v1 does not touch the trip planning ui save flow", () => {
  assert.doesNotMatch(tripPlanningUiSource, /TripReminderSync/);
  assert.doesNotMatch(tripPlanningUiSource, /PlanTripReminderSync/);
  assert.doesNotMatch(tripPlanningUiSource, /reconcileTripReminders/);
  assert.doesNotMatch(tripPlanningUiSource, /scheduleTripReminder/);
});
