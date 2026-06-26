import { Suspense } from "react";

import { AppNav } from "@/components/app-nav";
import { SplashScreen } from "@/components/splash-screen";
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
      <SplashScreen />
      <AppNav />
      <main className="mx-auto max-w-5xl px-4 pb-32 pt-5 md:ml-24 md:px-6 md:pb-10 md:pt-8">
        {children}
      </main>
    </div>
  );
}

function AppAuthLoading() {
  return (
    <main
      className="flex min-h-[100dvh] items-center justify-center bg-[#FAFAF8]"
      aria-hidden="true"
    >
      <div className="flex flex-col items-center">
        <img
          src="/yamajitaku-icon.png"
          alt=""
          className="h-24 w-24 object-contain"
        />
        <div className="mt-5 h-7 w-7 animate-spin rounded-full border-2 border-[#2D6A4F]/20 border-t-[#2D6A4F]" />
      </div>
    </main>
  );
}
