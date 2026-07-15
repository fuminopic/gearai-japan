import { getUserGear, requireUser } from "@/lib/data/gear";
import { buildPackSummary } from "@/lib/pack-summary";
import type { UserGear } from "@/lib/types";

type PackItemRow = {
  gear_id: string;
  added_at: string;
};

export type MyPack = {
  items: UserGear[];
  summary: ReturnType<typeof buildPackSummary>;
};

export async function getMyPack(): Promise<MyPack> {
  const { ownedGear, packGearIds } = await getPackSelectionData();
  const byId = new Map(ownedGear.map((item) => [item.id, item]));
  const items = packGearIds.flatMap((id) => {
    const item = byId.get(id);
    return item ? [item] : [];
  });

  return {
    items,
    summary: buildPackSummary(items)
  };
}

export async function getPackSelectionData() {
  const [ownedGear, packGearIds] = await Promise.all([
    getUserGear({ status: "owned" }),
    getPackGearIds()
  ]);

  return { ownedGear, packGearIds };
}

async function getPackGearIds() {
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
