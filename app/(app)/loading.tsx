export default function AppLoading() {
  return <AppLoadingFallback />;
}

export function AppLoadingFallback() {
  return <main className="min-h-[100dvh] bg-white" aria-hidden="true" />;
}
