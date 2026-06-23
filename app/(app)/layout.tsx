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
  return <main className="min-h-[100dvh] bg-white" aria-hidden="true" />;
}
