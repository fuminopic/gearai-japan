"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const prefetchRoutes = ["/dashboard", "/plan", "/gear", "/profile"] satisfies Route[];

export function AppRoutePrefetcher() {
  const router = useRouter();

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      for (const route of prefetchRoutes) {
        router.prefetch(route);
      }
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [router]);

  return null;
}
