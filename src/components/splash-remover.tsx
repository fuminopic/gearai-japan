"use client";

import { useEffect } from "react";

// Minimum time the splash stays up so it never just blinks.
const MIN_VISIBLE_MS = 700;
// Hard safety: never leave the splash stuck if `load` never fires.
const SAFETY_MS = 8000;

/**
 * Fades out and removes the server-rendered #app-splash overlay once the page
 * has finished loading (real content present), after a short minimum display.
 * The overlay itself is in the SSR HTML (see (app)/layout), so it is visible
 * from the very first paint with no JavaScript-mount delay.
 */
export function SplashRemover() {
  useEffect(() => {
    const el = document.getElementById("app-splash");
    if (!el) {
      return;
    }

    let done = false;
    const remove = () => {
      if (done) {
        return;
      }
      done = true;
      el.style.opacity = "0";
      window.setTimeout(() => el.remove(), 500);
    };

    const whenLoaded = () => {
      if (document.readyState === "complete") {
        remove();
      } else {
        window.addEventListener("load", remove, { once: true });
      }
    };

    const minTimer = window.setTimeout(whenLoaded, MIN_VISIBLE_MS);
    const safetyTimer = window.setTimeout(remove, SAFETY_MS);

    return () => {
      window.clearTimeout(minTimer);
      window.clearTimeout(safetyTimer);
      window.removeEventListener("load", remove);
    };
  }, []);

  return null;
}
