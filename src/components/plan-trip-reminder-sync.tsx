"use client";

import { useEffect } from "react";

import {
  requestReminderPermission,
  scheduleTripReminder
} from "@/lib/trip-reminder";

type PlanTripReminderSyncProps = {
  userId: string;
  planId: string | null;
  plannedDate: string | null;
  planTitle?: string | null;
};

export function PlanTripReminderSync({
  userId,
  planId,
  plannedDate,
  planTitle
}: PlanTripReminderSyncProps) {
  useEffect(() => {
    let isMounted = true;

    if (!userId || !planId) {
      return () => {
        isMounted = false;
      };
    }

    void requestReminderPermission().then(() => {
      if (!isMounted) {
        return;
      }

      if (plannedDate) {
        void scheduleTripReminder(planId, plannedDate);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [planId, planTitle, plannedDate, userId]);

  return null;
}
