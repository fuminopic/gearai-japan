"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const primaryPrefetchRoutes = ["/dashboard", "/plan", "/gear", "/profile"] satisfies Route[];
// メニューから辿れない /ai は先読みしない。
const secondaryPrefetchRoutes = ["/gear/new"] satisfies Route[];

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
