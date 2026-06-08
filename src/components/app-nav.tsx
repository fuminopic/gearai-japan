import { Backpack, ClipboardCheck, Home, UserRound } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { AppBottomNav } from "@/components/app-bottom-nav";
import { signOut } from "@/lib/actions/auth";

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
      <header className="sticky top-0 z-20 border-b border-stone-200/70 bg-trail-50/90 px-5 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/dashboard" className="leading-none text-ink">
            <span className="block text-lg font-semibold tracking-normal">山支度</span>
            <span className="block text-[10px] font-semibold text-forest-700">
              YAMAJITAKU
            </span>
          </Link>
          <form action={signOut}>
            <button className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-sm">
              ログアウト
            </button>
          </form>
        </div>
      </header>

      <AppBottomNav />

      <aside className="fixed left-0 top-0 hidden h-screen w-24 border-r border-stone-200 bg-white px-3 py-5 md:block">
        <Link href="/dashboard" className="mb-8 block text-center leading-none text-forest-700">
          <span className="block text-sm font-semibold text-ink">山支度</span>
          <span className="mt-1 block text-[9px] font-semibold">YAMAJITAKU</span>
        </Link>
        <div className="space-y-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
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
