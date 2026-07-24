"use client";

import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

type NetworkInformationLike = {
  effectiveType?: string;
  saveData?: boolean;
};

type IdleWindow = Window & {
  cancelIdleCallback?: (id: number) => void;
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
};

type PrefetchTargets = {
  primary: Route;
  secondary?: Route;
};

// 常駐ナビの全リンクを同時に先読みすると、認証済みの動的 RSC を複数起動して
// 初期操作と競合する。現在の画面から次に進む可能性が高いものだけに絞る。
function getPrefetchTargets(pathname: string): PrefetchTargets {
  if (pathname.startsWith("/gear")) {
    return { primary: "/pack", secondary: "/gear/new" };
  }

  if (pathname.startsWith("/pack")) {
    return { primary: "/gear", secondary: "/plan" };
  }

  if (pathname.startsWith("/plan")) {
    return { primary: "/gear", secondary: "/dashboard" };
  }

  if (pathname.startsWith("/profile")) {
    return { primary: "/dashboard" };
  }

  return { primary: "/gear", secondary: "/plan" };
}

function getNetworkInformation() {
  return (navigator as Navigator & { connection?: NetworkInformationLike }).connection;
}

function scheduleWhenIdle(callback: () => void, timeout: number) {
  const browserWindow = window as IdleWindow;

  if (browserWindow.requestIdleCallback) {
    const id = browserWindow.requestIdleCallback(callback, { timeout });
    return () => browserWindow.cancelIdleCallback?.(id);
  }

  const timeoutId = window.setTimeout(callback, timeout);
  return () => window.clearTimeout(timeoutId);
}

export function AppRoutePrefetcher() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const connection = getNetworkInformation();

    // 省データ設定や 2G 相当では、操作に直接必要ない通信をしない。
    if (
      connection?.saveData ||
      connection?.effectiveType === "slow-2g" ||
      connection?.effectiveType === "2g"
    ) {
      return;
    }

    const { primary, secondary } = getPrefetchTargets(pathname);
    const cancelPrimary = scheduleWhenIdle(() => router.prefetch(primary), 600);
    const isSlowNetwork = connection?.effectiveType === "3g";
    let cancelSecondary: (() => void) | undefined;

    // 追加の先読みは初期描画と最初の操作を優先した後だけ実行する。
    const secondaryTimerId =
      secondary && !isSlowNetwork
        ? window.setTimeout(() => {
            cancelSecondary = scheduleWhenIdle(() => router.prefetch(secondary), 2_000);
          }, 1_500)
        : undefined;

    return () => {
      cancelPrimary();
      cancelSecondary?.();
      if (secondaryTimerId !== undefined) {
        window.clearTimeout(secondaryTimerId);
      }
    };
  }, [pathname, router]);

  return null;
}
