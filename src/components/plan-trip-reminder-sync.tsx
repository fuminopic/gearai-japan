"use client";

import { useEffect } from "react";

import {
  readTripReminderPlansFromLocalStorage,
  reconcileTripReminders,
  requestReminderPermission
} from "@/lib/trip-reminder";

type PlanTripReminderSyncProps = {
  userId: string;
};

export function PlanTripReminderSync({ userId }: PlanTripReminderSyncProps) {
  useEffect(() => {
    let isMounted = true;

    void requestReminderPermission().then(() => {
      if (!isMounted) {
        return;
      }

      const plans = readTripReminderPlansFromLocalStorage(userId);
      void reconcileTripReminders(plans);
    });

    return () => {
      isMounted = false;
    };
  }, [userId]);

  return null;
}
