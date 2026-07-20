"use client";

import { Backpack, ClipboardCheck, Home, UserRound } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { buildGearHref, getCurrentPlanReturnTo } from "@/lib/plan-return-to";

const bottomNavItems = [
  { href: "/dashboard", label: "ホーム", icon: Home },
  { href: "/gear", label: "ギア", icon: Backpack },
  { href: "/plan" as Route, label: "計画", icon: ClipboardCheck },
  { href: "/profile", label: "マイページ", icon: UserRound }
] satisfies Array<{
  href: Route;
  label: string;
  icon: typeof Home;
}>;

export function AppBottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const returnTo = getCurrentPlanReturnTo(pathname, searchParams.toString());
  const activeIndex = bottomNavItems.findIndex((item) =>
    isActivePath(pathname, item.href)
  );

  // 挂载后才允许过渡:首屏药丸直接出现在当前位置,不从左滑入
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className="fixed inset-x-6 bottom-8 z-50 overflow-hidden rounded-full border border-white/40 px-2 py-2 shadow-[0_20px_40px_rgba(0,0,0,0.1)] backdrop-blur-2xl backdrop-saturate-150 md:hidden">
      {/* 活跃图标的渐变绿描边定义 */}
      <svg aria-hidden width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="navActiveGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1F7950" />
            <stop offset="100%" stopColor="#81AB44" />
          </linearGradient>
        </defs>
      </svg>

      {/* 玻璃面反光(上亮下透) */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/25 via-transparent to-transparent"
      />

      <div className="relative flex items-center">
        {/* 滑动玻璃药丸(活跃按钮的玻璃框) */}
        {activeIndex >= 0 ? (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 rounded-full border border-white/70 bg-gradient-to-b from-white/65 via-white/30 to-white/15 shadow-[inset_0_1px_2px_rgba(255,255,255,0.85),0_6px_16px_rgba(0,0,0,0.12)] backdrop-blur-md"
            style={{
              width: `${100 / bottomNavItems.length}%`,
              transform: `translateX(${activeIndex * 100}%)`,
              transition: mounted
                ? "transform 0.32s cubic-bezier(0.34, 1.6, 0.64, 1)"
                : "none"
            }}
          />
        ) : null}

        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item.href);
          const href = item.href === "/gear" ? buildGearHref("/gear", returnTo) : item.href;

          return (
            <Link
              key={item.href}
              href={href}
              prefetch
              className={`relative z-10 flex flex-1 touch-manipulation flex-col items-center py-1.5 transition-colors duration-200 active:scale-95 ${
                active ? "text-[#14724e]" : "text-gray-400"
              }`}
            >
              {item.href === "/gear" ? (
                <span
                  aria-hidden
                  className="h-5 w-5"
                  style={{
                    WebkitMaskImage: "url(/gear-tab.png)",
                    maskImage: "url(/gear-tab.png)",
                    WebkitMaskSize: "contain",
                    maskSize: "contain",
                    WebkitMaskRepeat: "no-repeat",
                    maskRepeat: "no-repeat",
                    WebkitMaskPosition: "center",
                    maskPosition: "center",
                    background: active
                      ? "linear-gradient(135deg, #1F7950, #81AB44)"
                      : "#9ca3af"
                  }}
                />
              ) : (
                <Icon
                  aria-hidden
                  className="h-5 w-5 stroke-[1.8]"
                  stroke={active ? "url(#navActiveGrad)" : "currentColor"}
                />
              )}
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
