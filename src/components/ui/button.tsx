import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils/format";

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
};

const buttonVariants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-forest-700 text-white shadow-sm",
  secondary: "border border-stone-200 bg-white text-stone-700",
  danger: "border border-red-100 bg-red-50 text-red-700",
  ghost: "bg-stone-100 text-stone-700"
};

export function Button({
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-lg text-sm font-semibold transition active:scale-95 disabled:opacity-60",
        buttonVariants[variant],
        className
      )}
      {...props}
    />
  );
}
