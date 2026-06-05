import type {
  AccommodationStyle,
  GearStatus,
  Season,
  VerificationStatus,
  WeatherRisk,
  WeightType
} from "@/lib/types";

export const statusLabels: Record<GearStatus, string> = {
  owned: "所有",
  wishlist: "欲しい"
};

export const weightTypeLabels: Record<WeightType, string> = {
  base: "ベース",
  consumable: "消耗品",
  worn: "着用"
};

export const verificationStatusLabels: Record<
  VerificationStatus,
  { label: string; marker: string; className: string }
> = {
  verified: {
    label: "公式検証データ",
    marker: "✓",
    className: "border-forest-100 bg-forest-50 text-forest-700"
  },
  unverified: {
    label: "未検証データ",
    marker: "⚠",
    className: "border-amber-100 bg-amber-50 text-amber-700"
  },
  needs_review: {
    label: "需要人工审核",
    marker: "⚠",
    className: "border-red-100 bg-red-50 text-red-700"
  }
};

export const experienceLabels = {
  beginner: "初心者",
  intermediate: "中級者",
  advanced: "上級者",
  expert: "エキスパート"
} as const;

export const accommodationStyleLabels: Record<AccommodationStyle, string> = {
  day_hike: "日帰り",
  hut: "山小屋泊",
  tent: "テント泊"
};

export const seasonLabels: Record<Season, string> = {
  spring: "春",
  summer: "夏",
  autumn: "秋",
  winter: "冬"
};

export const weatherRiskLabels: Record<WeatherRisk, string> = {
  stable: "安定",
  rain: "雨",
  cold: "低温",
  wind: "強風",
  snow: "雪"
};

export const categoryLabels: Record<string, string> = {
  backpack: "背負システム",
  shelter: "シェルター",
  sleep: "睡眠システム",
  clothing: "ウェア",
  cooking: "クッキング",
  electronics: "電子機器",
  first_aid: "応急処置",
  bear_safety: "熊対策",
  other: "その他"
};
