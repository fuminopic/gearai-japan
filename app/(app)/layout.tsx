import { Suspense } from "react";

import Link from "next/link";

import { AnalyticsIdentity } from "@/components/analytics-identity";
import { AppNav } from "@/components/app-nav";
import { AuthValidationError, requireUser } from "@/lib/data/gear";

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
  let userId: string;

  try {
    const { user } = await requireUser();
    userId = user.id;
  } catch (caught) {
    if (caught instanceof AuthValidationError) {
      return <RecoverableAuthError message={caught.message} />;
    }

    throw caught;
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-32 text-ink">
      {/* No remote splash here: the bundled local login page owns the single
          splash for the app. Rendering one here too produced the recurring
          "splash → blank → splash" double. Web simply loads straight in. */}
      <AnalyticsIdentity userId={userId} />
      <AppNav />
      <main className="mx-auto max-w-5xl px-4 pb-32 pt-5 md:ml-24 md:px-6 md:pb-10 md:pt-8">
        {children}
      </main>
    </div>
  );
}

function RecoverableAuthError({ message }: { message: string }) {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[#FAFAF8] px-5">
      <section className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-sm">
        <p className="text-sm font-bold text-[#14724e]">通信エラー</p>
        <h1 className="mt-2 text-2xl font-bold tracking-normal text-ink">
          ログイン状態を確認できませんでした
        </h1>
        <p className="mt-3 text-sm font-semibold leading-relaxed text-stone-600">
          一時的な通信エラーの可能性があります。時間をおいて再度お試しください。
        </p>
        <p className="mt-3 rounded-xl bg-stone-50 px-3 py-2 text-xs font-medium leading-relaxed text-stone-500">
          {message}
        </p>
        <div className="mt-5 grid gap-3">
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-[#14724e] px-4 text-sm font-bold text-white transition active:scale-[0.98]"
          >
            再試行
          </Link>
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-200 px-4 text-sm font-bold text-stone-700 transition active:scale-[0.98]"
          >
            ログイン画面へ
          </Link>
        </div>
      </section>
    </main>
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
