import type {
  AIRecommendationOutput,
  AIRecommendedItem,
  AccommodationStyle,
  ExperienceLevel,
  Season,
  WeatherRisk
} from "@/lib/types";

export type RuleEngineInput = {
  mountain_region: string;
  season: Season;
  weather_risk: WeatherRisk;
  days: number;
  accommodation_style: AccommodationStyle;
  budget_jpy: number;
  experience_level: ExperienceLevel;
};

type MountainKnowledge = {
  region: string;
  aliases: string[];
  elevationBand: "low" | "mid" | "high";
  defaultRisks: WeatherRisk[];
  hutAvailable: boolean;
  campingAvailable: boolean;
  notes: string;
};

const MOUNTAIN_KNOWLEDGE: MountainKnowledge[] = [
  {
    region: "富士山",
    aliases: ["fuji", "mt fuji", "富士山", "富士"],
    elevationBand: "high",
    defaultRisks: ["cold", "wind", "rain"],
    hutAvailable: true,
    campingAvailable: false,
    notes: "夏でも山頂付近は低温・強風になりやすい。"
  },
  {
    region: "北アルプス",
    aliases: ["north alps", "kita alps", "北アルプス"],
    elevationBand: "high",
    defaultRisks: ["cold", "wind", "rain"],
    hutAvailable: true,
    campingAvailable: true,
    notes: "稜線の風雨と低温、行動時間の長さを前提にする。"
  },
  {
    region: "南アルプス",
    aliases: ["south alps", "minami alps", "南アルプス"],
    elevationBand: "high",
    defaultRisks: ["cold", "rain"],
    hutAvailable: true,
    campingAvailable: true,
    notes: "長いアプローチと水場間隔を意識する。"
  },
  {
    region: "八ヶ岳",
    aliases: ["yatsugatake", "八ヶ岳"],
    elevationBand: "high",
    defaultRisks: ["cold", "wind"],
    hutAvailable: true,
    campingAvailable: true,
    notes: "岩稜帯と季節による低温差に注意する。"
  },
  {
    region: "谷川岳",
    aliases: ["tanigawa", "谷川岳"],
    elevationBand: "mid",
    defaultRisks: ["rain", "wind"],
    hutAvailable: true,
    campingAvailable: false,
    notes: "天候変化が速く、雨具と保温の余裕が重要。"
  }
];

export function createRuleBasedRecommendation(
  input: RuleEngineInput
): AIRecommendationOutput {
  const mountain = findMountainKnowledge(input.mountain_region);
  const required = createRequiredItems(input, mountain);
  const recommended = createRecommendedItems(input, mountain, required);
  const optional = createOptionalItems(input, mountain);
  const allItems = [...required, ...recommended, ...optional];
  const risks = createRiskWarnings(input, mountain);
  const estimatedBudget = sumPrice(allItems);
  const estimatedWeight = sumWeight(allItems);

  return {
    trip_summary: `${mountain.region} / ${input.days}日 / ${accommodationLabel(
      input.accommodation_style
    )}の装備チェックです。${mountain.notes}`,
    required_items: required,
    recommended_items: recommended,
    optional_items: optional,
    risk_warnings: risks,
    estimated_total_weight_g: estimatedWeight,
    estimated_total_budget_jpy: estimatedBudget,
    budget_comment:
      input.budget_jpy >= estimatedBudget
        ? "入力予算内で不足装備を揃えられる見込みです。"
        : `入力予算との差額目安は ${(
            estimatedBudget - input.budget_jpy
          ).toLocaleString("ja-JP")} 円です。安全装備を優先してください。`,
    safety_note:
      "実際の山行では直前の天候、登山道状況、山小屋営業状況を確認し、撤退判断を含めて計画してください。"
  };
}

function createRequiredItems(
  input: RuleEngineInput,
  mountain: MountainKnowledge
) {
  const items: AIRecommendedItem[] = [
    item("バックパック", "carry", "backpack", "装備量と行動時間に合わせた容量が必要です。", "high", 900, 22000, "base"),
    item("レインウェア", "clothing", "rainwear", "雨と風による体温低下を防ぐ最優先装備です。", "high", 280, 24000, "base"),
    item("ヘッドランプ", "electronics", "headlamp", "行動遅延や早朝出発に備える必須装備です。", "high", 90, 6000, "base"),
    item("地図", "navigation", "map", "電池切れに依存しない現在地確認手段です。", "high", 40, 1200, "base"),
    item("コンパス", "navigation", "compass", "視界不良時の方向確認に使います。", "medium", 35, 2500, "base"),
    item("ファーストエイドキット", "safety", "first_aid_kit", "小さな怪我や低体温の初期対応に備えます。", "high", 180, 4500, "base"),
    item("ボトル", "hydration", "bottle", "水分補給を確実にする基本装備です。", "high", 120, 2500, "base")
  ];

  if (needsInsulation(input, mountain)) {
    items.push(
      item("保温着", "clothing", "insulation", "高所・低温・停滞時の冷えに備えます。", "high", 320, 22000, "base")
    );
  }

  if (input.days > 1 || input.weather_risk === "cold" || input.weather_risk === "snow") {
    items.push(
      item("ダウンジャケット", "clothing", "down_jacket", "宿泊や低温リスクで休憩中の保温余力を確保します。", "medium", 260, 30000, "base")
    );
  }

  if (input.accommodation_style === "tent") {
    items.push(
      item("テント", "shelter", "tent", "テント泊では風雨を避ける寝床として必須です。", "high", 1500, 65000, "base"),
      item("グラウンドシート", "shelter", "groundsheet", "フロア保護と浸水対策に使います。", "medium", 220, 9000, "base"),
      item("寝袋", "sleep", "sleeping_bag", "夜間の想定最低気温に合わせた保温が必要です。", "high", 760, 45000, "base"),
      item("スリーピングパッド", "sleep", "sleeping_pad", "地面からの冷えを抑え、睡眠の質を保ちます。", "high", 420, 22000, "base"),
      item("ストーブ", "cooking", "stove", "テント泊の食事と温かい飲み物に使います。", "medium", 90, 9000, "base"),
      item("ガスカートリッジ", "cooking", "gas_canister", "調理用燃料です。日数に応じて残量を見ます。", "medium", 230, 700, "consumable"),
      item("クッカー", "cooking", "cookware", "湯沸かしと簡単な調理に使います。", "medium", 180, 6500, "base")
    );
  }

  return dedupeItems(items);
}

function createRecommendedItems(
  input: RuleEngineInput,
  mountain: MountainKnowledge,
  required: AIRecommendedItem[]
) {
  const items: AIRecommendedItem[] = [];

  if (input.days > 1 || mountain.elevationBand === "high") {
    items.push(
      item("パワーバンク", "electronics", "power_bank", "スマートフォンやライトの予備電源を確保します。", "medium", 180, 7000, "base")
    );
  }

  if (input.weather_risk === "snow" || input.season === "winter") {
    items.push(
      item("GPS", "navigation", "gps", "積雪や視界不良時の現在地確認を補助します。", "medium", 150, 28000, "base")
    );
  }

  if (input.accommodation_style === "tent") {
    items.push(
      item("ピロー", "sleep", "pillow", "睡眠の質を上げて翌日の行動余力を残します。", "low", 80, 4500, "base")
    );
  }

  if (input.experience_level === "beginner" && !hasSubcategory(required, "bear_bell")) {
    items.push(
      item("熊鈴", "safety", "bear_bell", "人の少ないルートで存在を知らせる補助になります。", "low", 45, 1800, "base")
    );
  }

  return dedupeItems(items);
}

function createOptionalItems(input: RuleEngineInput, mountain: MountainKnowledge) {
  const items: AIRecommendedItem[] = [];

  if (input.days > 1 || mountain.region === "南アルプス") {
    items.push(
      item("浄水フィルター", "hydration", "filter", "水場利用時の安全余裕を増やします。", "low", 75, 8500, "base")
    );
  }

  if (input.accommodation_style === "tent") {
    items.push(
      item("タープ", "shelter", "tarp", "停滞時の雨避けや調理スペースを作れます。", "low", 350, 18000, "base")
    );
  }

  return items;
}

function createRiskWarnings(input: RuleEngineInput, mountain: MountainKnowledge) {
  const risks = new Set<WeatherRisk>([
    ...mountain.defaultRisks,
    input.weather_risk
  ]);

  return Array.from(risks).map((risk) => ({
    level: risk === "snow" || risk === "cold" || risk === "wind" ? "high" : "medium",
    message: riskMessage(risk, mountain)
  })) as AIRecommendationOutput["risk_warnings"];
}

function findMountainKnowledge(rawRegion: string) {
  const normalized = normalize(rawRegion);
  return (
    MOUNTAIN_KNOWLEDGE.find((mountain) =>
      mountain.aliases.some((alias) => normalize(alias).includes(normalized) || normalized.includes(normalize(alias)))
    ) ?? MOUNTAIN_KNOWLEDGE[0]
  );
}

function needsInsulation(input: RuleEngineInput, mountain: MountainKnowledge) {
  return (
    mountain.elevationBand === "high" ||
    input.weather_risk === "cold" ||
    input.weather_risk === "snow" ||
    input.season === "autumn" ||
    input.season === "winter"
  );
}

function item(
  name: string,
  category: AIRecommendedItem["category"],
  subcategory: string,
  reason: string,
  priority: AIRecommendedItem["priority"],
  estimated_weight_g: number,
  estimated_price_jpy: number,
  weight_type: AIRecommendedItem["weight_type"]
): AIRecommendedItem {
  return {
    name,
    category,
    subcategory,
    reason,
    priority,
    estimated_weight_g,
    estimated_price_jpy,
    weight_type
  };
}

function hasSubcategory(items: AIRecommendedItem[], subcategory: string) {
  return items.some((item) => item.subcategory === subcategory);
}

function dedupeItems(items: AIRecommendedItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.category}:${item.subcategory}:${item.name}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function sumWeight(items: AIRecommendedItem[]) {
  return items.reduce((total, item) => total + item.estimated_weight_g, 0);
}

function sumPrice(items: AIRecommendedItem[]) {
  return items.reduce((total, item) => total + item.estimated_price_jpy, 0);
}

function normalize(value: string) {
  return value.toLocaleLowerCase().replace(/\s+/g, "");
}

function accommodationLabel(value: AccommodationStyle) {
  if (value === "day_hike") {
    return "日帰り";
  }

  if (value === "hut") {
    return "山小屋泊";
  }

  return "テント泊";
}

function riskMessage(risk: WeatherRisk, mountain: MountainKnowledge) {
  if (risk === "rain") {
    return `${mountain.region}では雨による体温低下と視界不良を想定してください。`;
  }

  if (risk === "cold") {
    return `${mountain.region}では停滞時の冷えを前提に保温を厚めに見ます。`;
  }

  if (risk === "wind") {
    return `${mountain.region}では稜線や山頂付近の強風で行動不能になるリスクがあります。`;
  }

  if (risk === "snow") {
    return `${mountain.region}の雪リスクでは通常の夏山装備だけで判断しないでください。`;
  }

  return `${mountain.region}でも天候急変に備えた最低限の雨具と保温は必要です。`;
}
