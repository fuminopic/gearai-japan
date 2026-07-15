"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/data/gear";

type PackActionResult = { ok: true } | { ok: false; error: string };

export async function addPackItems(gearIds: string[]): Promise<PackActionResult> {
  const uniqueIds = Array.from(new Set(gearIds.filter(isUuid)));

  if (uniqueIds.length === 0) {
    return { ok: true };
  }

  const { supabase, user } = await requireUser();
  const { data: ownedGear, error: ownedGearError } = await supabase
    .from("user_gear")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "owned")
    .in("id", uniqueIds);

  if (ownedGearError) {
    return { ok: false, error: ownedGearError.message };
  }

  const rows = (ownedGear ?? []).map((gear) => ({
    user_id: user.id,
    gear_id: gear.id
  }));

  if (rows.length === 0) {
    return { ok: true };
  }

  const { error } = await supabase
    .from("user_pack_items")
    .upsert(rows, { onConflict: "user_id,gear_id", ignoreDuplicates: true });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePackViews();
  return { ok: true };
}

export async function removePackItem(gearId: string): Promise<PackActionResult> {
  if (!isUuid(gearId)) {
    return { ok: false, error: "装備をパックから外せませんでした" };
  }

  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("user_pack_items")
    .delete()
    .eq("user_id", user.id)
    .eq("gear_id", gearId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePackViews();
  return { ok: true };
}

function revalidatePackViews() {
  revalidatePath("/pack");
  revalidatePath("/pack/select");
  revalidatePath("/dashboard");
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}
