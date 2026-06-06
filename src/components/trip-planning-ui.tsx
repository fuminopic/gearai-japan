import { AlertTriangle, Check, PackageCheck, PackageX, X } from "lucide-react";

import { TripPlanningForm } from "@/components/trip-planning-form";
import {
  categoryLabels,
  gearMatchingConfidenceLabels,
  gearSubcategoryLabels,
  mountainFoundationSeasonLabels,
  mountainFoundationStyleLabels,
  planningSystemLabels,
  requirementSlotLabels
} from "@/lib/i18n/labels";
import type {
  GearMatchingDatabaseGearMatch,
  GearMatchingOwnedGearMatch,
  GearMatchingResult,
  MountainFoundationProfile,
  MountainFoundationSeason,
  MountainFoundationStyle,
  PackRequirementPlan,
  PackRequirementSlotPlan,
  RequirementSlot
} from "@/lib/types";

type TripPlanningUIProps = {
  mountains: MountainFoundationProfile[];
  selectedMountainSlug: string;
  selectedSeason: MountainFoundationSeason;
  selectedStyle: MountainFoundationStyle;
  plan?: PackRequirementPlan;
  compatibilityBySlot?: Partial<Record<RequirementSlot, GearMatchingResult>>;
  error?: string;
};

export function TripPlanningUI({
  mountains,
  selectedMountainSlug,
  selectedSeason,
  selectedStyle,
  plan,
  compatibilityBySlot = {},
  error
}: TripPlanningUIProps) {
  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold text-forest-700">山行計画</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink">
            パック計画
          </h1>
        </div>
      </section>

      <TripPlanningForm
        mountains={mountains}
        selectedMountainSlug={selectedMountainSlug}
        selectedSeason={selectedSeason}
        selectedStyle={selectedStyle}
        error={error}
      />

      {plan ? (
        <TripPlanningResult plan={plan} compatibilityBySlot={compatibilityBySlot} />
      ) : null}
    </div>
  );
}

function TripPlanningResult({
  plan,
  compatibilityBySlot
}: {
  plan: PackRequirementPlan;
  compatibilityBySlot: Partial<Record<RequirementSlot, GearMatchingResult>>;
}) {
  const totalSlots = plan.required_slots.length;
  const coveredCount = plan.covered_slots.length;
  const coveragePercent =
    totalSlots === 0 ? 0 : Math.round((coveredCount / totalSlots) * 100);
  const compatibleSlots = plan.required_slots.filter((slotPlan) => {
    const match = compatibilityBySlot[slotPlan.slot];
    return (
      match &&
      (match.matching_owned_gear.length > 0 ||
        match.matching_database_gear.length > 0)
    );
  });

  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-white p-5 shadow-soft">
        <h2 className="text-lg font-semibold text-ink">山行サマリー</h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          <SummaryItem label="山" value={plan.mountain.name_ja} />
          <SummaryItem label="季節" value={mountainFoundationSeasonLabels[plan.season]} />
          <SummaryItem label="スタイル" value={mountainFoundationStyleLabels[plan.style]} />
        </dl>
      </section>

      <section className="rounded-lg bg-white p-5 shadow-soft">
        <h2 className="text-lg font-semibold text-ink">必要システム</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {plan.required_systems.map((system) => (
            <div key={system} className="flex items-center gap-2 rounded-lg border border-forest-100 bg-forest-50 px-3 py-2 text-sm font-semibold text-forest-900">
              <Check className="h-4 w-4 shrink-0" />
              {planningSystemLabels[system]}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink">カバー状況</h2>
            <p className="mt-2 text-sm text-stone-500">
              {coveredCount.toLocaleString("ja-JP")} / {totalSlots.toLocaleString("ja-JP")} スロットをカバー
            </p>
          </div>
          <div className="shrink-0 rounded-lg border border-forest-100 bg-forest-50 px-4 py-3 text-right">
            <p className="text-3xl font-semibold text-forest-900">{coveragePercent}%</p>
            <p className="text-sm font-medium text-forest-700">カバー済み</p>
          </div>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-lg bg-stone-100">
          <div
            className="h-full rounded-lg bg-forest-500"
            style={{ width: `${coveragePercent}%` }}
          />
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <SlotGroup
            title="カバー済み"
            emptyLabel="所有装備でカバーされたスロットはありません。"
            icon="covered"
            slots={plan.covered_slots}
          />
          <SlotGroup
            title="不足"
            emptyLabel="不足スロットはありません。"
            icon="missing"
            slots={plan.missing_slots}
          />
        </div>
      </section>

      <section className="rounded-lg bg-white p-5 shadow-soft">
        <h2 className="text-lg font-semibold text-ink">不足装備</h2>
        {plan.missing_slots.length > 0 ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {plan.missing_slots.map((slotPlan) => (
              <div key={slotPlan.slot} className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-900">
                <X className="h-4 w-4 shrink-0" />
                {requirementSlotLabels[slotPlan.slot]}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-stone-500">不足スロットはありません。</p>
        )}
      </section>

      {compatibleSlots.length > 0 ? (
        <section className="rounded-lg bg-white p-5 shadow-soft">
          <h2 className="text-lg font-semibold text-ink">照合結果</h2>
          <div className="mt-4 divide-y divide-stone-100">
            {compatibleSlots.map((slotPlan) => {
              const match = compatibilityBySlot[slotPlan.slot];

              if (!match) {
                return null;
              }

              return (
                <CompatibleGearSlot
                  key={slotPlan.slot}
                  slotPlan={slotPlan}
                  match={match}
                />
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="rounded-lg bg-white p-5 shadow-soft">
        <h2 className="text-lg font-semibold text-ink">計画メモ</h2>
        <PlanningNotes plan={plan} compatibilityBySlot={compatibilityBySlot} />
      </section>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-stone-100 bg-stone-50 px-4 py-3">
      <dt className="text-xs font-semibold uppercase tracking-normal text-stone-500">
        {label}
      </dt>
      <dd className="mt-1 text-base font-semibold text-ink">{value}</dd>
    </div>
  );
}

function SlotGroup({
  title,
  emptyLabel,
  icon,
  slots
}: {
  title: string;
  emptyLabel: string;
  icon: "covered" | "missing";
  slots: PackRequirementSlotPlan[];
}) {
  const isCovered = icon === "covered";

  return (
    <div>
      <div className="flex items-center gap-2">
        {isCovered ? (
          <PackageCheck className="h-5 w-5 text-forest-700" />
        ) : (
          <PackageX className="h-5 w-5 text-red-700" />
        )}
        <h3 className="text-sm font-semibold text-stone-700">{title}</h3>
      </div>
      <div className="mt-3 space-y-2">
        {slots.length === 0 ? (
          <p className="text-sm text-stone-500">{emptyLabel}</p>
        ) : (
          slots.map((slotPlan) => (
            <div
              key={slotPlan.slot}
              className="rounded-lg border border-stone-100 bg-stone-50 px-3 py-2"
            >
              <div className="flex items-center gap-2">
                {isCovered ? (
                  <Check className="h-4 w-4 shrink-0 text-forest-700" />
                ) : (
                  <X className="h-4 w-4 shrink-0 text-red-700" />
                )}
                <p className="text-sm font-semibold text-ink">
                  {requirementSlotLabels[slotPlan.slot]}
                </p>
              </div>
              {slotPlan.matching_owned_gear.length > 0 ? (
                <div className="mt-2 space-y-1 pl-6">
                  {slotPlan.matching_owned_gear.map((gear) => (
                    <p key={gear.id} className="text-xs text-stone-600">
                      {formatOwnedGearName(gear)}
                    </p>
                  ))}
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function CompatibleGearSlot({
  slotPlan,
  match
}: {
  slotPlan: PackRequirementSlotPlan;
  match: GearMatchingResult;
}) {
  return (
    <article className="py-4 first:pt-0 last:pb-0">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-semibold text-ink">{requirementSlotLabels[slotPlan.slot]}</h3>
        <span className="text-xs font-semibold text-stone-500">
          照合精度: {gearMatchingConfidenceLabels[match.confidence]}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {match.compatible_categories.map((category) => (
          <span key={`category-${category}`} className="rounded-lg bg-stone-100 px-2 py-1 text-xs font-semibold text-stone-700">
            {categoryLabels[category] ?? category}
          </span>
        ))}
        {match.compatible_subcategories.map((subcategory) => (
          <span key={`subcategory-${subcategory}`} className="rounded-lg bg-trail-100 px-2 py-1 text-xs font-semibold text-trail-800">
            {gearSubcategoryLabels[subcategory] ?? subcategory}
          </span>
        ))}
      </div>

      <div className="mt-3 grid gap-4 lg:grid-cols-2">
        <GearMatchList
          title="所有装備"
          emptyLabel="一致する所有装備なし"
          items={match.matching_owned_gear}
          formatter={formatOwnedGearName}
        />
        <GearMatchList
          title="登録データ上の対応例"
          emptyLabel="対応する登録データなし"
          items={match.matching_database_gear}
          formatter={formatDatabaseGearName}
        />
      </div>

      {match.ambiguous_cases.length > 0 ? (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{match.ambiguous_cases.join(" / ")}</span>
        </div>
      ) : null}
    </article>
  );
}

function GearMatchList<T>({
  title,
  emptyLabel,
  items,
  formatter
}: {
  title: string;
  emptyLabel: string;
  items: T[];
  formatter: (item: T) => string;
}) {
  const visibleItems = items.slice(0, 4);
  const remainingCount = Math.max(0, items.length - visibleItems.length);

  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-normal text-stone-500">
        {title}
      </h4>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-stone-500">{emptyLabel}</p>
      ) : (
        <div className="mt-2 space-y-1">
          {visibleItems.map((item, index) => (
            <p key={`${title}-${index}`} className="text-sm text-stone-700">
              {formatter(item)}
            </p>
          ))}
          {remainingCount > 0 ? (
            <p className="text-xs font-medium text-stone-500">
              他 {remainingCount.toLocaleString("ja-JP")} 件
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}

function PlanningNotes({
  plan,
  compatibilityBySlot
}: {
  plan: PackRequirementPlan;
  compatibilityBySlot: Partial<Record<RequirementSlot, GearMatchingResult>>;
}) {
  const ambiguousSlots = plan.required_slots.filter((slotPlan) => {
    return (compatibilityBySlot[slotPlan.slot]?.ambiguous_cases.length ?? 0) > 0;
  });

  return (
    <div className="mt-4 space-y-2">
      {plan.missing_slots.length > 0 ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-900">
          不足: {plan.missing_slots.length.toLocaleString("ja-JP")} スロット
        </p>
      ) : (
        <p className="rounded-lg bg-forest-50 px-3 py-2 text-sm font-medium text-forest-900">
          必要スロットはすべてカバーされています。
        </p>
      )}
      {ambiguousSlots.length > 0 ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
          確認が必要な分類: {ambiguousSlots.map((slot) => requirementSlotLabels[slot.slot]).join(" / ")}
        </p>
      ) : null}
    </div>
  );
}

function formatOwnedGearName(gear: GearMatchingOwnedGearMatch) {
  return [gear.brand, gear.model, gear.name].filter(Boolean).join(" / ");
}

function formatDatabaseGearName(gear: GearMatchingDatabaseGearMatch) {
  return [gear.brand, gear.model, gear.name_ja].filter(Boolean).join(" / ");
}
