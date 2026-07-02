import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils/format";

type NoticeProps = ComponentPropsWithoutRef<"p"> & {
  tone?: "info" | "success" | "error" | "warning";
};

const noticeTones: Record<NonNullable<NoticeProps["tone"]>, string> = {
  info: "bg-stone-50 text-stone-600",
  success: "bg-forest-50 text-forest-800",
  error: "bg-red-50 text-red-700",
  warning: "bg-amber-50 text-amber-900"
};

export function Notice({ className, tone = "info", ...props }: NoticeProps) {
  return (
    <p
      className={cn("rounded-lg px-4 py-3 text-sm font-semibold", noticeTones[tone], className)}
      {...props}
    />
  );
}
