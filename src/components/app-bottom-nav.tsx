"use client";

import { Backpack, ClipboardCheck, Home, UserRound } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

const bottomNavItems = [
  { href: "/dashboard", label: "ホーム", icon: Home },
  { href: "/gear", label: "装備", icon: Backpack },
  { href: "/plan" as Route, label: "計画", icon: ClipboardCheck },
  { href: "/profile", label: "マイページ", icon: UserRound }
] satisfies Array<{
  href: Route;
  label: string;
  icon: typeof Home;
}>;

export function AppBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-6 bottom-8 z-50 bg-white/25 backdrop-blur-[24px] border border-white/50 shadow-[0_20px_40px_rgba(0,0,0,0.1)] rounded-full px-6 py-2.5 flex justify-between items-center md:hidden">
      {bottomNavItems.map((item) => {
        const Icon = item.icon;
        const active = isActivePath(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            className={`flex touch-manipulation flex-col items-center transition-all duration-150 ease-out active:scale-95 ${
              active ? "scale-110 text-[#14724e]" : "text-gray-400"
            }`}
          >
            <Icon
              aria-hidden
              className={`h-5 w-5 stroke-[1.8] ${active ? "fill-[#14724e]" : ""}`}
            />
            <span className="mt-1 text-[10px] font-medium leading-none">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

function isActivePath(pathname: string, href: Route) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
