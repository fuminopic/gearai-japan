import { LoadingBlock } from "@/components/ui/loading-block";

export default function RootLoading() {
  return (
    <LoadingBlock
      aria-hidden="true"
      className="flex min-h-[100dvh] items-center justify-center bg-[#FAFAF8]"
      spinnerClassName="h-7 w-7 animate-spin rounded-full border-2 border-[#2D6A4F]/20 border-t-[#2D6A4F]"
    />
  );
}
