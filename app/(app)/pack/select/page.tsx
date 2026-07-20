import type { Route } from "next";

import { PackGearSelector } from "@/components/pack-gear-selector";
import { PageHeader } from "@/components/ui/page-header";
import { getPackSelectionData } from "@/lib/data/pack";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const packRoute = "/pack" as Route;

export default async function PackSelectPage() {
  const { ownedGear, packGearIds } = await getPackSelectionData();

  return (
    <div className="space-y-5">
      <PageHeader
        backHref={packRoute}
        backLabel="マイパックへ戻る"
        eyebrow="所有しているギア"
        title="マイパックに追加"
      />

      <PackGearSelector gear={ownedGear} packGearIds={packGearIds} />
    </div>
  );
}
