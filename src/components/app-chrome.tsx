"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// 自前の緑バンドを持つ画面。共通の白ヘッダーはここでは出さない。
//
// 以前は各ページの中で `body:has(main.home-redesign)` という CSS で隠して
// いたが、遷移中は対象の <main> がまだ DOM にないためセレクタが外れ、
// 白ヘッダーが一瞬だけ戻っていた(ローディングのスピナーと一緒に見えて
// いたのがこれ)。パス名で判定すれば、遷移が始まった時点で消える。
// 逆に「白ヘッダーのまま残す」方を列挙する。タブも二次画面も緑バンドを
// 自前で持つようになったので、既定をバンド側にした方が、これから増える
// 画面が黙って揃う。ここに並ぶのは入口の無い旧AI・管理画面とヘルプだけ。
const LEGACY_HEADER_ROUTE_PREFIXES = ["/ai", "/admin", "/help"];

export function isBrandShellPath(pathname: string) {
  return !LEGACY_HEADER_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
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
