"use client";

import { Capacitor } from "@capacitor/core";

type ImpactStyleKey = "LIGHT" | "MEDIUM" | "HEAVY";
type NotificationKey = "SUCCESS" | "WARNING" | "ERROR";

function canHaptic(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

async function loadHaptics() {
  return import("@capacitor/haptics");
}

async function runImpact(style: ImpactStyleKey) {
  if (!canHaptic()) return;

  try {
    const { Haptics, ImpactStyle } = await loadHaptics();
    const impactStyle = {
      LIGHT: ImpactStyle.Light,
      MEDIUM: ImpactStyle.Medium,
      HEAVY: ImpactStyle.Heavy
    }[style];
    await Haptics.impact({ style: impactStyle });
  } catch {
    // Haptics are best-effort feedback and must not affect the operation.
  }
}

async function runNotification(type: NotificationKey) {
  if (!canHaptic()) return;

  try {
    const { Haptics, NotificationType } = await loadHaptics();
    const notificationType = {
      SUCCESS: NotificationType.Success,
      WARNING: NotificationType.Warning,
      ERROR: NotificationType.Error
    }[type];
    await Haptics.notification({ type: notificationType });
  } catch {
    // Haptics are best-effort feedback and must not affect the operation.
  }
}

/** Tab and navigation confirmation. */
export function hapticLight() {
  void runImpact("LIGHT");
}

/** Pack toggles, steppers, and option changes. */
export function hapticSelection() {
  if (!canHaptic()) return;

  void (async () => {
    try {
      const { Haptics } = await loadHaptics();
      await Haptics.selectionStart();
      await Haptics.selectionChanged();
      await Haptics.selectionEnd();
    } catch {
      // Haptics are best-effort feedback and must not affect the operation.
    }
  })();
}

/** Successful save, create, or bulk pack operation. */
export function hapticSuccess() {
  void runNotification("SUCCESS");
}

/** Failed save or action. */
export function hapticError() {
  void runNotification("ERROR");
}
