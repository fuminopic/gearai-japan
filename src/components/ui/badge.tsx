import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils/format";

type BadgeProps = ComponentPropsWithoutRef<"span"> & {
  tone?: "neutral" | "forest" | "red" | "amber";
};

const badgeTones: Record<NonNullable<BadgeProps["tone"]>, string> = {
  neutral: "bg-stone-100 text-stone-600",
  forest: "bg-forest-50 text-forest-800",
  red: "bg-red-50 text-red-700",
  amber: "bg-amber-50 text-amber-800"
};

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn("inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-semibold", badgeTones[tone], className)}
      {...props}
    />
  );
}
