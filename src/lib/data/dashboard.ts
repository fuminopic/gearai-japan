import { requireUser } from "@/lib/data/gear";
import { buildPackSummary } from "@/lib/pack-summary";
import type { DashboardGear, DashboardSummary, UserGear } from "@/lib/types";

const DASHBOARD_GEAR_SELECT =
  "id,name,brand,model,image_url,image_storage_path,status,category_id,subcategory_id,weight_grams,official_weight_grams,weight_type,created_at,gear_categories:category_id(id,name_ja,name_en),gear_subcategories:subcategory_id(id,name_ja,name_en)";

type DashboardGearRelationRow = {
  id: string;
  name_ja: string;
  name_en: string;
};
type DashboardGearRow = DashboardGear &
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
    gearItems: ownedGear.map(toDashboardGear)
  };
}

function toDashboardGear(item: DashboardGearRow): DashboardGear {
  return {
    id: item.id,
    name: item.name,
    image_url: item.image_url,
    image_storage_path: item.image_storage_path,
    weight_grams: item.weight_grams
  };
}

// ギア1件につき1往復していたのを、createSignedUrls で1回にまとめる。
// ホームはカード列に owned 全件を出すので、件数がそのまま往復回数に
// なっていた。並び順と件数は入力のまま返す。
async function signDashboardGearImageUrls(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  gear: DashboardGearRow[]
) {
  const paths = Array.from(
    new Set(
      gear
        .map((item) => item.image_storage_path)
        .filter((path): path is string => Boolean(path))
    )
  );

  if (paths.length === 0) {
    return gear;
  }

  const { data } = await supabase.storage
    .from("gear-images")
    .createSignedUrls(paths, 60 * 60);

  const signedUrlByPath = new Map<string, string>();

  for (const entry of data ?? []) {
    if (entry.path && entry.signedUrl) {
      signedUrlByPath.set(entry.path, entry.signedUrl);
    }
  }

  return gear.map((item) => {
    const signedUrl = item.image_storage_path
      ? signedUrlByPath.get(item.image_storage_path)
      : undefined;

    return signedUrl ? { ...item, image_url: signedUrl } : item;
  });
}
