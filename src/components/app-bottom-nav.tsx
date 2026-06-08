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
    <nav className="fixed inset-x-6 bottom-8 z-50 rounded-full border border-white/40 bg-white/85 px-6 py-2.5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-md md:hidden">
      <div className="mx-auto flex max-w-[390px] items-center justify-between">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center ${
                active ? "text-[#3A5A40]" : "text-gray-400"
              }`}
            >
              <Icon
                aria-hidden
                className={`h-5 w-5 stroke-[1.8] ${active ? "fill-[#3A5A40]" : ""}`}
              />
              <span className="mt-1 text-[10px] font-medium leading-none">
                {item.label}
              </span>
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
