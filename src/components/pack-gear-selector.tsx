"use client";

import { Check, PackagePlus, Search } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { addPackItems } from "@/lib/actions/pack";
import { getPackItemWeightGrams } from "@/lib/pack-summary";
import type { UserGear } from "@/lib/types";
import { formatWeight } from "@/lib/utils/format";

type PackGearSelectorProps = {
  gear: UserGear[];
  packGearIds: string[];
};

export function PackGearSelector({ gear, packGearIds }: PackGearSelectorProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [selectedIds, setSelectedIds] = useState(() => new Set<string>());
  const [isPending, startTransition] = useTransition();
  const existingIds = useMemo(() => new Set(packGearIds), [packGearIds]);
  const categories = useMemo(() => getCategories(gear), [gear]);

  const filteredGear = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ja-JP");

    return gear.filter((item) => {
      const matchesCategory = categoryId === "all" || item.category_id === categoryId;
      const searchable = [item.name, item.brand, item.model]
        .filter((value): value is string => Boolean(value))
        .join(" ")
        .toLocaleLowerCase("ja-JP");

      return matchesCategory && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [categoryId, gear, query]);

  const selectedCount = selectedIds.size;

  function toggle(gearId: string) {
    if (existingIds.has(gearId)) {
      return;
    }

    setSelectedIds((current) => {
      const next = new Set(current);

      if (next.has(gearId)) {
        next.delete(gearId);
      } else {
        next.add(gearId);
      }

      return next;
    });
  }

  function addSelectedItems() {
    startTransition(async () => {
      const result = await addPackItems(Array.from(selectedIds));

      if (result.ok) {
        router.push("/pack" as Route);
      }
    });
  }

  if (gear.length === 0) {
    return (
      <section className="rounded-2xl bg-white p-6 text-center shadow-sm">
        <PackagePlus aria-hidden className="mx-auto h-8 w-8 text-forest-700" />
        <h2 className="mt-4 text-lg font-bold text-ink">追加できるギアがありません</h2>
        <p className="mt-2 text-sm leading-6 text-stone-500">
          まずはマイギアに所有しているギアを登録してください。
        </p>
        <Link
          href="/gear/new"
          className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-forest-700 px-4 text-sm font-bold text-white transition active:scale-95"
        >
          ギアを追加する
        </Link>
      </section>
    );
  }

  return (
    <div className="pb-32">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <label className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2">
          <Search aria-hidden className="h-5 w-5 shrink-0 text-stone-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="min-w-0 flex-1 bg-transparent py-1 text-base outline-none"
            placeholder="ギア名・ブランドで検索"
          />
        </label>

        <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1">
          <CategoryFilter
            label="すべて"
            active={categoryId === "all"}
            onClick={() => setCategoryId("all")}
          />
          {categories.map((category) => (
            <CategoryFilter
              key={category.id}
              label={category.label}
              active={categoryId === category.id}
              onClick={() => setCategoryId(category.id)}
            />
          ))}
        </div>
      </div>

      <p className="mt-5 px-1 text-sm font-semibold text-stone-500">
        {filteredGear.length.toLocaleString("ja-JP")}点を表示
      </p>

      <div className="mt-3 space-y-2">
        {filteredGear.map((item) => {
          const inPack = existingIds.has(item.id);
          const selected = selectedIds.has(item.id);
          const weightG = getPackItemWeightGrams(item);

          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={inPack || selected}
              disabled={inPack}
              onClick={() => toggle(item.id)}
              className={`flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-sm transition active:scale-[0.99] disabled:cursor-default ${
                selected ? "ring-2 ring-forest-600" : ""
              }`}
            >
              <GearThumbnail item={item} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-ink">{item.name}</span>
                <span className="mt-1 block truncate text-xs font-medium text-stone-500">
                  {getGearCategoryLabel(item)}
                </span>
                <span className="mt-1 block text-xs font-bold text-stone-600">
                  {weightG === null ? "重量未入力" : formatWeight(weightG)}
                </span>
              </span>
              {inPack ? (
                <span className="inline-flex h-7 shrink-0 items-center rounded-full bg-forest-50 px-3 text-xs font-bold text-forest-700">
                  選択済み
                </span>
              ) : (
                <span
                  aria-hidden
                  className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                    selected
                      ? "border-forest-700 bg-forest-700 text-white"
                      : "border-stone-300 text-transparent"
                  }`}
                >
                  <Check className="h-4 w-4" strokeWidth={2.5} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {filteredGear.length === 0 ? (
        <p className="mt-8 text-center text-sm font-medium text-stone-500">
          条件に合うギアがありません。
        </p>
      ) : null}

      <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+5rem)] z-40 px-4 md:left-24 md:bottom-6">
        <button
          type="button"
          disabled={selectedCount === 0 || isPending}
          onClick={addSelectedItems}
          className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-forest-700 px-4 text-sm font-bold text-white shadow-lg transition active:scale-[0.99] disabled:bg-stone-300"
        >
          {isPending ? "追加中..." : `選択した${selectedCount}点を追加`}
        </button>
      </div>
    </div>
  );
}

function CategoryFilter({
  label,
  active,
  onClick
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex h-9 shrink-0 items-center justify-center rounded-lg px-3 text-xs font-bold transition ${
        active ? "bg-forest-700 text-white" : "bg-stone-100 text-stone-600"
      }`}
    >
      {label}
    </button>
  );
}

function GearThumbnail({ item }: { item: UserGear }) {
  return (
    <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-stone-50">
      {item.image_url ? (
        <img src={item.image_url} alt="" className="h-full w-full object-contain mix-blend-multiply" />
      ) : (
        <PackagePlus aria-hidden className="h-6 w-6 text-stone-300" />
      )}
    </span>
  );
}

function getCategories(gear: UserGear[]) {
  const categories = new Map<string, string>();

  for (const item of gear) {
    categories.set(item.category_id, getGearCategoryLabel(item));
  }

  return Array.from(categories, ([id, label]) => ({ id, label })).sort((a, b) =>
    a.label.localeCompare(b.label, "ja")
  );
}

function getGearCategoryLabel(item: UserGear) {
  return item.gear_subcategories?.name_ja ?? item.gear_categories?.name_ja ?? "その他";
}
