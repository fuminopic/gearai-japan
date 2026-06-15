import { redirect } from "next/navigation";
import { cache } from "react";

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
    .select("*")
    .in("name_en", PRODUCT_CATEGORY_KEYS)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data as GearCategory[];
});

export const getGearSubcategories = cache(async function getGearSubcategories() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gear_subcategories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data as GearSubcategory[];
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

  return data as GearProduct[];
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

  if (filters.category) {
    query = query.eq("category_id", filters.category);
  }

  if (filters.brand) {
    query = query.eq("brand", filters.brand);
  }

  if (filters.sort === "weight") {
    query = query.order("weight_grams", { ascending: false });
  } else if (filters.sort === "price") {
    query = query.order("purchase_price_jpy", {
      ascending: false,
      nullsFirst: false
    });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data as unknown as UserGear[];
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
    new Set(
      (data ?? [])
        .map((item) => item.brand?.trim())
        .filter((brand): brand is string => Boolean(brand))
    )
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

  return data as unknown as UserGear[];
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

  return data as UserGear;
}
