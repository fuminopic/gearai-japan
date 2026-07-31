import type { NativeReminderConfig } from "@/lib/native-trip-reminders";

type PermissionDisplay = "prompt" | "granted" | "denied";

type NativeBridge = {
  invoke: (command: string, payload?: unknown) => Promise<unknown>;
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

  return nativeBridge.invoke("reconcile", {
    scope: payload.scope,
    reminders: payload.reminders as NativeReminderConfig[]
  });
}

export function notifyTripPlanReminderSync(kind: "created" | "updated" | "deleted") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("yamajitaku:trip-plan-reminder-sync", { detail: { kind } })
  );
}
