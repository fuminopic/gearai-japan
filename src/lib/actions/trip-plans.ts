"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/data/gear";
import type {
  MountainFoundationSeason,
  MountainFoundationStyle
} from "@/lib/types";

export async function saveTripPlan(formData: FormData) {
  const mountainSlug = String(formData.get("mountain_slug") ?? "").trim();
  const mountainName = String(formData.get("mountain_name") ?? "").trim();
  const season = parseSeason(formData.get("season"));
  const style = parseStyle(formData.get("style"));
  const imageUrl = optionalString(formData.get("image_url"));

  if (!mountainSlug || !mountainName || !season || !style) {
    throw new Error("保存する山行計画の情報が不足しています。");
  }

  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("trip_plans").insert([
    {
      user_id: user.id,
      mountain_slug: mountainSlug,
      mountain_name: mountainName,
      season,
      style,
      image_url: imageUrl
    }
  ]);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/plan");
}

export async function deleteTripPlan(formData: FormData) {
  const id = String(formData.get("id") ?? "");

  if (!id) {
    throw new Error("計画IDが見つかりませんでした。");
  }

  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("trip_plans")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/plan");
  revalidatePath("/dashboard");
}

export async function clearTripPlans() {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("trip_plans")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/plan");
  revalidatePath("/dashboard");
}

function parseSeason(value: FormDataEntryValue | null): MountainFoundationSeason | null {
  if (
    value === "SPRING" ||
    value === "SUMMER" ||
    value === "AUTUMN" ||
    value === "WINTER"
  ) {
    return value;
  }

  return null;
}

function parseStyle(value: FormDataEntryValue | null): MountainFoundationStyle | null {
  if (
    value === "DAY_HIKE" ||
    value === "OVERNIGHT_HUT" ||
    value === "OVERNIGHT_TENT" ||
    value === "MULTI_DAY_TREK"
  ) {
    return value;
  }

  return null;
}

function optionalString(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();

  return text.length > 0 ? text : null;
}
