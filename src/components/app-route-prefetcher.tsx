"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const primaryPrefetchRoutes = ["/dashboard", "/plan", "/gear", "/profile"] satisfies Route[];
const secondaryPrefetchRoutes = ["/gear/new", "/ai", "/ai/history"] satisfies Route[];

export function AppRoutePrefetcher() {
  const router = useRouter();

  useEffect(() => {
    const primaryTimeoutId = window.setTimeout(() => {
      for (const route of primaryPrefetchRoutes) {
        router.prefetch(route);
      }
    }, 150);
    const secondaryTimeoutId = window.setTimeout(() => {
      for (const route of secondaryPrefetchRoutes) {
        router.prefetch(route);
      }
    }, 1200);

    return () => {
      window.clearTimeout(primaryTimeoutId);
      window.clearTimeout(secondaryTimeoutId);
    };
  }, [router]);

  return null;
}
