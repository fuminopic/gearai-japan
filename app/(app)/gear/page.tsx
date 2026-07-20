import { AppMenuDrawer } from "@/components/app-menu-drawer";
import { GearList } from "@/components/gear-list";
import { Notice } from "@/components/ui/notice";
import { getUserGear, getUserGearBrands } from "@/lib/data/gear";
import { getPackGearIds } from "@/lib/data/pack";
import { buildPackSummary } from "@/lib/pack-summary";
import { buildGearHref, getPlanReturnTo } from "@/lib/plan-return-to";
import type { GearFilters, GearStatus } from "@/lib/types";

type GearPageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
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
    status: isGearStatus(params.status) ? params.status : "all",
    category: params.category,
    brand: params.brand,
    sort: isSort(params.sort) ? params.sort : "newest"
  };

  // パックは一覧の絞り込みに関係なく全体を見せる(行のスイッチと右下のバーは
  // 常に「パック全体」を指す)。
  //
  // ここで getMyPack() を呼ぶと、その中で getUserGear({ status: "owned" }) が
  // もう一度走り、下の summaryGear と完全に重複する(画像URLの署名まで二重)。
  // 軽い ID 取得だけにして、集計は取得済みの summaryGear から行う。
  const [brands, gear, summaryGear, packedGearIds] = await Promise.all([
    getUserGearBrands(),
    getUserGear(filters),
    getUserGear({ status: "owned" }),
    getPackGearIds()
  ]);
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

function isGearStatus(value?: string): value is GearStatus | "all" {
  return value === "owned" || value === "wishlist" || value === "all";
}

function isSort(value?: string): value is GearFilters["sort"] {
  return value === "newest" || value === "weight";
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
