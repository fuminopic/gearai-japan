"use client";

import { useEffect } from "react";

import { identifyAnalyticsUser } from "@/lib/analytics";

export function AnalyticsIdentity({ userId }: { userId: string }) {
  useEffect(() => {
    identifyAnalyticsUser(userId);
  }, [userId]);

  return null;
}
