"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { canonicalizeBrandName } from "@/lib/brand-normalization";
import { requireUser } from "@/lib/data/gear";
import type { GearActionResult, GearStatus, WeightType } from "@/lib/types";
import { toNumber } from "@/lib/utils/format";

// 注意:createGear / updateGear 不再在成功时直接 redirect()。
// 原因:<form action={...}> 原生绑定下,redirect() 会让按钮的"保存中"状态
// 一直卡到目标页整个渲染完才消失(尤其冷启动/数据慢时体验很差)。
// 现在改为返回结果,前端(gear-form.tsx)拿到 ok:true 后立刻显示"保存しました",
// 再自己调用 router.push 跳转,避免"保存中"无限卡住的观感。
export async function createGear(
  formData: FormData
): Promise<GearActionResult> {
  const { supabase, user } = await requireUser();
  const payload = getGearPayload(formData);

  const { error } = await supabase.from("user_gear").insert({
    ...payload,
    user_id: user.id
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/gear");
  revalidatePath("/plan");

  return { ok: true, redirectTo: "/gear?saved=created" };
}

export async function updateGear(
  id: string,
  formData: FormData
): Promise<GearActionResult> {
  const { supabase, user } = await requireUser();
  const payload = getGearPayload(formData);

  const { data, error } = await supabase
    .from("user_gear")
    .update(payload)
    .eq("id", id)
    .eq("user_id", user.id)
    // 官方目录装备(product_id 非空)只读,不允许编辑;仅自己添加的可改
    .is("product_id", null)
    .select("id")
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }

  if (!data) {
    return { ok: false, error: "装備を保存できませんでした" };
  }

  revalidatePath("/dashboard");
  revalidatePath("/gear");
  revalidatePath("/plan");
  revalidatePath(`/gear/${id}/edit`);

  return { ok: true, redirectTo: "/gear?saved=updated" };
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
  revalidatePath("/plan");
  redirect("/gear?saved=deleted");
}

function getGearPayload(formData: FormData) {
  const officialWeight = toNumber(formData.get("official_weight_grams"));
  const msrp = toNumber(formData.get("msrp_jpy"));
  const storedWeight = officialWeight ?? 0;
  const brand = optionalString(formData.get("brand"));

  return {
    product_id: optionalString(formData.get("product_id")),
    category_id: String(formData.get("category_id") ?? ""),
    subcategory_id: optionalString(formData.get("subcategory_id")),
    name: String(formData.get("name") ?? "").trim(),
    brand: brand ? canonicalizeBrandName(brand) : null,
    model: optionalString(formData.get("model")),
    weight_grams: Math.max(0, Math.round(storedWeight)),
    official_weight_grams:
      officialWeight === null ? null : Math.max(0, Math.round(officialWeight)),
    measured_weight_grams: null,
    msrp_jpy: msrp === null ? null : Math.round(msrp),
    purchase_price_jpy: null,
    size: optionalString(formData.get("size")),
    volume: optionalString(formData.get("volume")),
    color: optionalString(formData.get("color")),
    material: optionalString(formData.get("material")),
    capacity: optionalString(formData.get("capacity")),
    official_url: optionalString(formData.get("official_url")),
    image_url: optionalString(formData.get("image_url")),
    image_storage_path: optionalString(formData.get("image_storage_path")),
    purchase_date: null,
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
