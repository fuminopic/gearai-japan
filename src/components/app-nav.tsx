import { Backpack, ClipboardCheck, Home, UserRound } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { AppBottomNav } from "@/components/app-bottom-nav";
import { HideOnBrandShell } from "@/components/app-chrome";
import { AppLogo } from "@/components/app-logo";
import { AppMenuDrawer } from "@/components/app-menu-drawer";
import { AppRoutePrefetcher } from "@/components/app-route-prefetcher";
import { NavigationFeedback } from "@/components/navigation-feedback";
import { PlanAwareGearLink } from "@/components/plan-aware-gear-link";

const navItems = [
  { href: "/dashboard", label: "ホーム", icon: Home },
  { href: "/gear", label: "ギア", icon: Backpack },
  { href: "/plan" as Route, label: "計画", icon: ClipboardCheck },
  { href: "/profile", label: "マイページ", icon: UserRound },
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

      {/* ホーム/マイギアは自前の緑バンドを持つので、この白ヘッダーは出さない。
          遷移中も含めて確実に隠すため、CSS ではなくパス名で判定する。 */}
      <HideOnBrandShell>
        <header className="sticky top-0 z-40 border-b border-gray-100/70 bg-[#FAFAFA]/90 px-4 pb-3 pt-[max(env(safe-area-inset-top),20px)] backdrop-blur-md">
          <div className="mx-auto flex max-w-5xl items-center justify-between">
            <Link href="/dashboard" className="inline-flex items-center">
              <AppLogo className="h-12" />
            </Link>
            <AppMenuDrawer />
          </div>
        </header>
      </HideOnBrandShell>

      <AppBottomNav />

      <HideOnBrandShell>
        <aside className="fixed left-0 top-0 hidden h-screen w-24 border-r border-stone-200 bg-white/90 px-3 py-5 backdrop-blur md:block">
          <Link href="/dashboard" className="mb-8 flex justify-center">
            <AppLogo className="h-auto w-full" />
          </Link>
          <div className="space-y-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const content = (
                <>
                  <Icon aria-hidden className="h-5 w-5" />
                  {item.label}
                </>
              );

              if (item.href === "/gear") {
                return (
                  <PlanAwareGearLink
                    key={item.href}
                    className="flex flex-col items-center gap-2 rounded-lg px-2 py-3 text-xs font-medium text-stone-600 transition hover:bg-forest-50 hover:text-forest-700"
                  >
                    {content}
                  </PlanAwareGearLink>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  className="flex flex-col items-center gap-2 rounded-lg px-2 py-3 text-xs font-medium text-stone-600 transition hover:bg-forest-50 hover:text-forest-700"
                >
                  {content}
                </Link>
              );
            })}
          </div>
        </aside>
      </HideOnBrandShell>
    </>
  );
}
