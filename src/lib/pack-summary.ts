import {
  getMajorGearCategoryCoverage,
  getRetailGearCategory
} from "@/lib/gear-major-categories";
import type { UserGear } from "@/lib/types";

type PackGear = Pick<
  UserGear,
  | "id"
  | "name"
  | "brand"
  | "model"
  | "category_id"
  | "subcategory_id"
  | "weight_grams"
  | "official_weight_grams"
  | "gear_categories"
  | "gear_subcategories"
>;

export type PackCategoryWeight = {
  categoryId: string;
  nameJa: string;
  weightG: number;
  count: number;
};

export type PackSummary = {
  itemCount: number;
  knownWeightG: number;
  missingWeightCount: number;
  majorCategoryCoverageCount: number;
  majorCategoryTotalCount: number;
  categoryWeights: PackCategoryWeight[];
};

export function getPackItemWeightGrams(item: Pick<PackGear, "weight_grams" | "official_weight_grams">) {
  if (typeof item.official_weight_grams === "number") {
    return item.official_weight_grams;
  }

  return item.weight_grams > 0 ? item.weight_grams : null;
}

export function buildPackSummary(items: readonly PackGear[]): PackSummary {
  const categoryWeights = new Map<string, PackCategoryWeight>();
  let knownWeightG = 0;
  let missingWeightCount = 0;

  for (const item of items) {
    const weightG = getPackItemWeightGrams(item);

    if (weightG === null) {
      missingWeightCount += 1;
      continue;
    }

    knownWeightG += weightG;
    const architecture = getRetailGearCategory(item);
    const categoryId = architecture?.id ?? "other";
    const current = categoryWeights.get(categoryId) ?? {
      categoryId,
      nameJa: architecture?.label ?? "その他",
      weightG: 0,
      count: 0
    };

    current.weightG += weightG;
    current.count += 1;
    categoryWeights.set(categoryId, current);
  }

  const coverage = getMajorGearCategoryCoverage(items);

  return {
    itemCount: items.length,
    knownWeightG,
    missingWeightCount,
    majorCategoryCoverageCount: coverage.coveredCount,
    majorCategoryTotalCount: coverage.totalCount,
    categoryWeights: Array.from(categoryWeights.values())
  };
}
