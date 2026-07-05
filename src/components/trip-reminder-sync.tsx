"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import {
  readTripReminderPlansFromLocalStorage,
  reconcileTripReminders,
  registerTripReminderActionListener
} from "@/lib/trip-reminder";

type TripReminderSyncProps = {
  userId: string;
};

export function TripReminderSync({ userId }: TripReminderSyncProps) {
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    let removeNotificationListener: (() => void) | undefined;

    function syncReminders() {
      const plans = readTripReminderPlansFromLocalStorage(userId);
      void reconcileTripReminders(plans);
    }

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
      removeNotificationListener?.();
      window.removeEventListener("focus", syncReminders);
      document.removeEventListener("visibilitychange", syncWhenVisible);
    };
  }, [router, userId]);

  return null;
}
