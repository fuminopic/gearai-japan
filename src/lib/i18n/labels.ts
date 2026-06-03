import type { GearStatus, WeightType } from "@/lib/types";

export const statusLabels: Record<GearStatus, string> = {
  owned: "所有",
  wishlist: "欲しい"
};

export const weightTypeLabels: Record<WeightType, string> = {
  base: "ベース",
  consumable: "消耗品",
  worn: "着用"
};

export const experienceLabels = {
  beginner: "初心者",
  intermediate: "中級者",
  advanced: "上級者",
  expert: "エキスパート"
} as const;

