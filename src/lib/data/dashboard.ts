import { requireUser } from "@/lib/data/gear";
import {
  getMajorGearCategoryCoverage,
  getRetailGearCategory
} from "@/lib/gear-major-categories";
import type { DashboardRecentGear, DashboardSummary, UserGear } from "@/lib/types";

const DASHBOARD_GEAR_SELECT =
  "id,name,brand,model,image_url,image_storage_path,status,category_id,subcategory_id,weight_grams,weight_type,created_at,gear_categories:category_id(id,name_ja,name_en),gear_subcategories:subcategory_id(id,name_ja,name_en)";

type DashboardGear = DashboardRecentGear &
  Pick<UserGear, "brand" | "model" | "status" | "weight_type" | "category_id" | "subcategory_id"> & {
    gear_categories?: UserGear["gear_categories"];
    gear_subcategories?: UserGear["gear_subcategories"];
  };

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const gear = await getDashboardGear();
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
    const architecture = getRetailGearCategory(item);
    const categoryId = architecture?.id ?? "other";
    const current = categoryWeights.get(categoryId) ?? {
      categoryId,
      nameJa: architecture?.label ?? "その他",
      weightG: 0,
      count: 0,
      sortOrder: architecture ? getCategorySortOrder(architecture.id) : Number.MAX_SAFE_INTEGER
    };

    current.weightG += Number(item.weight_grams ?? 0);
    current.count += 1;
    categoryWeights.set(categoryId, current);
  }

  const totalWeightG = sumWeight(ownedGear);
  const majorCategoryCoverage = getMajorGearCategoryCoverage(ownedGear);
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
    majorCategoryCoverageCount: majorCategoryCoverage.coveredCount,
    majorCategoryTotalCount: majorCategoryCoverage.totalCount,
    majorCategoryMissingLabels: majorCategoryCoverage.missingLabels,
    baseWeightG,
    consumableWeightG,
    wornWeightG,
    totalPackWeightG: baseWeightG + consumableWeightG,
    categoryWeights: Array.from(categoryWeights.values())
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(({ sortOrder, ...category }) => category),
    recentGear: gear.slice(0, 8).map(toDashboardRecentGear)
  };
}

async function getDashboardGear() {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("user_gear")
    .select(DASHBOARD_GEAR_SELECT)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return signDashboardGearImageUrls(supabase, data as unknown as DashboardGear[]);
}

function toDashboardRecentGear(item: DashboardGear): DashboardRecentGear {
  return {
    id: item.id,
    name: item.name,
    image_url: item.image_url,
    image_storage_path: item.image_storage_path,
    weight_grams: item.weight_grams
  };
}

async function signDashboardGearImageUrls(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  gear: DashboardGear[]
) {
  return Promise.all(
    gear.map(async (item) => {
      if (!item.image_storage_path) {
        return item;
      }

      const { data } = await supabase.storage
        .from("gear-images")
        .createSignedUrl(item.image_storage_path, 60 * 60);

      return {
        ...item,
        image_url: data?.signedUrl ?? item.image_url
      };
    })
  );
}

function sumWeight(items: DashboardGear[]) {
  return items.reduce((total, item) => total + Number(item.weight_grams ?? 0), 0);
}

function getCategorySortOrder(id: string) {
  const order = ["clothing", "backpack", "shoes", "tentSleep", "cooking", "safetyNav"];
  const index = order.indexOf(id);

  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}
