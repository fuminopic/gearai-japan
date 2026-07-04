import { redirect } from "next/navigation";
import { cache } from "react";

import {
  getRetailGearCategory,
  isRetailGearCategoryId
} from "@/lib/gear-major-categories";
import {
  canonicalizeBrandName,
  getBrandAliasesForQuery,
  normalizeBrandKey
} from "@/lib/brand-normalization";
import { createClient } from "@/lib/supabase/server";
import type {
  GearCategory,
  GearFilters,
  GearProduct,
  GearSubcategory,
  UserGear
} from "@/lib/types";

const PRODUCT_CATEGORY_KEYS = [
  "backpack",
  "shelter",
  "sleep",
  "clothing",
  "rainwear",
  "cooking",
  "electronics",
  "first_aid",
  "bear_safety",
  "other"
];

const USER_GEAR_SELECT =
  "*, gear_categories:category_id(id, name_ja, name_en), gear_subcategories:subcategory_id(id, name_ja, name_en), gear_products:product_id(id, brand, model, name_ja, category_id, subcategory_id, official_url, msrp_source_url, last_verified_at, verification_status, gear_categories:category_id(id, name_ja, name_en), gear_subcategories:subcategory_id(id, name_ja, name_en))";
const USER_GEAR_MATCHING_SELECT =
  "id, user_id, product_id, category_id, subcategory_id, name, brand, model, status, weight_grams, weight_type, created_at, gear_categories:category_id(id, name_ja, name_en), gear_subcategories:subcategory_id(id, name_ja, name_en), gear_products:product_id(id, brand, model, name_ja, category_id, subcategory_id, gear_categories:category_id(id, name_ja, name_en), gear_subcategories:subcategory_id(id, name_ja, name_en))";

type GearCategoryRow = GearCategory;
type GearSubcategoryRow = GearSubcategory;
type GearProductRow = GearProduct;
type GearCategoryRelationRow = Pick<GearCategory, "id" | "name_ja" | "name_en">;
type GearSubcategoryRelationRow = Pick<GearSubcategory, "id" | "name_ja" | "name_en">;
type UserGearProductRelationRow = Pick<
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
  gear_categories?: GearCategoryRelationRow | null;
  gear_subcategories?: GearSubcategoryRelationRow | null;
};
type UserGearRow = Omit<
  UserGear,
  "gear_categories" | "gear_subcategories" | "gear_products"
> & {
  gear_categories?: GearCategoryRelationRow | null;
  gear_subcategories?: GearSubcategoryRelationRow | null;
  gear_products?: UserGearProductRelationRow | null;
};
type SupabaseUserGearPlanningRow = Pick<
  UserGear,
  | "id"
  | "user_id"
  | "product_id"
  | "category_id"
  | "subcategory_id"
  | "name"
  | "brand"
  | "model"
  | "status"
  | "weight_grams"
  | "weight_type"
  | "created_at"
> & {
  gear_categories?: GearCategoryRelationRow[] | null;
  gear_subcategories?: GearSubcategoryRelationRow[] | null;
  gear_products?: Array<
    Pick<GearProduct, "id" | "brand" | "model" | "name_ja" | "category_id" | "subcategory_id"> & {
      gear_categories?: GearCategoryRelationRow[] | null;
      gear_subcategories?: GearSubcategoryRelationRow[] | null;
    }
  > | null;
};
type UserGearPlanningRow = UserGear;

export const requireUser = cache(async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { supabase, user };
});

export const getGearCategories = cache(async function getGearCategories() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gear_categories")
    .select("id, name_ja, name_en, sort_order, is_default, created_at")
    .in("name_en", PRODUCT_CATEGORY_KEYS)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data as GearCategoryRow[];
});

export const getGearSubcategories = cache(async function getGearSubcategories() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gear_subcategories")
    .select("id, category_id, name_ja, name_en, sort_order, created_at")
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data as GearSubcategoryRow[];
});

export const getGearProducts = cache(async function getGearProducts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gear_products")
    .select(
      "*, gear_categories:category_id(id, name_ja, name_en), gear_subcategories:subcategory_id(id, name_ja, name_en), gear_product_aliases(alias)"
    )
    .eq("discontinued", false)
    .order("brand", { ascending: true })
    .order("model", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data as GearProductRow[];
});

export async function getUserGear(filters: GearFilters = {}) {
  const { supabase, user } = await requireUser();
  let query = supabase
    .from("user_gear")
    .select(USER_GEAR_SELECT)
    .eq("user_id", user.id);

  if (filters.q) {
    const keyword = filters.q.replaceAll("%", "").trim();
    if (keyword) {
      query = query.or(
        `name.ilike.%${keyword}%,brand.ilike.%${keyword}%,model.ilike.%${keyword}%,memo.ilike.%${keyword}%`
      );
    }
  }

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters.category && !isRetailGearCategoryId(filters.category)) {
    query = query.eq("category_id", filters.category);
  }

  if (filters.brand) {
    const brandAliases = getBrandAliasesForQuery(filters.brand);

    query =
      brandAliases.length > 1
        ? query.in("brand", brandAliases)
        : query.eq("brand", brandAliases[0] ?? filters.brand);
  }

  if (filters.sort === "weight") {
    query = query.order("weight_grams", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const rows = data as UserGearRow[];
  const signedGear = canonicalizeUserGearBrands(await signGearImageUrls(supabase, rows));

  if (filters.category && isRetailGearCategoryId(filters.category)) {
    return signedGear.filter((item) => getRetailGearCategory(item)?.id === filters.category);
  }

  return signedGear;
}

export async function getUserGearBrands() {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("user_gear")
    .select("brand")
    .eq("user_id", user.id)
    .not("brand", "is", null)
    .order("brand", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return Array.from(
    (data ?? [])
      .map((item) => canonicalizeBrandName(item.brand))
      .filter((brand): brand is string => Boolean(brand))
      .reduce((brands, brand) => {
        brands.set(normalizeBrandKey(brand), brand);
        return brands;
      }, new Map<string, string>())
      .values()
  ).sort((a, b) => a.localeCompare(b, "ja"));
}

export const getOwnedGearForPlanning = cache(async function getOwnedGearForPlanning() {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("user_gear")
    .select(USER_GEAR_MATCHING_SELECT)
    .eq("user_id", user.id)
    .eq("status", "owned")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data as SupabaseUserGearPlanningRow[] as UserGearPlanningRow[];
});

export async function getUserGearById(id: string) {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("user_gear")
    .select(USER_GEAR_SELECT)
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return canonicalizeUserGearBrands(await signGearImageUrls(supabase, [data as UserGearRow]))[0];
}

function canonicalizeUserGearBrands(gear: UserGear[]) {
  return gear.map((item) => {
    const brand = item.brand ? canonicalizeBrandName(item.brand) : null;

    if (brand === item.brand) {
      return item;
    }

    return {
      ...item,
      brand
    };
  });
}

async function signGearImageUrls(
  supabase: Awaited<ReturnType<typeof createClient>>,
  gear: UserGear[]
) {
  const signedGear = await Promise.all(
    gear.map(async (item) => {
      if (!item.image_storage_path) {
        return item;
      }

      const { data } = await supabase.storage
        .from("gear-images")
        .createSignedUrl(item.image_storage_path, 60 * 60);

      return {
        ...item,
        image_url: data?.signedUrl ?? item.image_url
      };
    })
  );

  return signedGear;
}
