import type { DashboardSummary, UserGear } from "@/lib/types";
import { getUserGear } from "@/lib/data/gear";

const CATEGORY_ARCHITECTURE = {
  backpack: { categoryId: "backpack", nameJa: "背負システム", sortOrder: 10 },
  backpacking: { categoryId: "backpack", nameJa: "背負システム", sortOrder: 10 },
  carry: { categoryId: "backpack", nameJa: "背負システム", sortOrder: 10 },
  shelter: { categoryId: "shelter", nameJa: "シェルター", sortOrder: 20 },
  sleep: { categoryId: "sleep", nameJa: "睡眠システム", sortOrder: 30 },
  sleeping: { categoryId: "sleep", nameJa: "睡眠システム", sortOrder: 30 },
  cooking: { categoryId: "cooking", nameJa: "クッキング", sortOrder: 40 },
  clothing: { categoryId: "clothing", nameJa: "ウェア", sortOrder: 50 },
  rainwear: { categoryId: "clothing", nameJa: "ウェア", sortOrder: 50 },
  electronics: { categoryId: "electronics", nameJa: "電子機器", sortOrder: 60 },
  navigation: { categoryId: "electronics", nameJa: "電子機器", sortOrder: 60 },
  first_aid: { categoryId: "first_aid", nameJa: "応急処置", sortOrder: 70 },
  safety: { categoryId: "first_aid", nameJa: "応急処置", sortOrder: 70 },
  bear_safety: { categoryId: "bear_safety", nameJa: "熊対策", sortOrder: 80 },
  hydration: { categoryId: "other", nameJa: "その他", sortOrder: 90 },
  other: { categoryId: "other", nameJa: "その他", sortOrder: 90 }
} as const;

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const gear = await getUserGear();
  const ownedGear = gear.filter((item) => item.status === "owned");

  const categoryWeights = new Map<
    string,
    {
      categoryId: string;
      nameJa: string;
      weightG: number;
      count: number;
      sortOrder: number;
    }
  >();

  for (const item of ownedGear) {
    const architecture = getCategoryArchitecture(item);
    const categoryId = architecture.categoryId;
    const current = categoryWeights.get(categoryId) ?? {
      categoryId,
      nameJa: architecture.nameJa,
      weightG: 0,
      count: 0,
      sortOrder: architecture.sortOrder
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
  const savingsJpy = totalMsrpJpy - totalPurchaseJpy;
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
    categoryWeights: Array.from(categoryWeights.values())
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(({ sortOrder, ...category }) => category),
    recentGear: gear.slice(0, 5)
  };
}

function sumWeight(items: UserGear[]) {
  return items.reduce((total, item) => total + Number(item.weight_grams ?? 0), 0);
}

function getCategoryArchitecture(item: UserGear) {
  const key = item.gear_categories?.name_en ?? "other";

  return (
    CATEGORY_ARCHITECTURE[key as keyof typeof CATEGORY_ARCHITECTURE] ??
    CATEGORY_ARCHITECTURE.other
  );
}
