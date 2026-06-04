import { createClient } from "@/lib/supabase/server";
import type { DataQualitySummary, VerificationStatus } from "@/lib/types";

type ProductQualityRow = {
  msrp_jpy: number | null;
  official_weight_grams: number | null;
  weight_grams: number | null;
  official_url: string | null;
  category_id: string | null;
  verification_status: VerificationStatus | null;
};

export async function getDataQualitySummary(): Promise<DataQualitySummary> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gear_products")
    .select(
      "msrp_jpy, official_weight_grams, weight_grams, official_url, category_id, verification_status"
    );

  if (error) {
    throw new Error(error.message);
  }

  const products = (data ?? []) as ProductQualityRow[];

  return {
    missingMsrpCount: products.filter((product) => product.msrp_jpy === null)
      .length,
    missingWeightCount: products.filter(
      (product) =>
        product.official_weight_grams === null && product.weight_grams === null
    ).length,
    missingOfficialUrlCount: products.filter(
      (product) => !product.official_url
    ).length,
    missingCategoryCount: products.filter((product) => !product.category_id)
      .length,
    unverifiedCount: products.filter(
      (product) => product.verification_status !== "verified"
    ).length
  };
}
