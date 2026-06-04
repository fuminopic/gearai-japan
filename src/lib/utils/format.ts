import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatWeight(grams: number) {
  if (grams >= 1000) {
    return `${(grams / 1000).toLocaleString("ja-JP", {
      minimumFractionDigits: grams % 1000 === 0 ? 0 : 2,
      maximumFractionDigits: 2
    })} kg`;
  }

  return `${Math.round(grams).toLocaleString("ja-JP")} g`;
}

export function formatJpy(value: number) {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0
  }).format(value);
}

export function toNumber(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
