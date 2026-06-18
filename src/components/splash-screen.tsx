"use client";

import { useEffect, useRef, useState } from "react";

const SPLASH_STORAGE_KEY = "yamajitaku:splash-seen:v2";
const SPLASH_VISIBLE_MS = 1000;
const SPLASH_FADE_MS = 260;

type SplashPhase = "visible" | "leaving" | "hidden";

export function SplashScreen() {
  const imageRef = useRef<HTMLImageElement>(null);
  const [phase, setPhase] = useState<SplashPhase>("visible");
  const [isArtworkReady, setIsArtworkReady] = useState(false);

  useEffect(() => {
    if (window.sessionStorage.getItem(SPLASH_STORAGE_KEY) === "true") {
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

    window.sessionStorage.setItem(SPLASH_STORAGE_KEY, "true");

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

  if (phase === "hidden") {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[120] bg-white transition-opacity duration-[260ms] ease-out ${
        phase === "leaving" ? "opacity-0" : "opacity-100"
      }`}
    >
      <img
        ref={imageRef}
        src="/splash-screen.png"
        alt=""
        className="h-full w-full object-cover"
        decoding="async"
        fetchPriority="high"
        onError={() => setIsArtworkReady(true)}
        onLoad={() => setIsArtworkReady(true)}
      />
    </div>
  );
}
