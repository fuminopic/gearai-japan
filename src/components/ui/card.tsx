import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils/format";

type CardProps = ComponentPropsWithoutRef<"section">;

export function Card({ className, ...props }: CardProps) {
  return (
    <section
      className={cn("rounded-lg bg-white shadow-soft", className)}
      {...props}
    />
  );
}
