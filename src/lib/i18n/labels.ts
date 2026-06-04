import type {
  AccommodationStyle,
  GearStatus,
  Season,
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
  sleep: "Sleep",
  shelter: "Shelter",
  carry: "Carry",
  clothing: "Clothing",
  cooking: "Cooking",
  electronics: "Electronics",
  navigation: "Navigation",
  safety: "Safety",
  hydration: "Hydration",
  other: "Other"
};
