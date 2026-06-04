"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/data/gear";
import type { GearStatus, WeightType } from "@/lib/types";
import { toNumber } from "@/lib/utils/format";

export async function createGear(formData: FormData) {
  const { supabase, user } = await requireUser();
  const payload = getGearPayload(formData);

  const { error } = await supabase.from("user_gear").insert({
    ...payload,
    user_id: user.id
  });

  if (error) {
    redirect(`/gear/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/gear");
  redirect("/gear");
}

export async function updateGear(id: string, formData: FormData) {
  const { supabase, user } = await requireUser();
  const payload = getGearPayload(formData);

  const { data, error } = await supabase
    .from("user_gear")
    .update(payload)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    redirect(`/gear/${id}/edit?error=${encodeURIComponent(error.message)}`);
  }

  if (!data) {
    redirect(
      `/gear/${id}/edit?error=${encodeURIComponent("装備を保存できませんでした")}`
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/gear");
  revalidatePath(`/gear/${id}/edit`);
  redirect("/gear");
}

export async function deleteGear(id: string) {
  const { supabase, user } = await requireUser();

  const { error } = await supabase
    .from("user_gear")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    redirect(`/gear?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/gear");
}

function getGearPayload(formData: FormData) {
  const officialWeight = toNumber(formData.get("official_weight_grams"));
  const measuredWeight = toNumber(formData.get("measured_weight_grams"));
  const msrp = toNumber(formData.get("msrp_jpy"));
  const purchasePrice = toNumber(formData.get("purchase_price_jpy"));
  const purchaseDate = String(formData.get("purchase_date") ?? "");
  const storedWeight = measuredWeight ?? officialWeight ?? 0;

  return {
    product_id: optionalString(formData.get("product_id")),
    category_id: String(formData.get("category_id") ?? ""),
    subcategory_id: optionalString(formData.get("subcategory_id")),
    name: String(formData.get("name") ?? "").trim(),
    brand: optionalString(formData.get("brand")),
    model: optionalString(formData.get("model")),
    weight_grams: Math.max(0, Math.round(storedWeight)),
    official_weight_grams:
      officialWeight === null ? null : Math.max(0, Math.round(officialWeight)),
    measured_weight_grams:
      measuredWeight === null ? null : Math.max(0, Math.round(measuredWeight)),
    msrp_jpy: msrp === null ? null : Math.round(msrp),
    purchase_price_jpy:
      purchasePrice === null ? null : Math.round(purchasePrice),
    size: optionalString(formData.get("size")),
    volume: optionalString(formData.get("volume")),
    color: optionalString(formData.get("color")),
    material: optionalString(formData.get("material")),
    capacity: optionalString(formData.get("capacity")),
    official_url: optionalString(formData.get("official_url")),
    image_url: optionalString(formData.get("image_url")),
    purchase_date: purchaseDate || null,
    status: String(formData.get("status") ?? "owned") as GearStatus,
    weight_type: String(formData.get("weight_type") ?? "base") as WeightType,
    memo: optionalString(formData.get("memo"))
  };
}

function optionalString(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}
