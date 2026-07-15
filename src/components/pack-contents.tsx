"use client";

import { PackagePlus } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { removePackItem } from "@/lib/actions/pack";
import { buildPackSummary, getPackItemWeightGrams } from "@/lib/pack-summary";
import type { UserGear } from "@/lib/types";
import { formatWeight } from "@/lib/utils/format";

import { PackRemoveButton } from "./pack-remove-button";

type PackContentsProps = {
  items: UserGear[];
};

const packSelectRoute = "/pack/select" as Route;

export function PackContents({ items: serverItems }: PackContentsProps) {
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
      const result = await removePackItem(item.id);
      removingIdsRef.current.delete(item.id);

      if (!result.ok) {
        setItems((current) => restorePackItem(current, item, snapshot));
        setError("パックから外せませんでした。もう一度お試しください。");
        return;
      }

      router.refresh();
    });
  }

  return (
    <>
      <section className="grid grid-cols-2 overflow-hidden rounded-2xl bg-white shadow-sm">
        <PackStat label="装備数" value={`${summary.itemCount.toLocaleString("ja-JP")}点`} />
        <PackStat
          label="総重量"
          value={summary.knownWeightG > 0 ? formatWeight(summary.knownWeightG) : "-"}
          divided
        />
      </section>

      {error ? (
        <p role="status" className="px-1 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}

      {items.length === 0 ? (
        <section className="rounded-2xl bg-white p-6 text-center shadow-sm">
          <PackagePlus aria-hidden className="mx-auto h-8 w-8 text-forest-700" />
          <h2 className="mt-4 text-lg font-bold text-ink">マイパックはまだ空です</h2>
          <p className="mt-2 text-sm leading-6 text-stone-500">
            装備庫からよく持っていく装備を追加すると、パック重量を確認できます。
          </p>
          <Link
            href={packSelectRoute}
            className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-forest-700 px-4 text-sm font-bold text-white transition active:scale-95"
          >
            装備庫から追加
          </Link>
        </section>
      ) : (
        <div className="space-y-5">
          {groups.map((group) => (
            <section key={group.id}>
              <h2 className="px-1 text-sm font-bold text-stone-600">{group.label}</h2>
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

function PackStat({
  label,
  value,
  divided = false
}: {
  label: string;
  value: string;
  divided?: boolean;
}) {
  return (
    <div className={`px-3 py-4 text-center ${divided ? "border-l border-stone-100" : ""}`}>
      <p className="font-din text-lg font-bold leading-none text-ink">{value}</p>
      <p className="mt-2 text-[10px] font-semibold text-stone-500">{label}</p>
    </div>
  );
}

function PackGearRow({ item, onRemove }: { item: UserGear; onRemove: () => void }) {
  const weightG = getPackItemWeightGrams(item);
  const detail = item.gear_subcategories?.name_ja ?? item.gear_categories?.name_ja ?? "その他";

  return (
    <article className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
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

function groupPackGearByCategory(items: UserGear[]) {
  const groups = new Map<string, { id: string; label: string; items: UserGear[] }>();

  for (const item of items) {
    const id = item.category_id;
    const label = item.gear_categories?.name_ja ?? "その他";
    const group = groups.get(id) ?? { id, label, items: [] };

    group.items.push(item);
    groups.set(id, group);
  }

  return Array.from(groups.values()).sort((a, b) => a.label.localeCompare(b.label, "ja"));
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
