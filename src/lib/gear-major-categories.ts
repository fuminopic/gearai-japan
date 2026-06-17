import type { UserGear } from "@/lib/types";

export const MAJOR_GEAR_CATEGORIES = [
  {
    id: "backpack",
    label: "バックパック",
    categoryAliases: ["backpack", "backpacking", "carry"]
  },
  {
    id: "shelter",
    label: "テント・シェルター",
    categoryAliases: ["shelter"]
  },
  {
    id: "sleep",
    label: "寝具",
    categoryAliases: ["sleep", "sleeping"]
  },
  {
    id: "cooking",
    label: "クッキング",
    categoryAliases: ["cooking"]
  },
  {
    id: "clothing",
    label: "ウェア",
    categoryAliases: ["clothing", "rainwear"]
  },
  {
    id: "electronics",
    label: "電子機器",
    categoryAliases: ["electronics", "navigation"]
  }
] as const;

export type MajorGearCategoryId = (typeof MAJOR_GEAR_CATEGORIES)[number]["id"];

export type MajorGearCategoryCoverage = {
  coveredIds: MajorGearCategoryId[];
  missingIds: MajorGearCategoryId[];
  coveredLabels: string[];
  missingLabels: string[];
  coveredCount: number;
  totalCount: number;
};

type GearCategoryLike = Pick<UserGear, "category_id"> & {
  gear_categories?: Pick<NonNullable<UserGear["gear_categories"]>, "name_en"> | null;
};

export function getMajorGearCategoryCoverage(
  gear: readonly GearCategoryLike[]
): MajorGearCategoryCoverage {
  const coveredIds = new Set<MajorGearCategoryId>();

  for (const item of gear) {
    const matched = getMajorGearCategoryId(item);

    if (matched) {
      coveredIds.add(matched);
    }
  }

  const covered = MAJOR_GEAR_CATEGORIES.filter((category) =>
    coveredIds.has(category.id)
  );
  const missing = MAJOR_GEAR_CATEGORIES.filter(
    (category) => !coveredIds.has(category.id)
  );

  return {
    coveredIds: covered.map((category) => category.id),
    missingIds: missing.map((category) => category.id),
    coveredLabels: covered.map((category) => category.label),
    missingLabels: missing.map((category) => category.label),
    coveredCount: covered.length,
    totalCount: MAJOR_GEAR_CATEGORIES.length
  };
}

function getMajorGearCategoryId(item: GearCategoryLike) {
  const candidates = [item.category_id, item.gear_categories?.name_en]
    .filter((value): value is string => Boolean(value))
    .map(normalizeCategoryKey);

  for (const category of MAJOR_GEAR_CATEGORIES) {
    if (
      category.categoryAliases.some((alias) =>
        candidates.includes(normalizeCategoryKey(alias))
      )
    ) {
      return category.id;
    }
  }

  return null;
}

function normalizeCategoryKey(value: string) {
  return value.toLowerCase().replace(/[\s_-]+/g, "");
}
