"use client";

import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import { useState } from "react";

type SocialAuthButtonsProps = {
  appleHref: string;
  googleHref: string;
  variant: "dark" | "light";
  isIosApp?: boolean;
};

export function SocialAuthButtons({
  appleHref,
  googleHref,
  variant,
  isIosApp
}: SocialAuthButtonsProps) {
  const [pendingProvider, setPendingProvider] = useState<"apple" | "google" | null>(null);
  const buttonClass =
    variant === "dark"
      ? "flex h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-white/55 bg-black/20 px-3 text-[12px] font-semibold text-white backdrop-blur-sm transition hover:bg-white/10"
      : "flex h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-stone-200 bg-white px-3 text-[12px] font-semibold text-stone-800 shadow-sm transition hover:bg-stone-50";

  async function openOAuth(provider: "apple" | "google", url: string) {
    if (pendingProvider) {
      return;
    }

    setPendingProvider(provider);

    if (isIosApp && Capacitor.isNativePlatform()) {
      try {
        await Browser.close().catch(() => undefined);
        await Browser.open({
          url: new URL(url, window.location.origin).toString(),
          presentationStyle: "fullscreen",
          toolbarColor: "#14724e"
        });
      } finally {
        window.setTimeout(() => setPendingProvider(null), 900);
      }
      return;
    }

    window.location.href = url;
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        className={buttonClass}
        disabled={Boolean(pendingProvider)}
        onClick={() => void openOAuth("apple", appleHref)}
      >
        <span className="text-base" aria-hidden="true">
          
        </span>
        Appleで続ける
      </button>
      <button
        type="button"
        className={buttonClass}
        disabled={Boolean(pendingProvider)}
        onClick={() => void openOAuth("google", googleHref)}
      >
        <span
          className="grid h-4 w-4 place-items-center rounded-full bg-white text-[11px] font-bold text-[#4285f4]"
          aria-hidden="true"
        >
          G
        </span>
        Googleで続ける
      </button>
    </div>
  );
}
