import type { GearPickerProduct } from "@/lib/types";

type GearPickerCategoryRelation = NonNullable<
  GearPickerProduct["gear_categories"]
>;
type GearPickerSubcategoryRelation = NonNullable<
  GearPickerProduct["gear_subcategories"]
>;

// PostgREST returns a singular object for the product -> category foreign-key
// relationship. Older generated client types may still describe that embedded
// relation as an array, so normalize only this boundary before it reaches the UI.
export type SupabaseGearPickerProductRow = Omit<
  GearPickerProduct,
  "gear_categories" | "gear_subcategories"
> & {
  gear_categories?:
    | GearPickerCategoryRelation
    | GearPickerCategoryRelation[]
    | null;
  gear_subcategories?:
    | GearPickerSubcategoryRelation
    | GearPickerSubcategoryRelation[]
    | null;
};

export function normalizeGearPickerRelation<T>(
  relation: T | T[] | null | undefined
): T | null {
  return Array.isArray(relation) ? relation[0] ?? null : relation ?? null;
}

export function normalizeGearPickerProduct(
  product: SupabaseGearPickerProductRow
): GearPickerProduct {
  return {
    ...product,
    gear_categories: normalizeGearPickerRelation(product.gear_categories),
    gear_subcategories: normalizeGearPickerRelation(product.gear_subcategories)
  };
}

export function getGearPickerCategoryLabel(
  product: Pick<GearPickerProduct, "gear_categories">
) {
  return product.gear_categories?.name_ja ?? "その他";
}
