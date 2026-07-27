import type { VerificationStatus } from "../types";

export type WeightType = "base" | "consumable" | "worn";

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

// 手入力フォームのカタログ選択に必要な最小投影。計画のマッチング用
// GearProduct 全体とは分け、RSC で未使用の検証・履歴フィールドを送らない。
export type GearPickerProduct = Pick<
  GearProduct,
  | "id"
  | "brand"
  | "model"
  | "name_ja"
  | "category_id"
  | "subcategory_id"
  | "weight_grams"
  | "official_weight_grams"
  | "msrp_jpy"
  | "size"
  | "volume"
  | "color"
  | "material"
  | "capacity"
  | "official_url"
  | "image_url"
  | "gear_categories"
  | "gear_subcategories"
  | "gear_product_aliases"
>;

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
  image_storage_path: string | null;
  purchase_date: string | null;
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
  category?: string;
  brand?: string;
  sort?: "newest" | "weight";
};

export type GearActionResult =
  | { ok: true; redirectTo: string }
  | { ok: false; error: string };

export type {
  GearCompatibilityRule,
  GearCompatibilityTarget,
  GearMatchingConfidence,
  GearMatchingDatabaseGearMatch,
  GearMatchingInput,
  GearMatchingOwnedGearMatch,
  GearMatchingResult,
  VerificationStatus,
} from "../types";
