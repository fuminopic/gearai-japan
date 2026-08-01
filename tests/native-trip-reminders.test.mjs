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
  assert.match(reminders, /weekendPlanReminderTitle/);
  assert.match(reminders, /weekendPlanReminderBody/);
  assert.match(api, /buildNativeTripReminders\(plans\)/);
  assert.match(reminders, /Date\.UTC\(year, month - 1, day - 1, 11, 0, 0\)/);
  assert.match(reminders, /timeZone: "Asia\/Tokyo"/);
  assert.doesNotMatch(appDelegate, /山行前日の準備をお知らせします/);
});

test("previous-evening and Thursday reminder copy is the approved Japanese copy", () => {
  assert.match(reminders, /明日の山、準備はできていますか？/);
  assert.match(reminders, /安心して出発できるように、持ち物をひと目だけ確認しておきましょう。/);
  assert.match(reminders, /今週末、山の予定はありますか？/);
  assert.match(reminders, /予定が決まっていたら、山支度で少しずつ準備を始めましょう。/);
  assert.doesNotMatch(appDelegate, /明日の山、準備はできていますか？/);
  assert.doesNotMatch(appDelegate, /今週末、山の予定はありますか？/);
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

test("Thursday weekend reminders are one-off JST reminders and are suppressed by any overlapping weekend plan", () => {
  const moduleUrl = new URL("../src/lib/native-trip-reminders.ts", import.meta.url).href;
  const sampleId = "11111111-1111-4111-8111-111111111111";
  const output = execFileSync(
    process.execPath,
    [
      "--no-warnings",
      "--experimental-strip-types",
      "--input-type=module",
      "-e",
      `const { buildWeekendPlanReminder } = await import(${JSON.stringify(moduleUrl)}); const id=${JSON.stringify(sampleId)}; const before=buildWeekendPlanReminder([],new Date('2026-08-01T01:00:00.000Z')); const atCutoff=buildWeekendPlanReminder([],new Date('2026-08-06T10:30:00.000Z')); const saturday=buildWeekendPlanReminder([{id,planned_date:'2026-08-08',planned_end_date:null}],new Date('2026-08-01T01:00:00.000Z')); const overnight=buildWeekendPlanReminder([{id,planned_date:'2026-08-07',planned_end_date:'2026-08-08'}],new Date('2026-08-01T01:00:00.000Z')); const old=buildWeekendPlanReminder([{id,planned_date:'2026-07-25',planned_end_date:null}],new Date('2026-08-01T01:00:00.000Z')); console.log(JSON.stringify({before,atCutoff,saturday,overnight,old}));`
    ],
    { encoding: "utf8" }
  );
  const result = JSON.parse(output);

  assert.equal(result.before.key, "weekend-plan-2026-08-06");
  assert.equal(result.before.schedule.at, "2026-08-06T10:30:00.000Z");
  assert.equal(result.before.schedule.kind, "once");
  assert.equal(result.before.route, "/plan");
  assert.equal(result.atCutoff.key, "weekend-plan-2026-08-13");
  assert.equal(result.atCutoff.schedule.at, "2026-08-13T10:30:00.000Z");
  assert.equal(result.saturday, null);
  assert.equal(result.overnight, null);
  assert.equal(result.old.key, "weekend-plan-2026-08-06");
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
  assert.match(coordinator, /buildImmediateReminderDialog/);
  assert.match(coordinator, /確認が必要な山行があります/);
  assert.match(coordinator, /markNativeImmediateRemindersShown/);
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
  assert.match(appDelegate, /weekend-plan-/);
  assert.match(appDelegate, /markImmediateShown/);
  assert.match(appDelegate, /immediateShownPrefix/);
  assert.match(appDelegate, /resetImmediateShownForAccountSwitch/);
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
  assert.match(appDelegate, /route === '\/plan'/);
  assert.match(read("capacitor-www/index.html"), /notificationRoute !== "\/plan"/);
  assert.match(tripPlanningUi, /planView === "checklist"/);
});

test("immediate reminders are acknowledged once per scoped plan and aggregate multiple overdue plans", () => {
  assert.match(bridge, /markImmediateShown/);
  assert.match(bridge, /plannedDate/);
  assert.match(appDelegate, /immediate reminder acknowledged scope=/);
  assert.match(appDelegate, /shownImmediateKeys\.formIntersection\(activeImmediateKeys\)/);
  assert.match(appDelegate, /UUID\(uuidString: \$0\) != nil/);
  assert.match(coordinator, /keys: sorted\.map/);
  assert.match(coordinator, /left\.plannedDate\.localeCompare\(right\.plannedDate\)/);
  assert.match(coordinator, /確認が必要な山行があります/);
});

test("trip create, update, and delete each request a native reconcile after server success", () => {
  assert.match(tripPlanningUi, /notifyTripPlanReminderSync\(planId \? "updated" : "created"\)/);
  assert.match(tripPlanningUi, /notifyTripPlanReminderSync\("updated"\)/);
  assert.match(tripPlanningUi, /notifyTripPlanReminderSync\("deleted"\)/);
});
