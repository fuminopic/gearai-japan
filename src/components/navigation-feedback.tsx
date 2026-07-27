"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const NAVIGATION_SLOW_AFTER_MS = 5_000;

export function NavigationFeedback() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const slowNavigationTimerRef = useRef<number | null>(null);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [isSlowNavigation, setIsSlowNavigation] = useState(false);

  const clearNavigationFeedback = useCallback(() => {
    if (slowNavigationTimerRef.current !== null) {
      window.clearTimeout(slowNavigationTimerRef.current);
      slowNavigationTimerRef.current = null;
    }

    setPendingHref(null);
    setIsSlowNavigation(false);
  }, []);

  const startNavigationFeedback = useCallback((href: string) => {
    if (slowNavigationTimerRef.current !== null) {
      window.clearTimeout(slowNavigationTimerRef.current);
    }

    setPendingHref(href);
    setIsSlowNavigation(false);
    slowNavigationTimerRef.current = window.setTimeout(() => {
      slowNavigationTimerRef.current = null;
      setIsSlowNavigation(true);
    }, NAVIGATION_SLOW_AFTER_MS);
  }, []);

  useEffect(() => {
    clearNavigationFeedback();
  }, [clearNavigationFeedback, pathname, searchParams]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const link = target.closest("a[href]");

      if (!(link instanceof HTMLAnchorElement)) {
        return;
      }

      if (
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        link.target === "_blank" ||
        link.origin !== window.location.origin ||
        link.href === window.location.href
      ) {
        return;
      }

      startNavigationFeedback(`${link.pathname}${link.search}${link.hash}`);
    }

    document.addEventListener("click", handleClick, { capture: true });

    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
    };
  }, [startNavigationFeedback]);

  useEffect(() => clearNavigationFeedback, [clearNavigationFeedback]);

  if (!pendingHref) {
    return null;
  }

  if (isSlowNavigation) {
    return (
      <div
        role="status"
        className="fixed inset-x-3 top-[max(env(safe-area-inset-top),8px)] z-[80] mx-auto flex max-w-sm items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 text-xs font-semibold text-stone-700 shadow-lg"
      >
        <span>通信に時間がかかっています。</span>
        <button
          type="button"
          onClick={() => {
            startNavigationFeedback(pendingHref);
            router.push(pendingHref as Route);
          }}
          className="shrink-0 rounded-lg bg-forest-50 px-3 py-1.5 font-bold text-[#14724e] transition active:scale-[0.98]"
        >
          再試行
        </button>
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[80] h-1 overflow-hidden bg-forest-100">
      <div className="h-full w-1/2 animate-[navigation-feedback_0.9s_ease-in-out_infinite] rounded-r-full bg-forest-700" />
      <style>{`
        @keyframes navigation-feedback {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(220%);
          }
        }
      `}</style>
    </div>
  );
}
