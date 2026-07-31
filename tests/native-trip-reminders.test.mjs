import assert from "node:assert/strict";
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
});

test("notification actions route only to the existing plan checklist URL", () => {
  assert.match(appDelegate, /components\.path == "\/plan"/);
  assert.match(appDelegate, /values\["focus"\] == "checklist"/);
  assert.match(appDelegate, /yamajitaku-native-notification-route/);
  assert.match(tripPlanningUi, /shouldFocusChecklist = searchParams\.get\("focus"\) === "checklist"/);
});

test("trip create, update, and delete each request a native reconcile after server success", () => {
  assert.match(tripPlanningUi, /notifyTripPlanReminderSync\(planId \? "updated" : "created"\)/);
  assert.match(tripPlanningUi, /notifyTripPlanReminderSync\("updated"\)/);
  assert.match(tripPlanningUi, /notifyTripPlanReminderSync\("deleted"\)/);
});
