import type { DashboardSummary, UserGear } from "@/lib/types";
import { getUserGear } from "@/lib/data/gear";

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const gear = await getUserGear();
  const ownedGear = gear.filter((item) => item.status === "owned");

  const categoryWeights = new Map<
    string,
    { categoryId: string; nameJa: string; weightG: number; count: number }
  >();

  for (const item of ownedGear) {
    const categoryId = item.category_id;
    const current = categoryWeights.get(categoryId) ?? {
      categoryId,
      nameJa: item.gear_categories?.name_ja ?? "その他",
      weightG: 0,
      count: 0
    };

    current.weightG += Number(item.weight_g ?? 0);
    current.count += 1;
    categoryWeights.set(categoryId, current);
  }

  const totalWeightG = sumWeight(ownedGear);
  const totalValueJpy = ownedGear.reduce((total, item) => {
    return total + Number(item.price_jpy ?? 0);
  }, 0);

  return {
    totalCount: gear.length,
    ownedCount: ownedGear.length,
    wishlistCount: gear.filter((item) => item.status === "wishlist").length,
    totalWeightG,
    totalValueJpy,
    baseWeightG: sumWeight(ownedGear.filter((item) => item.weight_type === "base")),
    consumableWeightG: sumWeight(
      ownedGear.filter((item) => item.weight_type === "consumable")
    ),
    wornWeightG: sumWeight(ownedGear.filter((item) => item.weight_type === "worn")),
    categoryWeights: Array.from(categoryWeights.values()).sort(
      (a, b) => b.weightG - a.weightG
    ),
    recentGear: gear.slice(0, 5)
  };
}

function sumWeight(items: UserGear[]) {
  return items.reduce((total, item) => total + Number(item.weight_g ?? 0), 0);
}

