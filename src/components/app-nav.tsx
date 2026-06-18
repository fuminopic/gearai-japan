import { Backpack, ClipboardCheck, Home, UserRound } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { AppBottomNav } from "@/components/app-bottom-nav";
import { AppLogo } from "@/components/app-logo";
import { AppMenuDrawer } from "@/components/app-menu-drawer";
import { AppRoutePrefetcher } from "@/components/app-route-prefetcher";
import { NavigationFeedback } from "@/components/navigation-feedback";

const navItems = [
  { href: "/dashboard", label: "ホーム", icon: Home },
  { href: "/gear", label: "装備", icon: Backpack },
  { href: "/plan" as Route, label: "計画", icon: ClipboardCheck },
  { href: "/profile", label: "自分", icon: UserRound }
] satisfies Array<{
  href: Route;
  label: string;
  icon: typeof Home;
}>;

export function AppNav() {
  return (
    <>
      <NavigationFeedback />
      <AppRoutePrefetcher />

      <header className="sticky top-0 z-40 border-b border-gray-100/70 bg-[#FAFAFA]/90 px-4 pb-3 pt-[max(env(safe-area-inset-top),20px)] backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/dashboard" className="inline-flex items-center">
            <AppLogo className="h-12" />
          </Link>
          <AppMenuDrawer />
        </div>
      </header>

      <AppBottomNav />

      <aside className="fixed left-0 top-0 hidden h-screen w-24 border-r border-stone-200 bg-white/90 px-3 py-5 backdrop-blur md:block">
        <Link href="/dashboard" className="mb-8 flex justify-center">
          <AppLogo className="h-auto w-full" />
        </Link>
        <div className="space-y-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                className="flex flex-col items-center gap-2 rounded-lg px-2 py-3 text-xs font-medium text-stone-600 transition hover:bg-forest-50 hover:text-forest-700"
              >
                <Icon aria-hidden className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </aside>
    </>
  );
}
