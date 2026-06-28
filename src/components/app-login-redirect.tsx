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
    // Gate on the window.name marker — set exclusively by the new local-login
    // binary and surviving the cross-origin navigation. It may be either
    // "yamajitaku-native" or "yamajitaku-native-splashed", so match the prefix.
    // The old remote-only binary never sets it, so it is never redirected here.
    if (window.name.indexOf("yamajitaku-native") === 0) {
      window.location.replace("capacitor://localhost/?login=1");
    }
  }, []);

  return null;
}
