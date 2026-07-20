"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// 自前の緑バンドを持つ画面。共通の白ヘッダーはここでは出さない。
//
// 以前は各ページの中で `body:has(main.home-redesign)` という CSS で隠して
// いたが、遷移中は対象の <main> がまだ DOM にないためセレクタが外れ、
// 白ヘッダーが一瞬だけ戻っていた(ローディングのスピナーと一緒に見えて
// いたのがこれ)。パス名で判定すれば、遷移が始まった時点で消える。
const BRAND_SHELL_ROUTES = new Set<string>([
  "/dashboard",
  "/gear",
  "/plan",
  "/profile",
  "/pack"
]);

export function isBrandShellPath(pathname: string) {
  return BRAND_SHELL_ROUTES.has(pathname);
}

export function useIsBrandShellRoute() {
  return isBrandShellPath(usePathname());
}

/** 緑バンドを持つ画面では描画しない。 */
export function HideOnBrandShell({ children }: { children: ReactNode }) {
  const isBrandShell = useIsBrandShellRoute();

  if (isBrandShell) {
    return null;
  }

  return <>{children}</>;
}
