import { Suspense } from "react";

import { AppNav } from "@/components/app-nav";
import { SplashScreen } from "@/components/splash-screen";
import { requireUser } from "@/lib/data/gear";
import { AppLoadingFallback } from "./loading";

export default function AppLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-32 text-ink">
      <SplashScreen />
      <AppNav />
      <main className="mx-auto max-w-5xl px-4 pb-32 pt-5 md:ml-24 md:px-6 md:pb-10 md:pt-8">
        <Suspense fallback={<AppLoadingFallback />}>
          <AuthGate>{children}</AuthGate>
        </Suspense>
      </main>
    </div>
  );
}

async function AuthGate({ children }: { children: React.ReactNode }) {
  await requireUser();

  return children;
}
