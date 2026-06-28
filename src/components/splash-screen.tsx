"use client";

import { useEffect, useRef, useState } from "react";

const SPLASH_VISIBLE_MS = 1500;
const SPLASH_FADE_MS = 500;

type SplashPhase = "visible" | "leaving" | "hidden";

export function SplashScreen() {
  const imageRef = useRef<HTMLImageElement>(null);
  const [phase, setPhase] = useState<SplashPhase>("visible");
  const [isArtworkReady, setIsArtworkReady] = useState(false);
  const [isNativeApp, setIsNativeApp] = useState(false);

  useEffect(() => {
    // In the native app, the bundled local login page already shows the splash
    // during the post-login handoff. Showing this web splash again would be a
    // duplicate ("splash → load → splash"), so skip it on native.
    //
    // The remote app is loaded via Capacitor allowNavigation (NOT as the
    // Capacitor server), so window.Capacitor / isNativePlatform() is NOT
    // injected here. Detect the app two ways, either is sufficient:
    //  1. window.name — the local login page sets "yamajitaku-native", and this
    //     survives the cross-origin navigation into the remote app (robust).
    //  2. the custom user-agent appended by the app (fallback).
    // Skip this remote splash only when the bundled local login page already
    // showed its own splash for this login (it marks window.name "-splashed" in
    // the handoff). OAuth logins return via the native deep link without that
    // local splash, so window.name stays "yamajitaku-native" and this remote
    // splash still shows. Old/web builds (no marker) also keep the splash.
    if (typeof window !== "undefined" && window.name === "yamajitaku-native-splashed") {
      setIsNativeApp(true);
    }
  }, []);

  useEffect(() => {

    if (imageRef.current?.complete) {
      setIsArtworkReady(true);
    }
  }, []);

  useEffect(() => {
    if (phase === "hidden" || !isArtworkReady) {
      return;
    }

    const leaveTimer = window.setTimeout(() => {
      setPhase("leaving");
    }, SPLASH_VISIBLE_MS);

    const hideTimer = window.setTimeout(() => {
      setPhase("hidden");
    }, SPLASH_VISIBLE_MS + SPLASH_FADE_MS);

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(hideTimer);
    };
  }, [isArtworkReady, phase]);

  if (phase === "hidden" || isNativeApp) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[120] flex items-center justify-center bg-[#FAFAF8] transition-opacity duration-500 ease-out ${
        phase === "leaving" ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center">
        <img
          ref={imageRef}
          src="/yamajitaku-splash-logo.png"
          alt=""
          className="h-[168px] w-[168px] object-contain sm:h-48 sm:w-48"
          decoding="async"
          fetchPriority="high"
          onError={() => setIsArtworkReady(true)}
          onLoad={() => setIsArtworkReady(true)}
        />
      </div>
    </div>
  );
}
