import { GearForm } from "@/components/gear-form";
import { createGear } from "@/lib/actions/gear";
import {
  getGearCategories,
  getGearProducts,
  getGearSubcategories
} from "@/lib/data/gear";

type NewGearPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function NewGearPage({ searchParams }: NewGearPageProps) {
  const [params, categories, subcategories, products] = await Promise.all([
    searchParams,
    getGearCategories(),
    getGearSubcategories(),
    getGearProducts()
  ]);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-forest-700">新規登録</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink">装備を追加</h1>
      </div>
      <GearForm
        categories={categories}
        subcategories={subcategories}
        products={products}
        action={createGear}
        error={params.error}
      />
    </div>
  );
}
