import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const packageSource = readFileSync("package.json", "utf8");
const capacitorConfigSource = readFileSync("capacitor.config.ts", "utf8");
const appDelegateSource = readFileSync("ios/App/App/AppDelegate.swift", "utf8");
const pocSource = readFileSync("capacitor-www/notification-poc.html", "utf8");

test("local notifications PoC uses the official Capacitor plugin with visible iOS presentation", () => {
  assert.match(packageSource, /"@capacitor\/local-notifications": "\^8\./);
  assert.match(capacitorConfigSource, /LocalNotifications:/);
  assert.match(capacitorConfigSource, /presentationOptions: \["badge", "sound", "banner", "list"\]/);
});

test("PoC remains a debug-only bundled local shell entry", () => {
  assert.match(appDelegateSource, /#if DEBUG[\s\S]*loadNotificationPoCWhenRequested\(\)/);
  assert.match(appDelegateSource, /-YamajitakuNotificationPoC/);
  assert.match(appDelegateSource, /capacitor:\/\/localhost\/notification-poc\.html/);
  assert.doesNotMatch(appDelegateSource, /URL\(string: "https:\/\/www\.yamajitaku\.com[^\n]*notification-poc/);
});

test("PoC only exposes manual permission and disposable test-notification actions", () => {
  assert.match(pocSource, /notifications\.checkPermissions\(\)/);
  assert.match(pocSource, /requestPermissions user action/);
  assert.match(pocSource, /notifications\.requestPermissions\(\)/);
  assert.match(pocSource, /TEST_DELAY_MS = 2 \* 60 \* 1000/);
  assert.match(pocSource, /notifications\.schedule\(/);
  assert.match(pocSource, /notifications\.getPending\(\)/);
  assert.match(pocSource, /notifications\.cancel\(/);
  assert.match(pocSource, /yamajitaku-local-notification-poc/);
  assert.doesNotMatch(pocSource, /trip_plans|planned_date|www\.yamajitaku\.com|supabase/i);
});
