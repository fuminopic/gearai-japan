import { LoadingBlock } from "@/components/ui/loading-block";

export default function AppLoading() {
  return <AppLoadingFallback />;
}

export function AppLoadingFallback() {
  // Subtle in-app loading indicator only — no brand logo here. The branded
  // splash is owned by the native splash screen at launch; showing the logo
  // again during in-app navigation (e.g. right after login) looked like a
  // second splash.
  return <LoadingBlock aria-hidden="true" />;
}
