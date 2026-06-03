import Link from "next/link";

import { GearList } from "@/components/gear-list";
import { getGearCategories, getUserGear } from "@/lib/data/gear";
import type { GearFilters, GearStatus } from "@/lib/types";

type GearPageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    category?: string;
    sort?: string;
    error?: string;
  }>;
};

export default async function GearPage({ searchParams }: GearPageProps) {
  const params = await searchParams;
  const filters: GearFilters = {
    q: params.q,
    status: isGearStatus(params.status) ? params.status : "all",
    category: params.category,
    sort: isSort(params.sort) ? params.sort : "newest"
  };

  const [categories, gear] = await Promise.all([
    getGearCategories(),
    getUserGear(filters)
  ]);

  return (
    <div className="space-y-5">
      <section className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-forest-700">装備管理</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink">装備</h1>
        </div>
        <Link
          href="/gear/new"
          className="rounded-lg bg-forest-700 px-5 py-3 text-sm font-semibold text-white"
        >
          追加
        </Link>
      </section>

      {params.error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {params.error}
        </p>
      ) : null}

      <GearList gear={gear} categories={categories} filters={filters} />
    </div>
  );
}

function isGearStatus(value?: string): value is GearStatus | "all" {
  return value === "owned" || value === "wishlist" || value === "all";
}

function isSort(value?: string): value is GearFilters["sort"] {
  return value === "newest" || value === "weight" || value === "price";
}
