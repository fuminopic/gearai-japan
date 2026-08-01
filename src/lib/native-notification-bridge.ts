import type { NativeReminderConfig } from "@/lib/native-trip-reminders";

type PermissionDisplay = "prompt" | "granted" | "denied";

type NativeBridge = {
  invoke: (command: string, payload?: unknown) => Promise<unknown>;
};

export type NativeImmediateChecklistReminder = {
  key: string;
  plannedDate: string;
  title: string;
  body: string;
  route: string;
};

export type NativeReminderSyncResult = {
  scope: string;
  scheduled: number;
  cancelled: number;
  skippedPast: number;
  fastMode: boolean;
  immediate: NativeImmediateChecklistReminder[];
};

declare global {
  interface Window {
    YamajitakuNativeNotifications?: NativeBridge;
  }
}

function bridge(): NativeBridge | null {
  if (typeof window === "undefined") return null;
  return window.YamajitakuNativeNotifications ?? null;
}

function asPermissionDisplay(value: unknown): PermissionDisplay | null {
  if (!value || typeof value !== "object") return null;
  const display = (value as { display?: unknown }).display;
  return display === "prompt" || display === "granted" || display === "denied"
    ? display
    : null;
}

export function hasNativeNotificationBridge() {
  return bridge() !== null;
}

export async function getNativeNotificationPermission() {
  const result = await bridge()?.invoke("checkPermission");
  return asPermissionDisplay(result);
}

export async function requestNativeNotificationPermission() {
  const result = await bridge()?.invoke("requestPermission");
  return asPermissionDisplay(result);
}

export async function setNativeNotificationPromptDeferred(deferred: boolean) {
  await bridge()?.invoke("setPromptDeferred", { deferred });
}

export async function getNativeNotificationPromptDeferred() {
  const result = await bridge()?.invoke("getPromptDeferred");
  return Boolean((result as { deferred?: unknown } | null)?.deferred);
}

export async function openNativeNotificationSettings() {
  await bridge()?.invoke("openSettings");
}

export async function markNativeImmediateRemindersShown(
  scope: string,
  keys: string[]
) {
  await bridge()?.invoke("markImmediateShown", { scope, keys });
}

export async function reconcileNativeTripReminders() {
  const nativeBridge = bridge();
  if (!nativeBridge) return null;

  const response = await fetch("/api/native-notifications/reminders", {
    cache: "no-store",
    credentials: "same-origin"
  });

  if (!response.ok) {
    throw new Error("通知用の山行計画を取得できませんでした。");
  }

  const payload = (await response.json()) as {
    scope?: unknown;
    reminders?: unknown;
  };

  if (
    typeof payload.scope !== "string" ||
    !Array.isArray(payload.reminders)
  ) {
    throw new Error("通知用の山行計画の形式が不正です。");
  }

  const result = await nativeBridge.invoke("reconcile", {
    scope: payload.scope,
    reminders: payload.reminders as NativeReminderConfig[]
  });

  return asNativeReminderSyncResult(result);
}

function asNativeReminderSyncResult(value: unknown): NativeReminderSyncResult | null {
  if (!value || typeof value !== "object") return null;
  const result = value as Partial<NativeReminderSyncResult>;
  const immediate = Array.isArray(result.immediate)
    ? result.immediate.filter(isNativeImmediateChecklistReminder)
    : [];

  return {
    scope: typeof result.scope === "string" ? result.scope : "",
    scheduled: typeof result.scheduled === "number" ? result.scheduled : 0,
    cancelled: typeof result.cancelled === "number" ? result.cancelled : 0,
    skippedPast: typeof result.skippedPast === "number" ? result.skippedPast : 0,
    fastMode: result.fastMode === true,
    immediate
  };
}

function isNativeImmediateChecklistReminder(value: unknown): value is NativeImmediateChecklistReminder {
  if (!value || typeof value !== "object") return false;
  const reminder = value as Partial<NativeImmediateChecklistReminder>;
  return (
    typeof reminder.key === "string" &&
    /^[0-9a-f-]{36}$/i.test(reminder.key) &&
    typeof reminder.plannedDate === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(reminder.plannedDate) &&
    typeof reminder.title === "string" &&
    typeof reminder.body === "string" &&
    typeof reminder.route === "string" &&
    /^\/plan\?id=[0-9a-f-]{36}&view=checklist$/i.test(reminder.route)
  );
}

export function notifyTripPlanReminderSync(kind: "created" | "updated" | "deleted") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("yamajitaku:trip-plan-reminder-sync", { detail: { kind } })
  );
}
