import { redirect } from "next/navigation";

import { GearForm } from "@/components/gear-form";
import { updateGear } from "@/lib/actions/gear";
import {
  getGearCategories,
  getGearProducts,
  getGearSubcategories,
  getUserGearById
} from "@/lib/data/gear";
import { buildGearHref, getPlanReturnTo } from "@/lib/plan-return-to";

type EditGearPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string;
    returnTo?: string;
  }>;
};

export default async function EditGearPage({
  params,
  searchParams
}: EditGearPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const returnTo = getPlanReturnTo(query.returnTo);
  const [categories, subcategories, products, gear] = await Promise.all([
    getGearCategories(),
    getGearSubcategories(),
    getGearProducts(),
    getUserGearById(id)
  ]);

  // 官方目录装备只读:不允许编辑,跳回详细页。自己添加的(product_id 为空)才可编辑。
  if (gear.gear_products) {
    redirect(buildGearHref(`/gear/${id}`, returnTo));
  }

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
        returnTo={returnTo}
      />
    </div>
  );
}
