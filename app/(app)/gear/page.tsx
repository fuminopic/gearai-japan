import { AppMenuDrawer } from "@/components/app-menu-drawer";
import { GearList } from "@/components/gear-list";
import { Notice } from "@/components/ui/notice";
import { getUserGear, getUserGearBrands } from "@/lib/data/gear";
import { getPackGearIds } from "@/lib/data/pack";
import { buildPackSummary } from "@/lib/pack-summary";
import { buildGearHref, getPlanReturnTo } from "@/lib/plan-return-to";
import type { GearFilters } from "@/lib/types";

type GearPageProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    brand?: string;
    sort?: string;
    returnTo?: string;
    error?: string;
    saved?: string;
  }>;
};

export default async function GearPage({ searchParams }: GearPageProps) {
  const params = await searchParams;
  const filters: GearFilters = {
    q: params.q,
    category: params.category,
    brand: params.brand,
    sort: isSort(params.sort) ? params.sort : "newest"
  };
  const needsSeparateGearSummary = hasPartialGearFilters(filters);

  // パックは一覧の絞り込みに関係なく全体を見せる(行のスイッチと右下のバーは
  // 常に「パック全体」を指す)。
  //
  // 一覧がマイギア全件なら同じ取得結果で集計し、検索・カテゴリー・ブランドで
  // 部分集合になる時だけ全件を別途読む。パックの所属は軽い ID 取得だけで十分。
  const [brands, gear, separateGear, packedGearIds] = await Promise.all([
    getUserGearBrands(),
    getUserGear(filters),
    needsSeparateGearSummary ? getUserGear() : Promise.resolve(null),
    getPackGearIds()
  ]);
  const summaryGear = separateGear ?? gear;
  const packedIdSet = new Set(packedGearIds);
  const packSummary = buildPackSummary(
    summaryGear.filter((item) => packedIdSet.has(item.id))
  );
  const savedMessage = getSavedMessage(params.saved);
  const returnTo = getPlanReturnTo(params.returnTo);

  // ホーム画面と同じ見た目の骨格にする: 緑のバンド → その上にカードを重ねる
  // → カードは rounded-[20px] / 間隔 11px。以前はここだけ白背景に 34px の
  // 見出しと eyebrow が乗っていて、別アプリのように見えていた。
  return (
    <main className="gear-redesign brand-shell min-h-screen bg-[#E5EBE9] pb-32 text-ink">
      {/* ロゴとメニューの位置、そしてカードが始まる Y 座標をホームと一致させる。
          ホーム: バンド safe+206 / カード -107 → カード上端 safe+99。
          ここ:   バンド safe+150 / カード -51  → カード上端 safe+99。
          こうするとタブを切り替えても上部がずれない(バンドは56px短い)。 */}
      <header
        className="relative z-10 flex w-full items-start justify-between bg-gradient-to-br from-[#1F7950] to-[#81AB44] px-4 pt-[max(env(safe-area-inset-top),20px)]"
        style={{ minHeight: "calc(max(env(safe-area-inset-top), 20px) + 150px)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/yamajitaku-wordmark-white.png"
          alt="山支度 YAMAJITAKU"
          className="mt-[42px] h-10 w-auto select-none object-contain"
        />
        <AppMenuDrawer buttonClassName="-mr-2 mt-[42px] inline-flex h-10 w-10 items-center justify-center rounded-xl text-white transition-transform active:scale-95" />
      </header>

      <div className="relative z-20 -mt-[51px] space-y-[11px] px-4">
        {params.error ? <Notice tone="error">{params.error}</Notice> : null}

        {savedMessage && !params.error ? (
          <Notice tone="success" className="border border-forest-100">
            {savedMessage}
          </Notice>
        ) : null}

        <GearList
          addHref={buildGearHref("/gear/new", returnTo)}
          packedGearIds={packedGearIds}
          packItemCount={packSummary.itemCount}
          packKnownWeightG={packSummary.knownWeightG}
          gear={gear}
          summaryGear={summaryGear}
          brands={brands}
          filters={filters}
          returnTo={returnTo}
        />
      </div>
    </main>
  );
}

function isSort(value?: string): value is GearFilters["sort"] {
  return value === "newest" || value === "weight";
}

function hasPartialGearFilters(filters: GearFilters) {
  return Boolean(
    filters.q?.trim() ||
      filters.category ||
      filters.brand
  );
}

function getSavedMessage(value?: string) {
  if (value === "created") {
    return "ギアを登録しました";
  }

  if (value === "updated") {
    return "ギアを更新しました";
  }

  if (value === "deleted") {
    return "ギアを削除しました";
  }

  return null;
}
