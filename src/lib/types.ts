import type {
  GearCategory,
  GearProduct,
  GearSubcategory,
  UserGear,
  WeightType,
} from "./types/gear";

export type {
  GearActionResult,
  GearCategory,
  GearFilters,
  GearPickerProduct,
  GearProduct,
  GearStatus,
  GearSubcategory,
  UserGear,
  WeightType,
} from "./types/gear";

export type VerificationStatus = "verified" | "unverified" | "needs_review";
export type ExperienceLevel = "beginner" | "intermediate" | "advanced" | "expert";
export type AccommodationStyle = "day_hike" | "hut" | "tent";
export type WeatherRisk = "stable" | "rain" | "cold" | "wind" | "snow";
export type Season = "spring" | "summer" | "autumn" | "winter";
export type BearRiskLevel = "low" | "medium" | "high";
export type MountainFoundationSeason = "SPRING" | "SUMMER" | "AUTUMN" | "WINTER";
export type MountainFoundationStyle =
  | "DAY_HIKE"
  | "OVERNIGHT_HUT"
  | "OVERNIGHT_TENT"
  | "MULTI_DAY_TREK";
export type MountainTripProfile =
  | "FRONT_COUNTRY_DAY_HIKE"
  | "BACKCOUNTRY_DAY_HIKE"
  | "OVERNIGHT_BACKPACKING"
  | "ALPINE_TREK";
export type MountainRouteSeriousness = "LOW" | "MODERATE" | "HIGH" | "EXTREME";
export type MountainTechnicalTerrain =
  | "MAINTAINED_TRAIL"
  | "STEEP_ROCKY"
  | "CHAIN_LADDER"
  | "EXPOSED_SCRAMBLE";
export type MountainHelmetGuidance = "NOT_NEEDED" | "RECOMMENDED" | "REQUIRED";
export type MountainWaterAvailability =
  | "TREATED_RELIABLE"
  | "HUT_OR_SHOP_RELIABLE"
  | "NATURAL_RELIABLE"
  | "LIMITED_OR_SEASONAL"
  | "UNRELIABLE";
export type MountainHutSupport =
  | "NONE"
  | "EMERGENCY_ONLY"
  | "BASIC_NO_BEDDING"
  | "BEDDING_ONLY"
  | "FULL_SERVICE";
export type MountainTentSiteAvailability =
  | "NONE"
  | "DESIGNATED"
  | "LIMITED"
  | "WILD_PERMITTED"
  | "UNKNOWN";
export type MountainAlpineEnvironment =
  | "LOWLAND_FOREST"
  | "SUBALPINE_FOREST"
  | "ABOVE_TREELINE"
  | "HIGH_ALPINE_EXPOSED";
export type MountainSnowOrIceRisk =
  | "NONE"
  | "LOW"
  | "SEASONAL_PATCHES"
  | "LIKELY"
  | "WINTER_ALPINE";
export type MountainRouteDurationBand =
  | "SHORT"
  | "HALF_DAY"
  | "FULL_DAY"
  | "LONG_DAY"
  | "MULTI_DAY";
export type MountainEscapeOptions = "EASY" | "MODERATE" | "LIMITED" | "REMOTE";
export type MountainCellSignalReliability = "RELIABLE" | "PARTIAL" | "POOR" | "NONE";
export type MountainWildlifeRisk = "LOW" | "MODERATE" | "HIGH";
export type MountainVolcanicRisk = "NONE" | "ACTIVE_MONITORED" | "ACTIVE_RESTRICTED";
export type MountainSeasonOpeningWindow =
  | "YEAR_ROUND"
  | "SNOW_FREE"
  | "SUMMER_AUTUMN"
  | "HUT_SEASON"
  | "WINTER_EXPERT_ONLY";
export type MountainActiveVolcanoStatus = "NONE" | "ACTIVE" | "ADJACENT";
export type MountainPlanningStatus = "PLANNABLE" | "NOT_STANDARD_ROUTE";
export type MountainCurrentPlanStatusCode = "REVIEW_REQUIRED" | "BLOCKED";
export type MountainCurrentPlanStatusReasonCode =
  | "VOLCANO_RESTRICTION"
  | "TRAIL_CLOSURE"
  | "SEASONAL_SNOW"
  | "OTHER";
export type MountainCurrentPlanStatus = {
  status: MountainCurrentPlanStatusCode;
  reasonCode: MountainCurrentPlanStatusReasonCode;
  messageJa: string;
  sourceUrl: string;
  verifiedAt: string;
  reviewAfter: string;
  isStale: boolean;
};
export type MountainCurrentPlanStatusBySlug = Readonly<
  Record<string, MountainCurrentPlanStatus>
>;
export type MountainMeizanList =
  | "JAPAN_HYAKUMEIZAN"
  | "JAPAN_NIHYAKUMEIZAN_EXTRA"
  | "OTHER";
export type PlanningSystem =
  | "WATER_SYSTEM"
  | "SHELTER_SYSTEM"
  | "SLEEP_SYSTEM"
  | "COOK_SYSTEM"
  | "RAIN_SYSTEM"
  | "COLD_WEATHER_LAYER"
  | "NAVIGATION_SYSTEM"
  | "TECHNICAL_SAFETY_SYSTEM"
  | "EMERGENCY_SYSTEM";
export type RequirementSlot =
  | "WATER_STORAGE"
  | "WATER_TREATMENT"
  | "TENT"
  | "SLEEP_INSULATION"
  | "SLEEP_PAD"
  | "STOVE"
  | "FUEL"
  | "COOK_POT"
  | "TABLEWARE"
  | "RAIN_JACKET"
  | "RAIN_PANTS"
  | "INSULATION_LAYER"
  | "BASE_LAYER"
  | "HELMET"
  | "TRACTION_DEVICE"
  | "GPS_DEVICE"
  | "POWER_BANK"
  | "FIRST_AID_KIT"
  | "HEADLAMP";
export type RequirementSlotCoverageStatus = "COVERED" | "MISSING";
export type GearMatchingConfidence = "HIGH" | "MEDIUM" | "LOW";
export type MountainFoundationRegion =
  | "HOKKAIDO"
  | "TOHOKU"
  | "HOKUSHINETSU"
  | "KANTO"
  | "HOKURIKU"
  | "TOKAI"
  | "KINKI"
  | "FUJI"
  | "OKUCHICHIBU"
  | "TANZAWA"
  | "NIKKO"
  | "YATSUGATAKE"
  | "NORTHERN_ALPS"
  | "CENTRAL_ALPS"
  | "SOUTHERN_ALPS"
  | "CHUGOKU"
  | "SHIKOKU"
  | "KYUSHU"
  | "YAKUSHIMA"
  | "KANTO_TOKYO"
  | "KANTO_TOKYO_SAITAMA_YAMANASHI"
  | "NORTHERN_ALPS_NAGANO"
  | "NORTHERN_ALPS_NAGANO_GIFU"
  | "JOSHU";

export type MountainFoundationPrimaryRegion =
  | "HOKKAIDO"
  | "TOHOKU"
  | "HOKUSHINETSU"
  | "KANTO"
  | "KANTO_TOKYO"
  | "HOKURIKU"
  | "TOKAI"
  | "KINKI"
  | "FUJI"
  | "OKUCHICHIBU"
  | "TANZAWA"
  | "NIKKO"
  | "YATSUGATAKE"
  | "NORTHERN_ALPS"
  | "CENTRAL_ALPS"
  | "SOUTHERN_ALPS"
  | "CHUGOKU"
  | "SHIKOKU"
  | "KYUSHU"
  | "YAKUSHIMA"
  | "JOSHU";

export type DashboardGear = Pick<
  UserGear,
  "id" | "name" | "image_url" | "image_storage_path" | "weight_grams"
>;

export type DashboardSummary = {
  totalCount: number;
  ownedCount: number;
  wishlistCount: number;
  packItemCount: number;
  packKnownWeightG: number;
  packWeightMissingCount: number;
  packMajorCategoryCoverageCount: number;
  packMajorCategoryTotalCount: number;
  packCategoryWeights: Array<{
    categoryId: string;
    nameJa: string;
    weightG: number;
    count: number;
  }>;
  // 「最近の8件」ではなく、上の指標(ownedCount)と同じ owned 全件。
  gearItems: DashboardGear[];
};

export type DataQualitySummary = {
  missingMsrpCount: number;
  missingWeightCount: number;
  missingOfficialUrlCount: number;
  missingCategoryCount: number;
  unverifiedCount: number;
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

export type MountainFoundationProfile = {
  slug: string;
  name_ja: string;
  region: MountainFoundationRegion;
  primary_region: MountainFoundationPrimaryRegion;
  mountain_range: string;
  prefectures: string[];
  elevation_m: number;
  is_hyakumeizan: boolean;
  meizan_list: MountainMeizanList;
  supported_seasons: MountainFoundationSeason[];
  supported_styles: MountainFoundationStyle[];
  trip_profile: MountainTripProfile;
  typical_required_systems: PlanningSystem[];
  route_seriousness: MountainRouteSeriousness;
  technical_terrain: MountainTechnicalTerrain;
  helmet_guidance: MountainHelmetGuidance;
  water_availability: MountainWaterAvailability;
  hut_support: MountainHutSupport;
  tent_site_availability: MountainTentSiteAvailability;
  alpine_environment: MountainAlpineEnvironment;
  snow_or_ice_risk: MountainSnowOrIceRisk;
  route_duration_band: MountainRouteDurationBand;
  escape_options: MountainEscapeOptions;
  cell_signal_reliability: MountainCellSignalReliability;
  bear_or_wildlife_risk: MountainWildlifeRisk;
  volcanic_risk: MountainVolcanicRisk;
  season_opening_window: MountainSeasonOpeningWindow;
  active_volcano_status: MountainActiveVolcanoStatus;
  jma_volcano_name: string | null;
  jma_alert_url: string | null;
  jma_constant_monitoring: boolean | null;
  restriction_status_note: string | null;
  snow_free_month_guide: number | null;
  mandatory_gear_note: string | null;
  supplementary_notes: string | null;
  planning_status: MountainPlanningStatus;
};

export type SavedTripPlan = {
  id: string;
  user_id: string;
  mountain_slug: string | null;
  mountain_name: string;
  season: MountainFoundationSeason;
  style: MountainFoundationStyle;
  image_url: string | null;
  progress: number;
  checked_slots: RequirementSlot[];
  unchecked_packed_slots: RequirementSlot[];
  planned_date: string | null;
  planned_end_date: string | null;
  trip_memo: string | null;
  bring_cash: boolean;
  has_mountain_insurance: boolean;
  water_volume_ml: number;
  trail_food_included: boolean;
  trail_food_weight_g: number;
  meal_count: number;
  meal_weight_g: number;
  created_at: string;
};

export type TripRequirementInput = {
  mountain: MountainFoundationProfile;
  season: MountainFoundationSeason;
  style: MountainFoundationStyle;
};

export type TripRequirementLookupInput = {
  mountainSlug: string;
  season: MountainFoundationSeason;
  style: MountainFoundationStyle;
};

export type PackRequirementInput = {
  mountain: MountainFoundationProfile;
  season: MountainFoundationSeason;
  style: MountainFoundationStyle;
  requiredSystems: PlanningSystem[];
  ownedGear: UserGear[];
};

export type PackRequirementLookupInput = {
  mountainSlug: string;
  season: MountainFoundationSeason;
  style: MountainFoundationStyle;
};

export type GearCompatibilityTarget = {
  category: string;
  subcategory: string;
};

export type GearCompatibilityRule = {
  slot: RequirementSlot;
  compatible_targets: GearCompatibilityTarget[];
  confidence: GearMatchingConfidence;
  ambiguous_cases: string[];
};

export type GearMatchingOwnedGearMatch = Pick<
  UserGear,
  "id" | "name" | "brand" | "model" | "category_id" | "subcategory_id"
> & {
  gear_categories?: Pick<GearCategory, "id" | "name_ja" | "name_en"> | null;
  gear_subcategories?: Pick<GearSubcategory, "id" | "name_ja" | "name_en"> | null;
};

export type GearMatchingDatabaseGearMatch = Pick<
  GearProduct,
  "id" | "brand" | "model" | "name_ja" | "category_id" | "subcategory_id"
> & {
  gear_categories?: Pick<GearCategory, "id" | "name_ja" | "name_en"> | null;
  gear_subcategories?: Pick<GearSubcategory, "id" | "name_ja" | "name_en"> | null;
};

export type GearMatchingInput = {
  slot: RequirementSlot;
  ownedGear?: UserGear[];
  databaseGear?: GearProduct[];
};

export type GearMatchingResult = {
  slot: RequirementSlot;
  compatible_categories: string[];
  compatible_subcategories: string[];
  matching_owned_gear: GearMatchingOwnedGearMatch[];
  matching_database_gear: GearMatchingDatabaseGearMatch[];
  confidence: GearMatchingConfidence;
  ambiguous_cases: string[];
};

export type PackRequirementSlotPlan = {
  slot: RequirementSlot;
  coverage_status: RequirementSlotCoverageStatus;
  matching_owned_gear: GearMatchingOwnedGearMatch[];
};

export type PackRequirementPlan = {
  mountain: MountainFoundationProfile;
  season: MountainFoundationSeason;
  style: MountainFoundationStyle;
  required_systems: PlanningSystem[];
  required_slots: PackRequirementSlotPlan[];
  covered_slots: PackRequirementSlotPlan[];
  missing_slots: PackRequirementSlotPlan[];
};

export type RecommendationPriority = "high" | "medium" | "low";
export type RecommendationCategory =
  | "sleep"
  | "shelter"
  | "backpack"
  | "clothing"
  | "cooking"
  | "electronics"
  | "first_aid"
  | "bear_safety"
  | "other";

export type AIRecommendedItem = {
  name: string;
  category: RecommendationCategory;
  subcategory: string;
  reason: string;
  priority: RecommendationPriority;
  estimated_weight_g: number;
  estimated_price_jpy: number;
  weight_type: WeightType;
  rule_basis: string;
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
  mountain_rules: string[];
  season_rules: string[];
  bear_risk_level: BearRiskLevel;
  bear_risk_reason: string;
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
    mountain_region: string;
    season: Season;
    month: number;
    weather_risk: WeatherRisk;
    days: number;
    accommodation_style: AccommodationStyle;
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
