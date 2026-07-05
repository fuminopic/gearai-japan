"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import {
  readTripReminderPlansFromLocalStorage,
  reconcileTripReminders,
  registerTripReminderActionListener,
  requestReminderPermission
} from "@/lib/trip-reminder";

type TripReminderSyncProps = {
  userId: string;
};

const TRIP_REMINDER_PERMISSION_DELAY_MS = 1000;

export function TripReminderSync({ userId }: TripReminderSyncProps) {
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    let removeNotificationListener: (() => void) | undefined;
    const permissionTimer = window.setTimeout(() => {
      void requestReminderPermission({ diagnostics: true }).then(() => {
        if (isMounted) {
          syncReminders();
        }
      });
    }, TRIP_REMINDER_PERMISSION_DELAY_MS);

    function syncReminders() {
      const plans = readTripReminderPlansFromLocalStorage(userId);
      void reconcileTripReminders(plans);
    }

    logNativeTripReminderMount();

    void registerTripReminderActionListener((planId) => {
      router.push(`/plan?id=${encodeURIComponent(planId)}&focus=checklist`);
    }).then((cleanup) => {
      if (isMounted) {
        removeNotificationListener = cleanup;
        return;
      }

      cleanup();
    });

    syncReminders();

    function syncWhenVisible() {
      if (document.visibilityState === "visible") {
        syncReminders();
      }
    }

    window.addEventListener("focus", syncReminders);
    document.addEventListener("visibilitychange", syncWhenVisible);

    return () => {
      isMounted = false;
      window.clearTimeout(permissionTimer);
      removeNotificationListener?.();
      window.removeEventListener("focus", syncReminders);
      document.removeEventListener("visibilitychange", syncWhenVisible);
    };
  }, [router, userId]);

  return null;
}

function logNativeTripReminderMount() {
  void import("@capacitor/core")
    .then(({ Capacitor }) => {
      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios") {
        console.debug("[TripReminderSync]", "component mounted");
      }
    })
    .catch(() => {
      // Web and older shells should stay silent and safe.
    });
}
