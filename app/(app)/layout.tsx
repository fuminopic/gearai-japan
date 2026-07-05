import { Suspense } from "react";

import { AppNav } from "@/components/app-nav";
import { TripReminderSync } from "@/components/trip-reminder-sync";
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
  const { user } = await requireUser();

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-32 text-ink">
      {/* No remote splash here: the bundled local login page owns the single
          splash for the app. Rendering one here too produced the recurring
          "splash → blank → splash" double. Web simply loads straight in. */}
      <TripReminderSync userId={user.id} />
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
