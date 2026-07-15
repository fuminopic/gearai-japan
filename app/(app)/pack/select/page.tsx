import { ChevronLeft } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { PackGearSelector } from "@/components/pack-gear-selector";
import { getPackSelectionData } from "@/lib/data/pack";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const packRoute = "/pack" as Route;

export default async function PackSelectPage() {
  const { ownedGear, packGearIds } = await getPackSelectionData();

  return (
    <div className="space-y-5">
      <section className="flex items-end gap-3">
        <Link
          href={packRoute}
          aria-label="マイパックに戻る"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-stone-700 shadow-sm transition active:scale-95"
        >
          <ChevronLeft aria-hidden className="h-5 w-5" />
        </Link>
        <div>
          <p className="text-sm font-semibold text-forest-700">所有している装備</p>
          <h1 className="mt-1 text-[28px] font-bold leading-tight tracking-normal text-ink">
            マイパックに追加
          </h1>
        </div>
      </section>

      <PackGearSelector gear={ownedGear} packGearIds={packGearIds} />
    </div>
  );
}
