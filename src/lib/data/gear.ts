import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { GearCategory, GearFilters, UserGear } from "@/lib/types";

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { supabase, user };
}

export async function getGearCategories() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gear_categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data as GearCategory[];
}

export async function getUserGear(filters: GearFilters = {}) {
  const { supabase, user } = await requireUser();
  let query = supabase
    .from("user_gear")
    .select(
      "*, gear_categories:category_id(id, name_ja, name_en)"
    )
    .eq("user_id", user.id);

  if (filters.q) {
    const keyword = filters.q.replaceAll("%", "").trim();
    if (keyword) {
      query = query.or(`name.ilike.%${keyword}%,brand.ilike.%${keyword}%`);
    }
  }

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters.category) {
    query = query.eq("category_id", filters.category);
  }

  if (filters.sort === "weight") {
    query = query.order("weight_g", { ascending: false });
  } else if (filters.sort === "price") {
    query = query.order("price_jpy", { ascending: false, nullsFirst: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data as UserGear[];
}

export async function getUserGearById(id: string) {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("user_gear")
    .select("*, gear_categories:category_id(id, name_ja, name_en)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as UserGear;
}

