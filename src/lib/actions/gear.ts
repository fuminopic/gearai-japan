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

  const { error } = await supabase
    .from("user_gear")
    .update(payload)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    redirect(`/gear/${id}/edit?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/gear");
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
  const weight = toNumber(formData.get("weight_g"));
  const price = toNumber(formData.get("price_jpy"));
  const purchaseDate = String(formData.get("purchase_date") ?? "");

  return {
    category_id: String(formData.get("category_id") ?? ""),
    name: String(formData.get("name") ?? "").trim(),
    brand: optionalString(formData.get("brand")),
    weight_g: weight ?? 0,
    price_jpy: price,
    purchase_date: purchaseDate || null,
    status: String(formData.get("status") ?? "owned") as GearStatus,
    weight_type: String(formData.get("weight_type") ?? "base") as WeightType,
    notes: optionalString(formData.get("notes"))
  };
}

function optionalString(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

