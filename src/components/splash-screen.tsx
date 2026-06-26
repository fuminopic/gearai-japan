"use client";

import { useEffect, useRef, useState } from "react";

const SPLASH_VISIBLE_MS = 1500;
const SPLASH_FADE_MS = 500;
const SPLASH_SESSION_KEY = "yamajitaku:splash-shown";

type SplashPhase = "visible" | "leaving" | "hidden";

export function SplashScreen() {
  const imageRef = useRef<HTMLImageElement>(null);
  const [phase, setPhase] = useState<SplashPhase>("visible");
  const [isArtworkReady, setIsArtworkReady] = useState(false);

  useEffect(() => {
    if (window.sessionStorage.getItem(SPLASH_SESSION_KEY) === "1") {
      setPhase("hidden");
      return;
    }

    if (imageRef.current?.complete) {
      setIsArtworkReady(true);
    }
  }, []);

  useEffect(() => {
    if (phase === "hidden" || !isArtworkReady) {
      return;
    }

    const leaveTimer = window.setTimeout(() => {
      window.sessionStorage.setItem(SPLASH_SESSION_KEY, "1");
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

  if (phase === "hidden") {
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
          src="/yamajitaku-icon.png"
          alt=""
          className="h-28 w-28 object-contain sm:h-32 sm:w-32"
          decoding="async"
          fetchPriority="high"
          onError={() => setIsArtworkReady(true)}
          onLoad={() => setIsArtworkReady(true)}
        />
        <div className="mt-5 text-3xl font-light tracking-[0.18em] text-[#2D6A4F]">
          山支度
        </div>
      </div>
    </div>
  );
}
