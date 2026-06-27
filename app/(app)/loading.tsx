export default function AppLoading() {
  return <AppLoadingFallback />;
}

export function AppLoadingFallback() {
  // Subtle in-app loading indicator only — no brand logo here. The branded
  // splash is owned by the native splash screen at launch; showing the logo
  // again during in-app navigation (e.g. right after login) looked like a
  // second splash.
  return (
    <main
      className="flex min-h-[100dvh] items-center justify-center bg-[#FAFAF8]"
      aria-hidden="true"
    >
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#2D6A4F]/20 border-t-[#2D6A4F]" />
    </main>
  );
}
