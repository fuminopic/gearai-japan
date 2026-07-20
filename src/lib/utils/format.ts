import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 重量表示の唯一の基準。桁数はここだけで決める。
 *
 * `compact` は単位の前の空白を詰めるだけで、丸め方は変えない。ホームの
 * 指標のように `whitespace-nowrap` で幅が限られる場所で使う。以前は
 * ダッシュボードが独自の小数1桁フォーマッタを持っていたため、同じ重量が
 * ホームでは 4.9kg、マイパックでは 4.87 kg と食い違って見えていた。
 */
export function formatWeight(grams: number, options?: { compact?: boolean }) {
  const separator = options?.compact ? "" : " ";

  if (grams >= 1000) {
    return `${(grams / 1000).toLocaleString("ja-JP", {
      minimumFractionDigits: grams % 1000 === 0 ? 0 : 2,
      maximumFractionDigits: 2
    })}${separator}kg`;
  }

  return `${Math.round(grams).toLocaleString("ja-JP")}${separator}g`;
}

export function formatJpy(value: number) {
  return `¥${Math.round(value).toLocaleString("ja-JP")}`;
}

export function toNumber(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
