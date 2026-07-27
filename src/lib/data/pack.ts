import { getUserGear, requireUser } from "@/lib/data/gear";
import { getLatestTripPlan } from "@/lib/data/trip-plans";
import { getPlanFoodWater, getPlanFoodWaterWeightG } from "@/lib/plan-food-water";
import { buildPackSummary } from "@/lib/pack-summary";
import type { UserGear } from "@/lib/types";

type PackItemRow = {
  gear_id: string;
  added_at: string;
};

export type MyPack = {
  items: UserGear[];
  summary: ReturnType<typeof buildPackSummary>;
  foodWaterWeightG: number;
};

export async function getMyPack(): Promise<MyPack> {
  const [{ ownedGear, packGearIds }, latestPlan] = await Promise.all([
    getPackSelectionData(),
    getLatestTripPlan()
  ]);
  const byId = new Map(ownedGear.map((item) => [item.id, item]));
  const items = packGearIds.flatMap((id) => {
    const item = byId.get(id);
    return item ? [item] : [];
  });

  return {
    items,
    summary: buildPackSummary(items),
    // マイパックと同じ「最新の保存済み山行」を現在の計画として扱う。
    // 消費物は user_pack_items には追加せず、総重量のレイヤーとしてだけ合算する。
    foodWaterWeightG: getPlanFoodWaterWeightG(getPlanFoodWater(latestPlan))
  };
}

export async function getPackSelectionData() {
  const [ownedGear, packGearIds] = await Promise.all([
    getUserGear(),
    getPackGearIds()
  ]);

  return { ownedGear, packGearIds };
}

export async function getPackGearIds() {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("user_pack_items")
    .select("gear_id, added_at")
    .eq("user_id", user.id)
    .order("added_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data as PackItemRow[]).map((item) => item.gear_id);
}
