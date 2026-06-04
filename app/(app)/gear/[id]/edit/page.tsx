import { GearForm } from "@/components/gear-form";
import { updateGear } from "@/lib/actions/gear";
import {
  getGearCategories,
  getGearProducts,
  getGearSubcategories,
  getUserGearById
} from "@/lib/data/gear";

type EditGearPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function EditGearPage({
  params,
  searchParams
}: EditGearPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [categories, subcategories, products, gear] = await Promise.all([
    getGearCategories(),
    getGearSubcategories(),
    getGearProducts(),
    getUserGearById(id)
  ]);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-forest-700">装備編集</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink">装備を編集</h1>
      </div>
      <GearForm
        categories={categories}
        subcategories={subcategories}
        products={products}
        gear={gear}
        action={updateGear.bind(null, id)}
        error={query.error}
      />
    </div>
  );
}
