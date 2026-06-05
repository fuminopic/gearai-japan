import type {
  AIRecommendationOutput,
  AIRecommendedItem,
  AccommodationStyle,
  BearRiskLevel,
  ExperienceLevel,
  Season,
  WeatherRisk
} from "@/lib/types";

export type RuleEngineInput = {
  mountain_region: string;
  season: Season;
  month: number;
  weather_risk: WeatherRisk;
  days: number;
  accommodation_style: AccommodationStyle;
  experience_level: ExperienceLevel;
};

type MountainKnowledge = {
  region: string;
  aliases: string[];
  defaultRisks: WeatherRisk[];
  campingAllowed: boolean;
  mountainRule: string;
  bearBaseRisk: BearRiskLevel;
};

const MOUNTAINS: MountainKnowledge[] = [
  {
    region: "富士山",
    aliases: ["fuji", "mt fuji", "富士", "富士山"],
    defaultRisks: ["cold", "wind", "rain"],
    campingAllowed: false,
    mountainRule: "富士山は山小屋・日帰り前提。テント、寝袋、マット、キャンプ装備は推薦対象外。",
    bearBaseRisk: "low"
  },
  {
    region: "北アルプス",
    aliases: ["north alps", "kita alps", "北アルプス"],
    defaultRisks: ["cold", "wind", "rain"],
    campingAllowed: true,
    mountainRule: "北アルプスは高所稜線の低温・強風・長時間行動を優先して判定。",
    bearBaseRisk: "medium"
  },
  {
    region: "南アルプス",
    aliases: ["south alps", "minami alps", "南アルプス"],
    defaultRisks: ["cold", "rain"],
    campingAllowed: true,
    mountainRule: "南アルプスは長いアプローチ、水場間隔、森林帯の熊リスクを加味。",
    bearBaseRisk: "high"
  },
  {
    region: "八ヶ岳",
    aliases: ["yatsugatake", "八ヶ岳"],
    defaultRisks: ["cold", "wind"],
    campingAllowed: true,
    mountainRule: "八ヶ岳は岩稜帯と季節による低温差を優先して判定。",
    bearBaseRisk: "medium"
  },
  {
    region: "谷川岳",
    aliases: ["tanigawa", "谷川岳"],
    defaultRisks: ["rain", "wind"],
    campingAllowed: false,
    mountainRule: "谷川岳は天候急変と強風を優先し、日帰り・小屋泊装備を基本に判定。",
    bearBaseRisk: "medium"
  }
];

export function createRuleBasedRecommendation(
  input: RuleEngineInput
): AIRecommendationOutput {
  const mountain = findMountain(input.mountain_region);
  const accommodationStyle =
    mountain.region === "富士山" ? "day_hike" : input.accommodation_style;
  const bearRisk = evaluateBearRisk({
    region: mountain.region,
    month: input.month,
    season: input.season,
    baseRisk: mountain.bearBaseRisk
  });
  const required = createRequiredItems(input, mountain, accommodationStyle);
  const recommended = createRecommendedItems(input, mountain, bearRisk);
  const optional = createOptionalItems(input, mountain, accommodationStyle);
  const allItems = [...required, ...recommended, ...optional];
  const mountainRules = [
    mountain.mountainRule,
    accommodationStyle === "tent" && mountain.campingAllowed
      ? "テント泊指定のため宿泊装備を追加。"
      : "日帰り・山小屋泊ではキャンプ装備を除外。"
  ];
  const seasonRules = createSeasonRules(input);
  const risks = createRiskWarnings(input, mountain, bearRisk);

  return {
    trip_summary: `${mountain.region} / ${input.days}日 / ${accommodationLabel(
      accommodationStyle
    )}の装備推薦です。`,
    required_items: required,
    recommended_items: recommended,
    optional_items: optional,
    risk_warnings: risks,
    estimated_total_weight_g: sumWeight(allItems),
    estimated_total_budget_jpy: sumPrice(allItems),
    budget_comment: `不足装備の预计追加金额は ${sumPrice(allItems).toLocaleString(
      "ja-JP"
    )} 円です。`,
    safety_note: "直前の天候、登山道、山小屋営業状況を確認して判断してください。",
    mountain_rules: mountainRules,
    season_rules: seasonRules,
    bear_risk_level: bearRisk.level,
    bear_risk_reason: bearRisk.reason
  };
}

function createRequiredItems(
  input: RuleEngineInput,
  mountain: MountainKnowledge,
  accommodationStyle: AccommodationStyle
) {
  const items: AIRecommendedItem[] = [
    item("バックパック", "backpack", "backpack", "行動時間と装備量に合う容量を確保。", "high", 850, 22000, "base", "山域共通ルール"),
    item("レインウェア", "clothing", "rainwear", "日本の山岳では雨と風による体温低下対策を最優先。", "high", 260, 26000, "base", "天候リスクルール"),
    item("ヘッドランプ", "electronics", "headlamp", "下山遅れや山小屋到着遅れに備える。", "high", 80, 7000, "base", "安全装備ルール"),
    item("ファーストエイドキット", "first_aid", "first_aid_kit", "擦過傷、捻挫、低体温の初期対応に使う。", "high", 160, 4500, "base", "安全装備ルール")
  ];

  if (needsInsulation(input, mountain)) {
    items.push(
      item("保温着", "clothing", "insulation", "高所・低温・停滞時の冷えを抑える。", "high", 300, 22000, "base", "季節・高所ルール")
    );
  }

  if (accommodationStyle === "tent" && mountain.campingAllowed) {
    items.push(
      item("テント", "shelter", "tent", "テント泊指定かつ幕営可能山域のため必要。", "high", 1500, 65000, "base", "宿泊スタイルルール"),
      item("寝袋", "sleep", "sleeping_bag", "夜間の想定最低気温に合わせた保温が必要。", "high", 760, 45000, "base", "宿泊スタイルルール"),
      item("マット", "sleep", "sleeping_pad", "地面からの冷えを防ぎ睡眠を確保。", "high", 420, 22000, "base", "宿泊スタイルルール"),
      item("クッカー", "cooking", "cookware", "テント泊の湯沸かしと食事に使う。", "medium", 180, 6500, "base", "宿泊スタイルルール")
    );
  }

  return dedupeItems(items);
}

function createRecommendedItems(
  input: RuleEngineInput,
  mountain: MountainKnowledge,
  bearRisk: BearRisk
) {
  const items: AIRecommendedItem[] = [];

  if (input.days > 1 || mountain.defaultRisks.includes("cold")) {
    items.push(
      item("パワーバンク", "electronics", "power_bank", "スマートフォンとライトの電源余裕を確保。", "medium", 180, 7000, "base", "行動日数ルール")
    );
  }

  if (input.weather_risk === "snow" || input.season === "winter") {
    items.push(
      item("GPS", "electronics", "gps", "積雪や視界不良時の現在地確認を補助。", "medium", 150, 28000, "base", "冬季・視界不良ルール")
    );
  }

  if (bearRisk.level === "medium" || bearRisk.level === "high") {
    items.push(
      item("熊鈴", "bear_safety", "bear_bell", bearRisk.reason, bearRisk.level === "high" ? "high" : "medium", 45, 1800, "base", "Bear Risk Engine")
    );
  }

  return items;
}

function createOptionalItems(
  input: RuleEngineInput,
  mountain: MountainKnowledge,
  accommodationStyle: AccommodationStyle
) {
  const items: AIRecommendedItem[] = [];

  if (input.days > 1 && mountain.region !== "富士山") {
    items.push(
      item("浄水フィルター", "other", "water_filter", "水場利用がある長い行程で安全余裕を増やす。", "low", 75, 8500, "base", "行動日数ルール")
    );
  }

  if (accommodationStyle === "tent" && mountain.campingAllowed) {
    items.push(
      item("ストーブ", "cooking", "stove", "温かい食事や飲み物が必要な計画で追加。", "low", 90, 9000, "base", "宿泊スタイルルール")
    );
  }

  return items;
}

type BearRisk = {
  level: BearRiskLevel;
  reason: string;
};

function evaluateBearRisk({
  region,
  month,
  season,
  baseRisk
}: {
  region: string;
  month: number;
  season: Season;
  baseRisk: BearRiskLevel;
}): BearRisk {
  const activeSeason = month >= 5 && month <= 11;

  if (region === "富士山") {
    return {
      level: "low",
      reason: "富士山の一般登山道では熊鈴を固定推薦しない。"
    };
  }

  if (!activeSeason || season === "winter") {
    return {
      level: baseRisk === "high" ? "medium" : "low",
      reason: "冬季・低活動期のため熊リスクを下げて判定。"
    };
  }

  if (baseRisk === "high") {
    return {
      level: "high",
      reason: `${region}は森林帯行動と季節要因により熊リスク高。熊鈴を推奨。`
    };
  }

  if (baseRisk === "medium") {
    return {
      level: "medium",
      reason: `${region}は季節により熊リスク中。人の少ない区間で熊鈴を推奨。`
    };
  }

  return {
    level: "low",
    reason: `${region}は今回条件では熊鈴を固定推薦しない。`
  };
}

function createRiskWarnings(
  input: RuleEngineInput,
  mountain: MountainKnowledge,
  bearRisk: BearRisk
) {
  const risks = new Set<WeatherRisk>([
    ...mountain.defaultRisks,
    input.weather_risk
  ]);
  const warnings = Array.from(risks).map((risk) => ({
    level: risk === "snow" || risk === "cold" || risk === "wind" ? "high" : "medium",
    message: riskMessage(risk, mountain.region)
  })) as AIRecommendationOutput["risk_warnings"];

  warnings.push({
    level: bearRisk.level === "high" ? "high" : bearRisk.level === "medium" ? "medium" : "low",
    message: `熊リスク: ${riskLabel(bearRisk.level)}。${bearRisk.reason}`
  });

  return warnings;
}

function createSeasonRules(input: RuleEngineInput) {
  const rules = [`${input.month}月 / ${seasonLabel(input.season)}条件で判定。`];

  if (input.season === "winter" || input.weather_risk === "snow") {
    rules.push("冬季・積雪条件では通常夏山装備だけで判断しない。");
  }

  if (input.season === "autumn" || input.weather_risk === "cold") {
    rules.push("秋・低温条件では停滞時の保温を厚めに見る。");
  }

  return rules;
}

function findMountain(rawRegion: string) {
  const normalized = normalize(rawRegion);
  return (
    MOUNTAINS.find((mountain) =>
      mountain.aliases.some(
        (alias) =>
          normalize(alias).includes(normalized) ||
          normalized.includes(normalize(alias))
      )
    ) ?? MOUNTAINS[0]
  );
}

function needsInsulation(input: RuleEngineInput, mountain: MountainKnowledge) {
  return (
    mountain.defaultRisks.includes("cold") ||
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
  weight_type: AIRecommendedItem["weight_type"],
  rule_basis: string
): AIRecommendedItem {
  return {
    name,
    category,
    subcategory,
    reason,
    priority,
    estimated_weight_g,
    estimated_price_jpy,
    weight_type,
    rule_basis
  };
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

function seasonLabel(value: Season) {
  if (value === "spring") {
    return "春";
  }

  if (value === "summer") {
    return "夏";
  }

  if (value === "autumn") {
    return "秋";
  }

  return "冬";
}

function riskLabel(value: BearRiskLevel) {
  if (value === "high") {
    return "高リスク";
  }

  if (value === "medium") {
    return "中リスク";
  }

  return "低リスク";
}

function riskMessage(risk: WeatherRisk, region: string) {
  if (risk === "rain") {
    return `${region}では雨による体温低下と視界不良を想定。`;
  }

  if (risk === "cold") {
    return `${region}では停滞時の冷えを前提に保温を確保。`;
  }

  if (risk === "wind") {
    return `${region}では稜線や山頂付近の強風リスクに注意。`;
  }

  if (risk === "snow") {
    return `${region}の雪リスクでは通常夏山装備だけで判断しない。`;
  }

  return `${region}でも天候急変に備える。`;
}
