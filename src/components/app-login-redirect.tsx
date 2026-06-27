"use client";

import { useEffect } from "react";

/**
 * Inside the native app there is a single login experience: the bundled local
 * login page (capacitor-www/index.html). The remote app has its own /login
 * route which is reached on sign-out or session expiry — showing it would be a
 * second, different login UI whose session is stored remotely (so the local
 * boot page can't see it, forcing a re-login on next launch).
 *
 * So when /login (or /signup) is opened inside the app, bounce straight back to
 * the local login page. On the web (no app markers) this does nothing.
 */
export function AppLoginRedirect() {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    // Gate on window.name only — it is set exclusively by the new local-login
    // binary and survives the cross-origin navigation. The old remote-only
    // binary shares the user-agent but has no local page to return to, so we
    // must never redirect it here.
    if (window.name === "yamajitaku-native") {
      window.location.replace("capacitor://localhost/?login=1");
    }
  }, []);

  return null;
}
