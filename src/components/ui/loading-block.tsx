import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils/format";

type LoadingBlockProps = ComponentPropsWithoutRef<"main"> & {
  spinnerClassName?: string;
};

export function LoadingBlock({
  className,
  spinnerClassName,
  ...props
}: LoadingBlockProps) {
  return (
    <main
      className={cn("flex min-h-[100dvh] items-center justify-center bg-[#FAFAF8]", className)}
      {...props}
    >
      <div
        className={cn(
          "h-7 w-7 animate-spin rounded-full border-2 border-[#2D6A4F]/20 border-t-[#2D6A4F]",
          spinnerClassName
        )}
      />
    </main>
  );
}
