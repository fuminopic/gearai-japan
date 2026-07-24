import { redirect } from "next/navigation";

import { GearForm } from "@/components/gear-form";
import { PageShell } from "@/components/ui/page-shell";
import { updateGear } from "@/lib/actions/gear";
import {
  getGearCategories,
  getGearProductsForPicker,
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
    getGearProductsForPicker(),
    getUserGearById(id)
  ]);

  // 官方目录装备只读:不允许编辑,跳回详细页。自己添加的(product_id 为空)才可编辑。
  if (gear.gear_products) {
    redirect(buildGearHref(`/gear/${id}`, returnTo));
  }

  return (
    <PageShell
      backHref={buildGearHref(`/gear/${id}`, returnTo)}
      backLabel="ギア詳細へ戻る"
      eyebrow="ギア編集"
      title="ギアを編集"
    >
      <GearForm
        categories={categories}
        subcategories={subcategories}
        products={products}
        gear={gear}
        action={updateGear.bind(null, id)}
        error={query.error}
        returnTo={returnTo}
      />
    </PageShell>
  );
}
