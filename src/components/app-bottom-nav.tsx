"use client";

import { Backpack, ClipboardCheck, Home, UserRound } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

const bottomNavItems = [
  { href: "/dashboard", label: "ホーム", icon: Home },
  { href: "/gear", label: "装備", icon: Backpack },
  { href: "/ai", label: "計画", icon: ClipboardCheck },
  { href: "/profile", label: "自分", icon: UserRound }
] satisfies Array<{
  href: Route;
  label: string;
  icon: typeof Home;
}>;

export function AppBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-100 bg-white/95 px-8 pb-6 pt-4 shadow-[0_-8px_28px_rgba(23,26,23,0.06)] backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-[390px] grid-cols-4">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-2 text-base font-bold ${
                active ? "text-forest-700" : "text-ink"
              }`}
            >
              <Icon
                aria-hidden
                className={`h-7 w-7 stroke-[1.8] ${active ? "fill-forest-700" : ""}`}
              />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function isActivePath(pathname: string, href: Route) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
