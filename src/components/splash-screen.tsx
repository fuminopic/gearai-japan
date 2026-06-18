"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const SPLASH_STORAGE_KEY = "yamajitaku:splash-seen";
const SPLASH_VISIBLE_MS = 1000;
const SPLASH_FADE_MS = 260;

export function SplashScreen() {
  const [phase, setPhase] = useState<"hidden" | "visible" | "leaving">(
    "hidden"
  );

  useEffect(() => {
    if (window.sessionStorage.getItem(SPLASH_STORAGE_KEY) === "true") {
      return;
    }

    window.sessionStorage.setItem(SPLASH_STORAGE_KEY, "true");
    setPhase("visible");

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
  }, []);

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
      <Image
        src="/splash-screen.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
    </div>
  );
}
