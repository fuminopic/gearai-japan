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

    current.weightG += Number(item.weight_grams ?? 0);
    current.count += 1;
    categoryWeights.set(categoryId, current);
  }

  const totalWeightG = sumWeight(ownedGear);
  const totalMsrpJpy = ownedGear.reduce((total, item) => {
    return total + Number(item.msrp_jpy ?? 0);
  }, 0);
  const totalPurchaseJpy = ownedGear.reduce((total, item) => {
    return total + Number(item.purchase_price_jpy ?? 0);
  }, 0);
  const savingsJpy = Math.max(0, totalMsrpJpy - totalPurchaseJpy);
  const savingsRate = totalMsrpJpy > 0 ? savingsJpy / totalMsrpJpy : 0;
  const baseWeightG = sumWeight(ownedGear.filter((item) => item.weight_type === "base"));
  const consumableWeightG = sumWeight(
    ownedGear.filter((item) => item.weight_type === "consumable")
  );
  const wornWeightG = sumWeight(ownedGear.filter((item) => item.weight_type === "worn"));

  return {
    totalCount: gear.length,
    ownedCount: ownedGear.length,
    wishlistCount: gear.filter((item) => item.status === "wishlist").length,
    totalWeightG,
    totalMsrpJpy,
    totalPurchaseJpy,
    savingsJpy,
    savingsRate,
    baseWeightG,
    consumableWeightG,
    wornWeightG,
    totalPackWeightG: baseWeightG + consumableWeightG,
    categoryWeights: Array.from(categoryWeights.values()).sort(
      (a, b) => b.weightG - a.weightG
    ),
    recentGear: gear.slice(0, 5)
  };
}

function sumWeight(items: UserGear[]) {
  return items.reduce((total, item) => total + Number(item.weight_grams ?? 0), 0);
}
