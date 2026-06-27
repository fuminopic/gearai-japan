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
    // injected here. Detect the app by its custom user-agent instead — this is
    // present on every page (set via appendUserAgent). Web browsers keep it.
    if (
      typeof navigator !== "undefined" &&
      navigator.userAgent.includes("YamajitakuApp")
    ) {
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
