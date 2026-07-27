"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { canonicalizeBrandName } from "@/lib/brand-normalization";
import { requireUser } from "@/lib/data/gear";
import { getPlanReturnTo } from "@/lib/plan-return-to";
import type { GearActionResult, WeightType } from "@/lib/types";
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
  const returnTo = getReturnTo(formData);

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
  // 新規登録だけでは既存パックの内容は変わらない。選択画面だけ更新して、
  // パック本文を不要に無効化しない。
  revalidatePath("/pack/select");

  return { ok: true, redirectTo: returnTo ?? "/gear?saved=created" };
}

export async function updateGear(
  id: string,
  formData: FormData
): Promise<GearActionResult> {
  const { supabase, user } = await requireUser();
  const payload = getGearPayload(formData);
  const returnTo = getReturnTo(formData);

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
    return { ok: false, error: "ギアを保存できませんでした" };
  }

  revalidatePath("/dashboard");
  revalidatePath("/gear");
  revalidatePath("/plan");
  revalidatePath("/pack");
  revalidatePath("/pack/select");
  revalidatePath(`/gear/${id}/edit`);

  return { ok: true, redirectTo: returnTo ?? "/gear?saved=updated" };
}

// ギア詳細から、その場で写真だけを差し替える(追加・削除)。
// フルの編集フォームに飛ばず、詳細ページで完結させるための軽量版。
// 官方カタログ(product_id 非空)は読み取り専用なので触れない。
export async function updateGearImage(
  id: string,
  imageStoragePath: string | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from("user_gear")
    .update({ image_storage_path: imageStoragePath })
    .eq("id", id)
    .eq("user_id", user.id)
    .is("product_id", null)
    .select("id")
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }

  if (!data) {
    return { ok: false, error: "写真を更新できませんでした" };
  }

  revalidatePath("/dashboard");
  revalidatePath("/gear");
  revalidatePath(`/gear/${id}`);
  revalidatePath("/pack");

  return { ok: true };
}

export async function deleteGear(id: string, formData: FormData) {
  const { supabase, user } = await requireUser();
  const returnTo = getReturnTo(formData);

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
  revalidatePath("/pack");
  revalidatePath("/pack/select");
  redirect(returnTo ?? "/gear?saved=deleted");
}

function getGearPayload(formData: FormData) {
  const officialWeight = toNumber(formData.get("official_weight_grams"));
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
    official_url: optionalString(formData.get("official_url")),
    image_url: optionalString(formData.get("image_url")),
    image_storage_path: optionalString(formData.get("image_storage_path")),
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

function getReturnTo(formData: FormData) {
  const value = formData.get("returnTo");

  return getPlanReturnTo(typeof value === "string" ? value : null);
}
