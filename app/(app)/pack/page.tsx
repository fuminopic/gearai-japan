import type { Route } from "next";

import { AppMenuDrawer } from "@/components/app-menu-drawer";
import { PackContents } from "@/components/pack-contents";
import { getMyPack } from "@/lib/data/pack";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const packSelectRoute = "/pack/select" as Route;

export default async function PackPage() {
  const pack = await getMyPack();

  // 他の画面と同じ骨格。バンド safe+150 / カード -51 → カード上端 safe+99。
  // 見出しと「マイギアから追加」は、マイギアと同じくカードの中へ移す
  // (34px の大見出し + eyebrow はこの画面にだけ残っていた)。
  return (
    <main className="pack-redesign brand-shell min-h-screen bg-[#E5EBE9] pb-32 text-ink">
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
        <PackContents
          items={pack.items}
          foodWaterWeightG={pack.foodWaterWeightG}
          addHref={packSelectRoute}
        />
      </div>
    </main>
  );
}
