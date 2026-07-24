import { redirect } from "next/navigation";
import { cache } from "react";

import { getUserWithAuthRetry } from "@/lib/auth-validation";
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
  GearPickerProduct,
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
type SupabaseGearPickerProductRow = Omit<
  GearPickerProduct,
  "gear_categories" | "gear_subcategories"
> & {
  gear_categories?: GearCategoryRelationRow[] | null;
  gear_subcategories?: GearSubcategoryRelationRow[] | null;
};
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

// Thrown when the session cannot be validated because of a *transient* failure
// (network drop on WebView resume, token-refresh hiccup, Auth 5xx). Callers/pages
// should let this surface (retry/report) — it must NOT be turned into a logout.
export class AuthValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthValidationError";
  }
}

export const requireUser = cache(async function requireUser() {
  const supabase = await createClient();

  const authResult = await getUserWithAuthRetry(supabase);

  if (authResult.kind === "transient_error") {
    // Transient auth error after a retry: do NOT redirect to /login, do NOT
    // signOut, do NOT clear the session (any of those reads as a false logout).
    // Surface a controlled error so the page can retry/report while the user
    // stays signed in.
    throw new AuthValidationError(authResult.message);
  }

  if (authResult.kind === "unauthenticated") {
    // Confirmed unauthenticated: getUser() succeeded with no error and no user.
    redirect("/login");
  }

  // Security note: `user` always comes from a successful getUser() (server-
  // validated). We never fall back to getSession().user to admit a user.
  return { supabase, user: authResult.user };
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

  return data as unknown as GearProductRow[];
});

// 計画の互換候補表示は、カタログの検証履歴・価格・画像を使わない。
// 完全な製品行を RSC 境界まで運ぶと、計画を開くたびに老舗ユーザーの
// 所有ギア照合と競合するため、マッチングエンジンが実際に参照する分類・名称
// だけに投影する。認証情報や署名 URL はこの結果に含めない。
const GEAR_PLANNING_PRODUCT_SELECT =
  "id,brand,model,name_ja,category_id,subcategory_id,gear_categories:category_id(id,name_ja,name_en),gear_subcategories:subcategory_id(id,name_ja,name_en),gear_product_aliases(alias)";

export const getGearProductsForPlanning = cache(async function getGearProductsForPlanning() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gear_products")
    .select(GEAR_PLANNING_PRODUCT_SELECT)
    .eq("discontinued", false)
    .order("brand", { ascending: true })
    .order("model", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  // GearProduct の残りのフィールドは計画マッチングでは読まない。呼び出し側の
  // 入力型を保ちつつ、不要なカタログ列を取得・直列化しない。
  return data as unknown as GearProductRow[];
});

const GEAR_PICKER_PRODUCT_SELECT =
  "id,brand,model,name_ja,category_id,subcategory_id,weight_grams,official_weight_grams,msrp_jpy,size,volume,color,material,capacity,official_url,image_url,gear_categories:category_id(id, name_ja, name_en),gear_subcategories:subcategory_id(id, name_ja, name_en),gear_product_aliases(alias)";

// 新規/編集フォームはカタログ検索に必要なフィールドだけを RSC 境界へ渡す。
// 計画のマッチングは getGearProducts() の完全な型を使い続ける。
export const getGearProductsForPicker = cache(async function getGearProductsForPicker() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gear_products")
    .select(GEAR_PICKER_PRODUCT_SELECT)
    .eq("discontinued", false)
    .order("brand", { ascending: true })
    .order("model", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data as SupabaseGearPickerProductRow[]).map((product) => ({
    ...product,
    gear_categories: product.gear_categories?.[0] ?? null,
    gear_subcategories: product.gear_subcategories?.[0] ?? null
  }));
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

/**
 * 画像URLの署名。
 *
 * 以前は createSignedUrl(単数)を map の中で呼んでいたため、ギア1件に
 * つき Storage への往復が1回発生していた。14件なら14回、100件なら
 * 100回。ホーム・マイギア・計画のどれを開いても毎回これが走る。
 * createSignedUrls(複数)で1回にまとめる。
 *
 * 返り値は入力と同じ順序・同じ件数を保つ(呼び出し側がそのまま並べ替えや
 * 絞り込みに使うため)。署名に失敗した項目は元の image_url のまま返す。
 */
async function signGearImageUrls(
  supabase: Awaited<ReturnType<typeof createClient>>,
  gear: UserGear[]
) {
  const paths = Array.from(
    new Set(
      gear
        .map((item) => item.image_storage_path)
        .filter((path): path is string => Boolean(path))
    )
  );

  if (paths.length === 0) {
    return gear;
  }

  const { data } = await supabase.storage
    .from("gear-images")
    .createSignedUrls(paths, 60 * 60);

  const signedUrlByPath = new Map<string, string>();

  for (const entry of data ?? []) {
    if (entry.path && entry.signedUrl) {
      signedUrlByPath.set(entry.path, entry.signedUrl);
    }
  }

  return gear.map((item) => {
    const signedUrl = item.image_storage_path
      ? signedUrlByPath.get(item.image_storage_path)
      : undefined;

    return signedUrl ? { ...item, image_url: signedUrl } : item;
  });
}
