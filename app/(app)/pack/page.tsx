import { PackagePlus } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { PackContents } from "@/components/pack-contents";
import { getMyPack } from "@/lib/data/pack";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const packSelectRoute = "/pack/select" as Route;

export default async function PackPage() {
  const pack = await getMyPack();

  return (
    <div className="space-y-5">
      <section className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-forest-700">パック管理</p>
          <h1 className="mt-1 text-[34px] font-bold leading-tight tracking-normal text-ink">
            マイパック
          </h1>
        </div>
        <Link
          href={packSelectRoute}
          className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-forest-700 px-4 text-sm font-bold text-white shadow-sm transition active:scale-95"
        >
          <PackagePlus aria-hidden className="h-5 w-5" />
          マイギアから追加
        </Link>
      </section>

      <PackContents items={pack.items} />
    </div>
  );
}
