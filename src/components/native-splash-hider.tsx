"use client";

import { useEffect } from "react";

/**
 * Hides the native (Capacitor) splash screen once the web app has rendered its
 * first frame. The native splash is configured with launchAutoHide:false-style
 * behaviour (a long safety duration), so it stays up across the remote page
 * load and we dismiss it here only when there is real content to show — no
 * white webview, no separate loading page.
 *
 * Safe on web and on older native binaries: if the plugin is unavailable the
 * dynamic import / call is swallowed and nothing happens.
 */
export function NativeSplashHider() {
  useEffect(() => {
    let cancelled = false;

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
          void SplashScreen.hide({ fadeOutDuration: 250 }).catch(() => undefined);
        };

        // Wait two frames so the first paint has actually landed before fading.
        requestAnimationFrame(() => requestAnimationFrame(hide));
      } catch {
        // Plugin not present (web build or pre-plugin native binary) — no-op.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
