
import { GearForm } from "@/components/gear-form";
import { PageShell } from "@/components/ui/page-shell";
import { createGear } from "@/lib/actions/gear";
import {
  getGearCategories,
  getGearProducts,
  getGearSubcategories
} from "@/lib/data/gear";
import { buildGearHref, getPlanReturnTo } from "@/lib/plan-return-to";

type NewGearPageProps = {
  searchParams: Promise<{
    error?: string;
    returnTo?: string;
  }>;
};

export default async function NewGearPage({ searchParams }: NewGearPageProps) {
  const [params, categories, subcategories, products] = await Promise.all([
    searchParams,
    getGearCategories(),
    getGearSubcategories(),
    getGearProducts()
  ]);
  const returnTo = getPlanReturnTo(params.returnTo);

  return (
    <PageShell
      backHref={buildGearHref("/gear", returnTo)}
      backLabel="マイギアへ戻る"
      eyebrow="新規登録"
      title="ギアを追加"
    >
      <GearForm
        categories={categories}
        subcategories={subcategories}
        products={products}
        action={createGear}
        error={params.error}
        returnTo={returnTo}
      />
    </PageShell>
  );
}
