"use client";

import { PackagePlus } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { removePackItem } from "@/lib/actions/pack";
import {
  getRetailGearCategory,
  MAJOR_GEAR_CATEGORIES
} from "@/lib/gear-major-categories";
import { buildPackSummary, getPackItemWeightGrams } from "@/lib/pack-summary";
import type { UserGear } from "@/lib/types";
import { formatWeight } from "@/lib/utils/format";

import { PackRemoveButton } from "./pack-remove-button";

type PackContentsProps = {
  addHref: Route;
  items: UserGear[];
};

const packSelectRoute = "/pack/select" as Route;

export function PackContents({ items: serverItems, addHref }: PackContentsProps) {
  const router = useRouter();
  const [items, setItems] = useState(serverItems);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const removingIdsRef = useRef(new Set<string>());
  const summary = useMemo(() => buildPackSummary(items), [items]);
  const groups = useMemo(() => groupPackGearByCategory(items), [items]);

  useEffect(() => {
    setItems(serverItems.filter((item) => !removingIdsRef.current.has(item.id)));
  }, [serverItems]);

  function removeItem(item: UserGear) {
    if (removingIdsRef.current.has(item.id)) {
      return;
    }

    const snapshot = items;
    removingIdsRef.current.add(item.id);
    setError(null);
    setItems((current) => current.filter((currentItem) => currentItem.id !== item.id));

    startTransition(async () => {
      // 圏外では Server Action の呼び出し自体が reject するので、
      // result を見るだけでは巻き戻せない(行が消えたまま戻らない)。
      try {
        const result = await removePackItem(item.id);

        if (!result.ok) {
          setItems((current) => restorePackItem(current, item, snapshot));
          setError("パックから外せませんでした。もう一度お試しください。");
          return;
        }

        router.refresh();
      } catch (caught) {
        console.error("Pack item removal failed:", caught);
        setItems((current) => restorePackItem(current, item, snapshot));
        setError("通信できませんでした。電波の良い場所で、もう一度お試しください。");
      } finally {
        removingIdsRef.current.delete(item.id);
      }
    });
  }

  return (
    <>
      <section className="rounded-[20px] bg-white px-5 pt-4 pb-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#EEEDE6] pb-3">
          <h1 className="text-base font-bold">マイパック</h1>
          <Link
            href={addHref}
            className="inline-flex h-8 items-center justify-center gap-1 rounded-xl bg-[#4E914A] px-4 text-[12px] font-bold leading-none text-white shadow-sm transition active:scale-95"
          >
            <PackagePlus aria-hidden className="h-3.5 w-3.5" />
            マイギアから追加
          </Link>
        </div>

        <div className="flex flex-row items-center justify-between pt-4">
          <PackStat
            iconSrc="/metric-count.png"
            label="ギア数"
            value={`${summary.itemCount.toLocaleString("ja-JP")}点`}
            divided
          />
          <PackStat
            iconSrc="/metric-weight.png"
            label="総重量"
            value={
              summary.knownWeightG > 0
                ? formatWeight(summary.knownWeightG, { compact: true })
                : "-"
            }
          />
        </div>
      </section>

      {error ? (
        <p role="status" className="px-1 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}

      {items.length === 0 ? (
        <section className="rounded-[20px] bg-white p-6 text-center shadow-sm">
          <PackagePlus aria-hidden className="mx-auto h-8 w-8 text-forest-700" />
          <h2 className="mt-4 text-lg font-bold text-ink">マイパックはまだ空です</h2>
          <p className="mt-2 text-sm leading-6 text-stone-500">
            マイギアからよく持っていくギアを追加すると、パック重量を確認できます。
          </p>
          <Link
            href={packSelectRoute}
            className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-[#14724e] px-5 text-sm font-bold text-white transition active:scale-95"
          >
            マイギアから追加
          </Link>
        </section>
      ) : (
        <div className="space-y-[11px]">
          {groups.map((group) => (
            <section key={group.id}>
              <h2 className="px-1 pt-1 text-base font-bold text-ink">{group.label}</h2>
              <div className="mt-2 space-y-2">
                {group.items.map((item) => (
                  <PackGearRow key={item.id} item={item} onRemove={() => removeItem(item)} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}

// マイギアの SummaryStat と同じ見た目(metric-*.png / font-din 22px / gray-400)。
function PackStat({
  iconSrc,
  label,
  value,
  divided = false
}: {
  iconSrc: string;
  label: string;
  value: string;
  divided?: boolean;
}) {
  return (
    <div
      className={`flex flex-1 flex-col items-center gap-2 px-1.5 pt-1 text-center max-[359px]:px-1 ${
        divided ? "border-r border-gray-100" : ""
      }`}
    >
      <div className="flex items-center gap-2 max-[389px]:gap-1.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={iconSrc}
          alt=""
          className="h-5 w-auto shrink-0 object-contain max-[389px]:h-4"
        />
        <p className="whitespace-nowrap font-din text-[22px] font-bold leading-none text-black max-[389px]:text-[19px] max-[359px]:text-[17px]">
          {value}
        </p>
      </div>
      <p className="whitespace-nowrap text-[11px] font-medium text-gray-400">{label}</p>
    </div>
  );
}

function PackGearRow({ item, onRemove }: { item: UserGear; onRemove: () => void }) {
  const weightG = getPackItemWeightGrams(item);
  const detail = item.gear_subcategories?.name_ja ?? item.gear_categories?.name_ja ?? "その他";

  return (
    <article className="flex items-center gap-3 rounded-[20px] bg-white px-4 py-3 shadow-sm">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-stone-50">
        {item.image_url ? (
          // Signed user storage URLs are not configured for the Next.js image optimizer.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image_url} alt="" className="h-full w-full object-contain mix-blend-multiply" />
        ) : (
          <PackagePlus aria-hidden className="h-6 w-6 text-stone-300" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-bold text-ink">{item.name}</h3>
        <p className="mt-1 truncate text-xs font-medium text-stone-500">{detail}</p>
        {weightG === null ? null : (
          <p className="mt-1 text-xs font-bold text-stone-600">{formatWeight(weightG)}</p>
        )}
      </div>
      <PackRemoveButton onRemove={onRemove} />
    </article>
  );
}

// マイギア画面と同じ6大分類・同じ並び順でまとめる。
//
// 以前は gear_categories.name_ja(DBの細かい分類)を五十音順に並べていたため、
// 同じギアがマイギアでは「安全・ナビ」、ここでは「電子機器」のように別の
// グループに入り、行き来すると見失っていた。ホームの「パック重量構成」の
// 凡例とも、これで一致する。表示のまとめ方だけで、DBの分類やチェックリスト
// の判定には影響しない。
function groupPackGearByCategory(items: UserGear[]) {
  const order = new Map<string, number>(
    MAJOR_GEAR_CATEGORIES.map((category, index) => [category.id, index])
  );
  const groups = new Map<
    string,
    { id: string; label: string; sortOrder: number; items: UserGear[] }
  >();

  for (const item of items) {
    const major = getRetailGearCategory(item);
    const id = major?.id ?? "other";
    const label = major?.label ?? "その他";
    const sortOrder = major ? (order.get(major.id) ?? MAJOR_GEAR_CATEGORIES.length) : Number.MAX_SAFE_INTEGER;
    const group = groups.get(id) ?? { id, label, sortOrder, items: [] };

    group.items.push(item);
    groups.set(id, group);
  }

  return Array.from(groups.values()).sort((a, b) => a.sortOrder - b.sortOrder);
}

function restorePackItem(current: UserGear[], item: UserGear, snapshot: UserGear[]) {
  if (current.some((currentItem) => currentItem.id === item.id)) {
    return current;
  }

  const currentIds = new Set(current.map((currentItem) => currentItem.id));
  const snapshotIds = new Set(snapshot.map((snapshotItem) => snapshotItem.id));

  return [
    ...snapshot.filter((snapshotItem) => currentIds.has(snapshotItem.id) || snapshotItem.id === item.id),
    ...current.filter((currentItem) => !snapshotIds.has(currentItem.id))
  ];
}
