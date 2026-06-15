import type {
  AccommodationStyle,
  GearStatus,
  GearMatchingConfidence,
  MountainFoundationSeason,
  MountainFoundationStyle,
  PlanningSystem,
  RequirementSlot,
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
  rainwear: "レインウェア",
  cooking: "クッキング",
  electronics: "電子機器",
  first_aid: "応急処置",
  bear_safety: "熊対策",
  other: "その他"
};

export const mountainFoundationSeasonLabels: Record<
  MountainFoundationSeason,
  string
> = {
  SPRING: "春",
  SUMMER: "夏",
  AUTUMN: "秋",
  WINTER: "冬"
};

export const mountainFoundationStyleLabels: Record<MountainFoundationStyle, string> = {
  DAY_HIKE: "日帰り",
  OVERNIGHT_HUT: "山小屋泊",
  OVERNIGHT_TENT: "テント泊",
  MULTI_DAY_TREK: "縦走"
};

export const planningSystemLabels: Record<PlanningSystem, string> = {
  WATER_SYSTEM: "水分補給",
  SHELTER_SYSTEM: "シェルター",
  SLEEP_SYSTEM: "睡眠",
  COOK_SYSTEM: "調理",
  RAIN_SYSTEM: "雨対策",
  COLD_WEATHER_LAYER: "防寒",
  NAVIGATION_SYSTEM: "ナビゲーション",
  TECHNICAL_SAFETY_SYSTEM: "技術安全",
  EMERGENCY_SYSTEM: "緊急対応"
};

export const requirementSlotLabels: Record<RequirementSlot, string> = {
  WATER_STORAGE: "水（飲料水・容器・浄水）",
  WATER_TREATMENT: "水（飲料水・容器・浄水）",
  TENT: "テント",
  SLEEP_INSULATION: "寝袋",
  SLEEP_PAD: "スリーピングパッド",
  STOVE: "ストーブ",
  FUEL: "燃料",
  COOK_POT: "クッカー",
  TABLEWARE: "食器",
  RAIN_JACKET: "雨具（レインギア）",
  RAIN_PANTS: "雨具（レインギア）",
  INSULATION_LAYER: "保温着",
  BASE_LAYER: "ベースレイヤー",
  HELMET: "ヘルメット",
  TRACTION_DEVICE: "軽アイゼン・チェーンスパイク",
  GPS_DEVICE: "GPS デバイス",
  POWER_BANK: "モバイルバッテリー",
  FIRST_AID_KIT: "ファーストエイド",
  HEADLAMP: "ヘッドランプ"
};

export const gearSubcategoryLabels: Record<string, string> = {
  bottle: "ボトル",
  water_filter: "浄水器",
  tent: "テント",
  groundsheet: "グラウンドシート",
  sleeping_bag: "寝袋",
  sleeping_pad: "スリーピングパッド",
  stove: "ストーブ",
  fuel: "燃料",
  gas_canister: "ガスカートリッジ",
  cookware: "クッカー",
  tableware: "食器",
  rain_jacket: "レインジャケット",
  rain_pants: "レインパンツ",
  insulation: "保温着",
  down_jacket: "ダウンジャケット",
  base_layer: "ベースレイヤー",
  trekking_pants: "トレッキングパンツ",
  footwear: "フットウェア",
  helmet: "ヘルメット",
  traction_device: "軽アイゼン・チェーンスパイク",
  gloves: "手袋",
  trekking_pole: "トレッキングポール",
  gps: "GPS",
  power_bank: "モバイルバッテリー",
  first_aid_kit: "ファーストエイドキット",
  headlamp: "ヘッドランプ"
};

export const gearMatchingConfidenceLabels: Record<GearMatchingConfidence, string> = {
  HIGH: "高",
  MEDIUM: "中",
  LOW: "低"
};
