import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { GearForm } from "@/components/gear-form";
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
    <div className="space-y-5">
      <section className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-forest-700">新規登録</p>
          <h1 className="mt-1 text-[34px] font-bold leading-tight tracking-normal text-ink">
            ギアを追加
          </h1>
        </div>
        <Link
          href={buildGearHref("/gear", returnTo)}
          className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white text-stone-700 shadow-sm transition active:scale-95"
          aria-label="マイギアへ戻る"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
      </section>
      <GearForm
        categories={categories}
        subcategories={subcategories}
        products={products}
        action={createGear}
        error={params.error}
        returnTo={returnTo}
      />
    </div>
  );
}
