"use client";

import {
  Backpack,
  ClipboardCheck,
  FileText,
  HelpCircle,
  Home,
  LogOut,
  Menu,
  ShieldCheck,
  UserRound,
  X
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { AppLogo } from "@/components/app-logo";
import { signOut } from "@/lib/actions/auth";

const primaryItems = [
  { href: "/dashboard", label: "ホーム", icon: Home },
  { href: "/plan" as Route, label: "山行計画", icon: ClipboardCheck },
  { href: "/gear", label: "マイ装備", icon: Backpack },
  { href: "/profile", label: "マイページ", icon: UserRound }
] satisfies Array<{
  href: Route;
  label: string;
  icon: typeof Home;
}>;

const supportItems = [
  { href: "/help", label: "ヘルプ", icon: HelpCircle },
  { href: "/terms", label: "利用規約", icon: FileText },
  { href: "/privacy", label: "プライバシーポリシー", icon: ShieldCheck }
] satisfies Array<{
  href: Route;
  label: string;
  icon: typeof Home;
}>;

type AppMenuDrawerProps = {
  userEmail?: string | null;
  buttonClassName?: string;
};

export function AppMenuDrawer({ userEmail, buttonClassName }: AppMenuDrawerProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [shouldRenderDrawer, setShouldRenderDrawer] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isOpen) {
      setShouldRenderDrawer(true);
      return;
    }

    const timer = window.setTimeout(() => {
      setShouldRenderDrawer(false);
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isOpen]);

  const drawerLayer = (
    <>
      <div
        className={`fixed inset-0 z-[9998] bg-black/35 transition-opacity duration-200 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden="true"
        onClick={() => setIsOpen(false)}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="アプリメニュー"
        className={`fixed inset-y-0 right-0 z-[9999] flex w-[86vw] max-w-[360px] flex-col bg-[#FAFAFA] px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-[max(env(safe-area-inset-top),20px)] shadow-[-20px_0_50px_rgba(0,0,0,0.16)] transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <AppLogo className="h-10" />
          <button
            type="button"
            aria-label="メニューを閉じる"
            onClick={() => setIsOpen(false)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-stone-700 shadow-sm transition active:scale-95"
          >
            <X aria-hidden className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs font-bold text-[#14724e]">YAMAJITAKU</p>
          <p className="mt-1 truncate text-sm font-semibold text-stone-800">
            {userEmail ?? "ログイン中"}
          </p>
        </div>

        <nav className="mt-5 flex-1 space-y-6 overflow-y-auto">
          <MenuSection title="メイン">
            {primaryItems.map((item) => (
              <MenuLink
                key={item.href}
                item={item}
                active={isActivePath(pathname, item.href)}
              />
            ))}
          </MenuSection>

          <MenuSection title="サポート">
            {supportItems.map((item) => (
              <MenuLink
                key={item.href}
                item={item}
                active={isActivePath(pathname, item.href)}
              />
            ))}
          </MenuSection>
        </nav>

        <form
          action={signOut}
          className="mt-5"
          onSubmit={() => {
            // 退登时清掉 service worker 缓存的首页,避免下次串到上个账号/过期态
            try {
              navigator.serviceWorker?.controller?.postMessage("yj-clear-pages");
            } catch {
              /* noop */
            }
          }}
        >
          <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-stone-700 shadow-sm transition active:scale-95">
            <LogOut aria-hidden className="h-4 w-4" />
            ログアウト
          </button>
        </form>

        <p className="mt-4 text-center text-[11px] font-medium text-stone-400">
          YAMAJITAKU v0.1
        </p>
      </aside>
    </>
  );

  return (
    <>
      <button
        type="button"
        aria-label="メニュー"
        aria-expanded={isOpen}
        onClick={() => {
          setShouldRenderDrawer(true);
          window.requestAnimationFrame(() => setIsOpen(true));
        }}
        className={
          buttonClassName ??
          "-mr-2 inline-flex h-10 w-10 items-center justify-center rounded-xl text-gray-700 transition active:scale-95"
        }
      >
        <Menu aria-hidden className="h-6 w-6" />
      </button>
      {isMounted && shouldRenderDrawer
        ? createPortal(drawerLayer, document.body)
        : null}
    </>
  );
}

function MenuSection({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-2 px-1 text-[11px] font-bold tracking-[0.08em] text-stone-400">
        {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function MenuLink({
  item,
  active
}: {
  item: {
    href: Route;
    label: string;
    icon: typeof Home;
  };
  active: boolean;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      prefetch
      className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition active:scale-[0.98] ${
        active
          ? "bg-[#14724e] text-white"
          : "bg-white text-stone-800 shadow-sm hover:bg-forest-50"
      }`}
    >
      <Icon aria-hidden className="h-5 w-5 stroke-[1.8]" />
      <span>{item.label}</span>
    </Link>
  );
}

function isActivePath(pathname: string, href: Route) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
