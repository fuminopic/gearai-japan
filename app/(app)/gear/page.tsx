import Link from "next/link";
import { Plus } from "lucide-react";

import { GearList } from "@/components/gear-list";
import { getGearCategories, getUserGear, getUserGearBrands } from "@/lib/data/gear";
import type { GearFilters, GearStatus } from "@/lib/types";

type GearPageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    category?: string;
    brand?: string;
    sort?: string;
    error?: string;
    saved?: string;
  }>;
};

export default async function GearPage({ searchParams }: GearPageProps) {
  const params = await searchParams;
  const filters: GearFilters = {
    q: params.q,
    status: isGearStatus(params.status) ? params.status : "all",
    category: params.category,
    brand: params.brand,
    sort: isSort(params.sort) ? params.sort : "newest"
  };

  const [categories, brands, gear, summaryGear] = await Promise.all([
    getGearCategories(),
    getUserGearBrands(),
    getUserGear(filters),
    getUserGear({ status: "owned" })
  ]);
  const savedMessage = getSavedMessage(params.saved);

  return (
    <div className="space-y-5">
      <section className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-forest-700">装備管理</p>
          <h1 className="mt-1 text-[34px] font-bold leading-tight tracking-normal text-ink">
            マイ装備
          </h1>
        </div>
        <Link
          href="/gear/new"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-forest-700 px-4 text-sm font-bold text-white shadow-sm transition active:scale-95"
          aria-label="装備を追加"
        >
          <Plus className="h-5 w-5" />
          追加
        </Link>
      </section>

      {params.error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {params.error}
        </p>
      ) : null}

      {savedMessage && !params.error ? (
        <p className="rounded-lg border border-forest-100 bg-forest-50 px-4 py-3 text-sm font-semibold text-forest-800">
          {savedMessage}
        </p>
      ) : null}

      <GearList
        gear={gear}
        summaryGear={summaryGear}
        categories={categories}
        brands={brands}
        filters={filters}
      />
    </div>
  );
}

function isGearStatus(value?: string): value is GearStatus | "all" {
  return value === "owned" || value === "wishlist" || value === "all";
}

function isSort(value?: string): value is GearFilters["sort"] {
  return value === "newest" || value === "weight";
}

function getSavedMessage(value?: string) {
  if (value === "created") {
    return "装備を登録しました";
  }

  if (value === "updated") {
    return "装備を更新しました";
  }

  if (value === "deleted") {
    return "装備を削除しました";
  }

  return null;
}
