export type GearStatus = "owned" | "wishlist";
export type WeightType = "base" | "consumable" | "worn";
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
  | "KANTO_TOKYO"
  | "KANTO_TOKYO_SAITAMA_YAMANASHI"
  | "NORTHERN_ALPS_NAGANO"
  | "NORTHERN_ALPS_NAGANO_GIFU";

export type GearCategory = {
  id: string;
  name_ja: string;
  name_en: string;
  sort_order: number;
  is_default: boolean;
  created_at: string;
};

export type GearSubcategory = {
  id: string;
  category_id: string;
  name_ja: string;
  name_en: string;
  sort_order: number;
  created_at: string;
};

export type GearProduct = {
  id: string;
  brand: string;
  model: string;
  name_ja: string | null;
  category_id: string;
  subcategory_id: string | null;
  weight_grams: number | null;
  official_weight_grams: number | null;
  measured_weight_grams: number | null;
  msrp_jpy: number | null;
  size: string | null;
  volume: string | null;
  color: string | null;
  material: string | null;
  capacity: string | null;
  official_url: string | null;
  image_url: string | null;
  released_at: string | null;
  discontinued: boolean;
  msrp_source_url: string | null;
  last_verified_at: string | null;
  verification_status: VerificationStatus;
  created_at: string;
  gear_categories?: Pick<GearCategory, "id" | "name_ja" | "name_en"> | null;
  gear_subcategories?: Pick<GearSubcategory, "id" | "name_ja" | "name_en"> | null;
  gear_product_aliases?: Array<{ alias: string }> | null;
};

export type UserGear = {
  id: string;
  user_id: string;
  product_id: string | null;
  category_id: string;
  subcategory_id: string | null;
  name: string;
  brand: string | null;
  model: string | null;
  weight_grams: number;
  official_weight_grams: number | null;
  measured_weight_grams: number | null;
  msrp_jpy: number | null;
  purchase_price_jpy: number | null;
  size: string | null;
  volume: string | null;
  color: string | null;
  material: string | null;
  capacity: string | null;
  official_url: string | null;
  image_url: string | null;
  purchase_date: string | null;
  status: GearStatus;
  weight_type: WeightType;
  memo: string | null;
  created_at: string;
  updated_at: string;
  gear_categories?: Pick<GearCategory, "id" | "name_ja" | "name_en"> | null;
  gear_subcategories?: Pick<GearSubcategory, "id" | "name_ja" | "name_en"> | null;
  gear_products?: Pick<
    GearProduct,
    | "id"
    | "brand"
    | "model"
    | "name_ja"
    | "category_id"
    | "subcategory_id"
    | "official_url"
    | "msrp_source_url"
    | "last_verified_at"
    | "verification_status"
  > & {
    gear_categories?: Pick<GearCategory, "id" | "name_ja" | "name_en"> | null;
    gear_subcategories?: Pick<GearSubcategory, "id" | "name_ja" | "name_en"> | null;
  } | null;
};

export type GearFilters = {
  q?: string;
  status?: GearStatus | "all";
  category?: string;
  sort?: "newest" | "weight" | "price";
};

export type DashboardRecentGear = Pick<
  UserGear,
  "id" | "name" | "image_url" | "weight_grams"
>;

export type DashboardSummary = {
  totalCount: number;
  ownedCount: number;
  wishlistCount: number;
  totalWeightG: number;
  totalMsrpJpy: number;
  totalPurchaseJpy: number;
  savingsJpy: number;
  savingsRate: number;
  baseWeightG: number;
  consumableWeightG: number;
  wornWeightG: number;
  totalPackWeightG: number;
  categoryWeights: Array<{
    categoryId: string;
    nameJa: string;
    weightG: number;
    count: number;
  }>;
  recentGear: DashboardRecentGear[];
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
  elevation_m: number;
  is_hyakumeizan: boolean;
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
