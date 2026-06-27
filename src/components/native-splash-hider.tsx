"use client";

import { useEffect } from "react";

/**
 * Hides the native (Capacitor) splash screen once the destination page has
 * actually finished loading — not merely first-painted. Hiding on first paint
 * revealed the route's `loading.tsx` skeleton (nav bars + a centred spinner),
 * which read as a broken "second splash". Waiting for the document `load`
 * event means the splash fades straight into real content instead.
 *
 * The native splash has a long safety duration (launchShowDuration), so it
 * stays up across the remote page load and the auth redirect chain. We dismiss
 * it here when content is ready; a web-side timeout is the secondary backstop.
 *
 * Safe on web and on older native binaries: if the plugin is unavailable the
 * dynamic import / call is swallowed and nothing happens.
 */
export function NativeSplashHider() {
  useEffect(() => {
    let cancelled = false;
    let safetyTimer: number | undefined;
    let onLoad: (() => void) | undefined;

    void (async () => {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (!Capacitor.isNativePlatform()) {
          return;
        }

        const { SplashScreen } = await import("@capacitor/splash-screen");

        const hide = () => {
          if (cancelled) {
            return;
          }
          cancelled = true;
          if (safetyTimer !== undefined) {
            window.clearTimeout(safetyTimer);
          }
          void SplashScreen.hide({ fadeOutDuration: 300 }).catch(() => undefined);
        };

        // Primary: hide when the page has fully loaded (real content present),
        // so the splash never reveals the loading skeleton underneath.
        if (document.readyState === "complete") {
          hide();
        } else {
          onLoad = hide;
          window.addEventListener("load", onLoad, { once: true });
        }

        // Backstop: never leave the splash stuck (e.g. a load event that never
        // fires). Generous so a slow network does not reveal a half-loaded page.
        safetyTimer = window.setTimeout(hide, 12000);
      } catch {
        // Plugin not present (web build or pre-plugin native binary) — no-op.
      }
    })();

    return () => {
      cancelled = true;
      if (safetyTimer !== undefined) {
        window.clearTimeout(safetyTimer);
      }
      if (onLoad) {
        window.removeEventListener("load", onLoad);
      }
    };
  }, []);

  return null;
}
