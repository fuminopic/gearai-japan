"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { registerTripReminderActionListener } from "@/lib/trip-reminder";

type TripReminderSyncProps = {
  userId: string;
};

export function TripReminderSync({ userId }: TripReminderSyncProps) {
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    let removeNotificationListener: (() => void) | undefined;

    void registerTripReminderActionListener((planId) => {
      router.push(`/plan?id=${encodeURIComponent(planId)}&focus=checklist`);
    }).then((cleanup) => {
      if (isMounted) {
        removeNotificationListener = cleanup;
        return;
      }

      cleanup();
    });

    return () => {
      isMounted = false;
      removeNotificationListener?.();
    };
  }, [router, userId]);

  return null;
}
