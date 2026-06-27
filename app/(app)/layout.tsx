import { Suspense } from "react";

import { AppNav } from "@/components/app-nav";
import { SplashRemover } from "@/components/splash-remover";
import { requireUser } from "@/lib/data/gear";

export default function AppLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<AppAuthLoading />}>
      <AuthGate>{children}</AuthGate>
    </Suspense>
  );
}

async function AuthGate({ children }: { children: React.ReactNode }) {
  await requireUser();

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-32 text-ink">
      {/* Server-rendered splash: present in the initial HTML so it shows the
          instant the page paints (no JS-mount delay). Covers the post-login
          handoff load and the dashboard data load; SplashRemover fades it out
          once content is ready. */}
      <div
        id="app-splash"
        aria-hidden="true"
        className="fixed inset-0 z-[200] flex items-center justify-center bg-[#FAFAF8] transition-opacity duration-500"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/yamajitaku-splash-logo.png"
          alt=""
          className="h-[168px] w-[168px] object-contain"
        />
      </div>
      <SplashRemover />
      <AppNav />
      <main className="mx-auto max-w-5xl px-4 pb-32 pt-5 md:ml-24 md:px-6 md:pb-10 md:pt-8">
        {children}
      </main>
    </div>
  );
}

function AppAuthLoading() {
  // Subtle spinner only — the branded splash is owned by the native splash
  // screen at launch, so no logo here (avoids a second splash-like screen).
  return (
    <main
      className="flex min-h-[100dvh] items-center justify-center bg-[#FAFAF8]"
      aria-hidden="true"
    >
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#2D6A4F]/20 border-t-[#2D6A4F]" />
    </main>
  );
}
