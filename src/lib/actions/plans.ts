"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/data/gear";

export async function deletePlan(formData: FormData) {
  const id = String(formData.get("id") ?? "");

  if (!id) {
    throw new Error("計画IDが見つかりませんでした。");
  }

  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("ai_recommendations")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/plan");
  revalidatePath("/dashboard");
}

export async function clearPlans() {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("ai_recommendations")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/plan");
  revalidatePath("/dashboard");
}
