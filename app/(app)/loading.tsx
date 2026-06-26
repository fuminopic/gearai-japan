export default function AppLoading() {
  return <AppLoadingFallback />;
}

export function AppLoadingFallback() {
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
