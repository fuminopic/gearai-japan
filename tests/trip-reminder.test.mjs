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
  assert.match(tripReminderSource, /catch \(error\)/);
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
  assert.match(tripReminderSyncSource, /requestReminderPermission/);
  assert.match(tripReminderSyncSource, /reconcileTripReminders/);
  assert.match(tripReminderSyncSource, /readTripReminderPlansFromLocalStorage\(userId\)/);
  assert.match(tripReminderSyncSource, /window\.setTimeout/);
  assert.match(tripReminderSyncSource, /TRIP_REMINDER_PERMISSION_DELAY_MS = 1000/);
  assert.match(tripReminderSyncSource, /requestReminderPermission\(\{ diagnostics: true \}\)\.then/);
  assert.match(
    tripReminderSyncSource,
    /router\.push\(`\/plan\?id=\$\{encodeURIComponent\(planId\)\}&focus=checklist`\)/
  );
  assert.match(appLayoutSource, /<TripReminderSync userId=\{user\.id\} \/>/);
});

test("trip reminder permission diagnostics stay native-only and catch plugin errors", () => {
  assert.match(tripReminderSyncSource, /logNativeTripReminderMount/);
  assert.match(tripReminderSyncSource, /Capacitor\.isNativePlatform\(\)/);
  assert.match(tripReminderSyncSource, /Capacitor\.getPlatform\(\) === "ios"/);
  assert.match(tripReminderSyncSource, /console\.debug\("\[TripReminderSync\]", "component mounted"\)/);
  assert.match(tripReminderSyncSource, /catch\(\(\) => \{/);
  assert.match(tripReminderSource, /"Capacitor\.isNativePlatform\(\)"/);
  assert.match(tripReminderSource, /"LocalNotifications import succeeded"/);
  assert.match(tripReminderSource, /"checkPermissions result"/);
  assert.match(tripReminderSource, /"requestPermissions called"/);
  assert.match(tripReminderSource, /"requestPermissions result"/);
  assert.match(tripReminderSource, /"catch error"/);
  assert.match(tripReminderSource, /console\.debug\("\[TripReminder\]", message, value\)/);
});

test("trip reminder v1 does not touch the trip planning ui save flow", () => {
  assert.doesNotMatch(tripPlanningUiSource, /TripReminderSync/);
  assert.doesNotMatch(tripPlanningUiSource, /reconcileTripReminders/);
  assert.doesNotMatch(tripPlanningUiSource, /scheduleTripReminder/);
});
