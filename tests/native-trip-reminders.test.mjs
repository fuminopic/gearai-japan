import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const bridge = read("src/lib/native-notification-bridge.ts");
const coordinator = read("src/components/native-notification-coordinator.tsx");
const api = read("app/api/native-notifications/reminders/route.ts");
const reminders = read("src/lib/native-trip-reminders.ts");
const appDelegate = read("ios/App/App/AppDelegate.swift");
const tripPlanningUi = read("src/components/trip-planning-ui.tsx");

test("trip reminders are authored by the authenticated web source in JST, not Swift", () => {
  assert.match(api, /requireUser\(\)/);
  assert.match(api, /getTripPlans\(\)/);
  assert.match(api, /Cache-Control.*private, no-store/);
  assert.match(reminders, /tripReminderTitle/);
  assert.match(reminders, /tripReminderBody/);
  assert.match(reminders, /Date\.UTC\(year, month - 1, day - 1, 11, 0, 0\)/);
  assert.match(reminders, /timeZone: "Asia\/Tokyo"/);
  assert.doesNotMatch(appDelegate, /山行前日の準備をお知らせします/);
});

test("trip reminders use the JST cutoff and return an immediate checklist prompt only for today or overdue tomorrow", () => {
  const moduleUrl = new URL("../src/lib/native-trip-reminders.ts", import.meta.url).href;
  const sampleId = "11111111-1111-4111-8111-111111111111";
  const output = execFileSync(
    process.execPath,
    [
      "--no-warnings",
      "--experimental-strip-types",
      "--input-type=module",
      "-e",
      `const { buildTripPlanReminder } = await import(${JSON.stringify(moduleUrl)}); const id=${JSON.stringify(sampleId)}; const normal=buildTripPlanReminder({id,planned_date:'2026-08-02'},new Date('2026-08-01T10:59:59.000Z')); const overdueTomorrow=buildTripPlanReminder({id,planned_date:'2026-08-02'},new Date('2026-08-01T11:00:00.000Z')); const today=buildTripPlanReminder({id,planned_date:'2026-08-01'},new Date('2026-08-01T01:00:00.000Z')); const old=buildTripPlanReminder({id,planned_date:'2026-07-31'},new Date('2026-08-01T01:00:00.000Z')); console.log(JSON.stringify({normal,overdueTomorrow,today,old}));`
    ],
    { encoding: "utf8" }
  );
  const result = JSON.parse(output);

  assert.equal(result.normal.schedule.at, "2026-08-01T11:00:00.000Z");
  assert.equal(result.normal.immediate, undefined);
  assert.equal(result.overdueTomorrow.immediate.title, "明日の登山予定");
  assert.equal(result.today.immediate.title, "本日の登山予定");
  assert.equal(result.old.immediate, undefined);
});

test("remote web never uses Capacitor and only invokes fixed native bridge commands", () => {
  assert.match(bridge, /YamajitakuNativeNotifications/);
  assert.doesNotMatch(bridge, /Capacitor\.isNativePlatform|window\.Capacitor/);
  for (const command of ["checkPermission", "requestPermission", "openSettings", "reconcile"]) {
    assert.match(bridge, new RegExp(`"${command}"`));
  }
  assert.match(coordinator, /permission === "prompt"/);
  assert.match(coordinator, /kind === "created"/);
  assert.match(coordinator, /permission === "denied"/);
  assert.match(coordinator, /document\.visibilityState === "visible"/);
  assert.match(coordinator, /immediateReminder/);
  assert.match(coordinator, /チェックリストを確認/);
});

test("native bridge is domain-limited, validates payloads, and delegates to the official plugin", () => {
  assert.match(appDelegate, /allowedHosts = Set\(\["yamajitaku\.com", "www\.yamajitaku\.com"\]\)/);
  assert.match(appDelegate, /url\.scheme == "https"/);
  assert.match(appDelegate, /rejected unknown command/);
  assert.match(appDelegate, /plugin\(withName: "LocalNotifications"\)/);
  assert.match(appDelegate, /invokePlugin\("checkPermissions"/);
  assert.match(appDelegate, /invokePlugin\("requestPermissions"/);
  assert.match(appDelegate, /invokePlugin\("getPending"/);
  assert.match(appDelegate, /invokePlugin\("schedule"/);
  assert.match(appDelegate, /invokePlugin\("cancel"/);
  assert.match(appDelegate, /case \.weekly/);
  assert.match(appDelegate, /SHA256\.hash/);
  assert.match(appDelegate, /UUID\(uuidString: scope\)/);
  assert.match(appDelegate, /checkPermissions" \|\| method == "requestPermissions/);
  assert.match(appDelegate, /pending count=/);
  assert.match(appDelegate, /scheduling id=/);
  assert.match(appDelegate, /#if DEBUG/);
  assert.match(appDelegate, /-YamajitakuFastTripReminder/);
  assert.match(appDelegate, /DEBUG fast reminder/);
  assert.match(appDelegate, /fastMode/);
  assert.match(appDelegate, /immediate/);
  assert.match(appDelegate, /reconcile scheduling skipped/);
});

test("notification actions use the dedicated checklist URL and preserve already pending legacy routes", () => {
  assert.match(appDelegate, /components\.path == "\/plan"/);
  assert.match(reminders, /view=checklist/);
  assert.match(appDelegate, /values\["view"\] == "checklist"/);
  assert.match(appDelegate, /values\["focus"\] == "checklist"/);
  assert.match(appDelegate, /yamajitaku-native-notification-route/);
  assert.match(tripPlanningUi, /planView === "checklist"/);
});

test("trip create, update, and delete each request a native reconcile after server success", () => {
  assert.match(tripPlanningUi, /notifyTripPlanReminderSync\(planId \? "updated" : "created"\)/);
  assert.match(tripPlanningUi, /notifyTripPlanReminderSync\("updated"\)/);
  assert.match(tripPlanningUi, /notifyTripPlanReminderSync\("deleted"\)/);
});
