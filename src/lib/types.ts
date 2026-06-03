export type GearStatus = "owned" | "wishlist";
export type WeightType = "base" | "consumable" | "worn";
export type ExperienceLevel = "beginner" | "intermediate" | "advanced" | "expert";

export type GearCategory = {
  id: string;
  name_ja: string;
  name_en: string;
  sort_order: number;
  is_default: boolean;
  created_at: string;
};

export type UserGear = {
  id: string;
  user_id: string;
  category_id: string;
  name: string;
  brand: string | null;
  weight_g: number;
  price_jpy: number | null;
  purchase_date: string | null;
  status: GearStatus;
  weight_type: WeightType;
  notes: string | null;
  created_at: string;
  updated_at: string;
  gear_categories?: Pick<GearCategory, "id" | "name_ja" | "name_en"> | null;
};

export type GearFilters = {
  q?: string;
  status?: GearStatus | "all";
  category?: string;
  sort?: "newest" | "weight" | "price";
};

export type DashboardSummary = {
  totalCount: number;
  ownedCount: number;
  wishlistCount: number;
  totalWeightG: number;
  totalValueJpy: number;
  baseWeightG: number;
  consumableWeightG: number;
  wornWeightG: number;
  categoryWeights: Array<{
    categoryId: string;
    nameJa: string;
    weightG: number;
    count: number;
  }>;
  recentGear: UserGear[];
};

export type Mountain = {
  id: string;
  name_ja: string;
  region: string | null;
  elevation_m: number | null;
  difficulty_level: string | null;
  best_season: string | null;
  camping_available: boolean | null;
  hut_available: boolean | null;
  snow_risk: "none" | "low" | "medium" | "high" | "seasonal" | null;
  seasonal_temperature: Record<string, unknown> | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type RecommendationPriority = "high" | "medium" | "low";
export type RecommendationCategory =
  | "backpacking"
  | "sleeping"
  | "clothing"
  | "cooking"
  | "safety"
  | "electronics"
  | "other";

export type AIRecommendedItem = {
  name: string;
  category: RecommendationCategory;
  reason: string;
  priority: RecommendationPriority;
  estimated_weight_g: number;
  estimated_price_jpy: number;
};

export type AIRiskWarning = {
  level: RecommendationPriority;
  message: string;
};

export type AIRecommendationOutput = {
  trip_summary: string;
  required_items: AIRecommendedItem[];
  recommended_items: AIRecommendedItem[];
  optional_items: AIRecommendedItem[];
  risk_warnings: AIRiskWarning[];
  estimated_total_weight_g: number;
  estimated_total_budget_jpy: number;
  budget_comment: string;
  safety_note: string;
};

export type OwnedAnalysisItem = {
  recommended_name: string;
  matched_user_gear_id: string;
  matched_user_gear_name: string;
  match_confidence: "high" | "medium";
};

export type MissingAnalysisItem = AIRecommendedItem & {
  group: "required" | "recommended" | "optional";
};

export type GearAnalysis = {
  owned_items: OwnedAnalysisItem[];
  maybe_owned_items: OwnedAnalysisItem[];
};

export type MissingGearAnalysis = {
  missing_required_items: MissingAnalysisItem[];
  missing_recommended_items: MissingAnalysisItem[];
  missing_optional_items: MissingAnalysisItem[];
  estimated_missing_weight_g: number;
  estimated_missing_budget_jpy: number;
};

export type AIRecommendationRecord = {
  id: string;
  user_id: string;
  mountain_id: string | null;
  input: {
    mountain_name: string;
    month: number;
    days: number;
    is_camping: boolean;
    budget_jpy: number;
    experience_level: ExperienceLevel;
  };
  output: AIRecommendationOutput;
  owned_analysis: GearAnalysis | null;
  missing_analysis: MissingGearAnalysis | null;
  model: string;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  created_at: string;
};
