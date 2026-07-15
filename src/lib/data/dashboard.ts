import { requireUser } from "@/lib/data/gear";
import { buildPackSummary } from "@/lib/pack-summary";
import type { DashboardRecentGear, DashboardSummary, UserGear } from "@/lib/types";

const DASHBOARD_GEAR_SELECT =
  "id,name,brand,model,image_url,image_storage_path,status,category_id,subcategory_id,weight_grams,official_weight_grams,weight_type,created_at,gear_categories:category_id(id,name_ja,name_en),gear_subcategories:subcategory_id(id,name_ja,name_en)";

type DashboardGearRelationRow = {
  id: string;
  name_ja: string;
  name_en: string;
};
type DashboardGearRow = DashboardRecentGear &
  Pick<
    UserGear,
    | "brand"
    | "model"
    | "status"
    | "weight_type"
    | "category_id"
    | "subcategory_id"
    | "official_weight_grams"
  > & {
    gear_categories?: UserGear["gear_categories"];
    gear_subcategories?: UserGear["gear_subcategories"];
  };
type SupabaseDashboardGearRow = Omit<
  DashboardGearRow,
  "gear_categories" | "gear_subcategories"
> & {
  gear_categories?: DashboardGearRelationRow[] | null;
  gear_subcategories?: DashboardGearRelationRow[] | null;
};

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const { supabase, user } = await requireUser();
  const [gearResult, packItemsResult] = await Promise.all([
    supabase
      .from("user_gear")
      .select(DASHBOARD_GEAR_SELECT)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("user_pack_items")
      .select("gear_id")
      .eq("user_id", user.id)
  ]);

  if (gearResult.error) {
    throw new Error(gearResult.error.message);
  }

  if (packItemsResult.error) {
    throw new Error(packItemsResult.error.message);
  }

  const rows = gearResult.data as SupabaseDashboardGearRow[] as DashboardGearRow[];
  const gear = await signDashboardGearImageUrls(supabase, rows);
  const ownedGear = gear.filter((item) => item.status === "owned");
  const packGearIds = new Set(
    (packItemsResult.data as Array<{ gear_id: string }>).map((item) => item.gear_id)
  );
  const packSummary = buildPackSummary(ownedGear.filter((item) => packGearIds.has(item.id)));

  return {
    totalCount: gear.length,
    ownedCount: ownedGear.length,
    wishlistCount: gear.filter((item) => item.status === "wishlist").length,
    packItemCount: packSummary.itemCount,
    packKnownWeightG: packSummary.knownWeightG,
    packWeightMissingCount: packSummary.missingWeightCount,
    packMajorCategoryCoverageCount: packSummary.majorCategoryCoverageCount,
    packMajorCategoryTotalCount: packSummary.majorCategoryTotalCount,
    packCategoryWeights: packSummary.categoryWeights,
    recentGear: gear.slice(0, 8).map(toDashboardRecentGear)
  };
}

function toDashboardRecentGear(item: DashboardGearRow): DashboardRecentGear {
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
  gear: DashboardGearRow[]
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
