import { AppMenuDrawer } from "@/components/app-menu-drawer";
import {
  PlanPageContent,
  type PlanPageContentProps
} from "@/components/plan-page-content";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// ホーム/ギア/マイページと同じ骨格。バンド safe+150 / カード -51 →
// カード上端 safe+99 で、タブを切り替えても上部がずれない。
// 中身(TripPlanningUI とチェックリスト)は触らず、外殻だけを合わせる。
export default function PlanPage(props: PlanPageContentProps) {
  return (
    <main className="plan-redesign brand-shell min-h-screen bg-[#E5EBE9] pb-32 text-ink">
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

      <div className="relative z-20 -mt-[51px] px-4">
        <PlanPageContent {...props} />
      </div>
    </main>
  );
}
