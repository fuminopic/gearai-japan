"use client";

import {
  AlertTriangle,
  Bed,
  Check,
  ChevronDown,
  CircleAlert,
  CloudRain,
  Compass,
  CookingPot,
  Cross,
  Droplets,
  Mountain,
  PackageCheck,
  PackageX,
  Shirt,
  Tent,
  X
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { TripPlanningForm } from "@/components/trip-planning-form";
import {
  clearTripPlans,
  deleteTripPlan,
  saveTripPlan,
  updateTripPlan
} from "@/lib/actions/trip-plans";
import {
  categoryLabels,
  gearMatchingConfidenceLabels,
  gearSubcategoryLabels,
  mountainFoundationSeasonLabels,
  mountainFoundationStyleLabels,
  planningSystemLabels,
  requirementSlotLabels
} from "@/lib/i18n/labels";
import { createClient } from "@/lib/supabase/client";
import type {
  GearMatchingDatabaseGearMatch,
  GearMatchingOwnedGearMatch,
  GearMatchingResult,
  AIRecommendationRecord,
  MountainFoundationProfile,
  MountainFoundationSeason,
  MountainFoundationStyle,
  PackRequirementPlan,
  PackRequirementSlotPlan,
  PlanningSystem,
  RequirementSlot,
  SavedTripPlan
} from "@/lib/types";

type TripPlanningUIProps = {
  mountains: MountainFoundationProfile[];
  selectedMountainSlug: string;
  selectedSeason: MountainFoundationSeason;
  selectedStyle: MountainFoundationStyle;
  plan?: PackRequirementPlan;
  compatibilityBySlot?: Partial<Record<RequirementSlot, GearMatchingResult>>;
  planHistory?: AIRecommendationRecord[];
  savedPlans?: SavedTripPlan[];
  selectedPlanId?: string | null;
  selectedSavedPlan?: SavedTripPlan | null;
  error?: string;
};

const systemIcons: Record<PlanningSystem, LucideIcon> = {
  WATER_SYSTEM: Droplets,
  SHELTER_SYSTEM: Tent,
  SLEEP_SYSTEM: Bed,
  COOK_SYSTEM: CookingPot,
  RAIN_SYSTEM: CloudRain,
  COLD_WEATHER_LAYER: Shirt,
  NAVIGATION_SYSTEM: Compass,
  EMERGENCY_SYSTEM: Cross
};

const slotSystems: Record<RequirementSlot, PlanningSystem> = {
  WATER_STORAGE: "WATER_SYSTEM",
  WATER_TREATMENT: "WATER_SYSTEM",
  TENT: "SHELTER_SYSTEM",
  SLEEP_INSULATION: "SLEEP_SYSTEM",
  SLEEP_PAD: "SLEEP_SYSTEM",
  STOVE: "COOK_SYSTEM",
  FUEL: "COOK_SYSTEM",
  COOK_POT: "COOK_SYSTEM",
  TABLEWARE: "COOK_SYSTEM",
  RAIN_JACKET: "RAIN_SYSTEM",
  RAIN_PANTS: "RAIN_SYSTEM",
  INSULATION_LAYER: "COLD_WEATHER_LAYER",
  BASE_LAYER: "COLD_WEATHER_LAYER",
  GPS_DEVICE: "NAVIGATION_SYSTEM",
  POWER_BANK: "NAVIGATION_SYSTEM",
  FIRST_AID_KIT: "EMERGENCY_SYSTEM",
  HEADLAMP: "EMERGENCY_SYSTEM"
};

export function TripPlanningUI({
  mountains,
  selectedMountainSlug,
  selectedSeason,
  selectedStyle,
  plan,
  compatibilityBySlot = {},
  planHistory = [],
  savedPlans = [],
  selectedPlanId,
  selectedSavedPlan,
  error
}: TripPlanningUIProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get("id") ?? selectedPlanId ?? null;
  const initialSavedPlan =
    selectedSavedPlan ?? savedPlans.find((record) => record.id === planId) ?? null;
  const [hydratedPlan, setHydratedPlan] = useState<SavedTripPlan | null>(
    initialSavedPlan
  );
  const effectiveMountainSlug = hydratedPlan?.mountain_slug ?? selectedMountainSlug;
  const effectiveSeason = hydratedPlan?.season ?? selectedSeason;
  const effectiveStyle = hydratedPlan?.style ?? selectedStyle;
  const selectedMountain =
    mountains.find((mountain) => mountain.slug === effectiveMountainSlug) ?? null;
  const currentProgressValue = plan
    ? calculatePlanProgress(plan)
    : hydratedPlan?.progress ?? 0;

  useEffect(() => {
    if (!planId) {
      setHydratedPlan(null);
      return;
    }

    let isActive = true;
    const localPlan = savedPlans.find((record) => record.id === planId) ?? null;

    if (localPlan) {
      setHydratedPlan(localPlan);
    }

    async function hydratePlanFromId() {
      const supabase = createClient();
      const { data, error: hydrateError } = await supabase
        .from("trip_plans")
        .select("*")
        .eq("id", planId)
        .single();

      if (!isActive) {
        return;
      }

      if (hydrateError) {
        console.error("Plan hydration failed:", hydrateError.message);
        return;
      }

      const nextPlan = data as SavedTripPlan;
      setHydratedPlan(nextPlan);

      if (!nextPlan.mountain_slug) {
        return;
      }

      if (
        nextPlan.mountain_slug !== selectedMountainSlug ||
        nextPlan.season !== selectedSeason ||
        nextPlan.style !== selectedStyle
      ) {
        const nextParams = new URLSearchParams(searchParams.toString());
        nextParams.set("id", nextPlan.id);
        nextParams.set("mountain", nextPlan.mountain_slug);
        nextParams.set("season", nextPlan.season);
        nextParams.set("style", nextPlan.style);
        router.replace(`/plan?${nextParams.toString()}`);
      }
    }

    hydratePlanFromId();

    return () => {
      isActive = false;
    };
  }, [
    planId,
    router,
    savedPlans,
    searchParams,
    selectedMountainSlug,
    selectedSeason,
    selectedStyle
  ]);

  return (
    <div className="space-y-5 pb-24">
      <section className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold text-forest-700">山行計画</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-normal text-ink">
            パック計画
          </h1>
        </div>
      </section>

      <TripPlanningForm
        mountains={mountains}
        selectedMountainSlug={effectiveMountainSlug}
        selectedSeason={effectiveSeason}
        selectedStyle={effectiveStyle}
        planId={planId}
        error={error}
      />

      {plan ? (
        <>
          <TripPlanningResult plan={plan} compatibilityBySlot={compatibilityBySlot} />
          {selectedMountain ? (
            <SavePlanButton
              mountainSlug={selectedMountain.slug}
              mountainName={selectedMountain.name_ja}
              season={effectiveSeason}
              style={effectiveStyle}
              progress={currentProgressValue}
              planId={planId}
            />
          ) : null}
        </>
      ) : null}

      <PlanHistorySection plans={savedPlans} legacyPlans={planHistory} />
    </div>
  );
}

function SavePlanButton({
  planId,
  mountainSlug,
  mountainName,
  season,
  style,
  progress
}: {
  planId: string | null;
  mountainSlug: string;
  mountainName: string;
  season: MountainFoundationSeason;
  style: MountainFoundationStyle;
  progress: number;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const formAction = planId ? updateTripPlan : saveTripPlan;

  function handleSavePlan() {
    const form = formRef.current;

    if (!form) {
      return;
    }

    const formData = new FormData(form);
    startTransition(async () => {
      if (planId) {
        await updateTripPlan(formData);
      } else {
        await saveTripPlan(formData);
      }
      router.push("/dashboard");
    });
  }

  return (
    <form ref={formRef} action={formAction}>
      {planId ? <input type="hidden" name="id" value={planId} /> : null}
      <input type="hidden" name="mountain_slug" value={mountainSlug} />
      <input type="hidden" name="mountain_name" value={mountainName} />
      <input type="hidden" name="season" value={season} />
      <input type="hidden" name="style" value={style} />
      <input type="hidden" name="progress" value={progress} />
      <button
        type="button"
        disabled={isPending}
        onClick={handleSavePlan}
        className="fixed bottom-24 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl bg-[#C62828] py-3.5 font-bold text-white shadow-xl transition disabled:opacity-70"
      >
        {isPending ? "保存中..." : planId ? "変更を更新！" : "計画を保存！"}
      </button>
    </form>
  );
}

function PlanHistorySection({
  plans,
  legacyPlans
}: {
  plans: SavedTripPlan[];
  legacyPlans: AIRecommendationRecord[];
}) {
  return (
    <section className="rounded-lg bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-forest-700">保存済みプラン</p>
          <h2 className="mt-1 text-lg font-semibold text-ink">計画履歴</h2>
        </div>
        {plans.length > 0 ? (
          <form action={clearTripPlans}>
            <button
              type="submit"
              className="rounded-full border border-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50"
            >
              一键删除
            </button>
          </form>
        ) : null}
      </div>

      {plans.length > 0 ? (
        <div className="mt-4 space-y-3">
          {plans.map((record) => (
            <article
              key={record.id}
              className="rounded-lg border border-stone-100 bg-stone-50 px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <Link
                  href={`/plan?id=${record.id}` as Route}
                  className="min-w-0 flex-1"
                >
                  <h3 className="truncate text-sm font-semibold text-ink">
                    {record.mountain_name || "山行"}
                  </h3>
                  <p className="mt-1 text-xs font-medium text-stone-500">
                    {formatSavedPlanMeta(record)}
                  </p>
                </Link>
                <form action={deleteTripPlan}>
                  <input type="hidden" name="id" value={record.id} />
                  <button
                    type="submit"
                    className="rounded-full border border-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                  >
                    Delete
                  </button>
                </form>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-lg bg-stone-50 px-4 py-3 text-sm font-medium text-stone-500">
          <p>まだ保存された計画はありません。</p>
          {legacyPlans.length > 0 ? (
            <p className="mt-2 text-xs">
              旧履歴は {legacyPlans.length.toLocaleString("ja-JP")} 件あります。
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}

function formatSavedPlanMeta(record: SavedTripPlan) {
  const parts = [
    mountainFoundationSeasonLabels[record.season],
    mountainFoundationStyleLabels[record.style],
    new Date(record.created_at).toLocaleDateString("ja-JP")
  ];

  return parts.join(" / ");
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
  const missingCount = plan.missing_slots.length;
  const coveragePercent = calculatePlanProgress(plan);
  const compatibleSlots = plan.required_slots.filter((slotPlan) => {
    const match = compatibilityBySlot[slotPlan.slot];
    return (
      match &&
      (match.matching_owned_gear.length > 0 ||
        match.matching_database_gear.length > 0)
    );
  });

  return (
    <div className="space-y-5">
      <HeroReadinessCard
        plan={plan}
        coveragePercent={coveragePercent}
        coveredCount={coveredCount}
        missingCount={missingCount}
        totalSlots={totalSlots}
      />

      <section className="rounded-lg bg-white p-5 shadow-soft">
        <h2 className="text-lg font-semibold text-ink">必要システム</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {plan.required_systems.map((system) => (
            <div key={system} className="flex items-center gap-2 rounded-lg border border-forest-100 bg-forest-50 px-3 py-2 text-sm font-semibold text-forest-900">
              <SystemIcon system={system} className="h-4 w-4 shrink-0" />
              {planningSystemLabels[system]}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-lg font-semibold text-ink">装備完成度</h2>
          <p className="text-sm font-semibold text-forest-800">
            {coveragePercent}% 完成
          </p>
        </div>
        <div className="mt-4 h-2.5 overflow-hidden rounded-lg bg-stone-100">
          <div
            className="h-full rounded-lg bg-forest-700"
            style={{ width: `${coveragePercent}%` }}
          />
        </div>
      </section>

      <section className="rounded-lg bg-white p-5 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-red-700">次に準備する装備</p>
            <h2 className="mt-1 text-xl font-semibold text-ink">不足装備</h2>
          </div>
          <span className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">
            {missingCount.toLocaleString("ja-JP")} 件
          </span>
        </div>
        {plan.missing_slots.length > 0 ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {plan.missing_slots.map((slotPlan) => (
              <MissingGearCard key={slotPlan.slot} slotPlan={slotPlan} />
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-forest-100 bg-forest-50 px-4 py-3 text-sm font-semibold text-forest-900">
            必要な装備スロットはすべてカバーされています。
          </div>
        )}
      </section>

      <section className="rounded-lg bg-white p-5 shadow-soft">
        <SlotGroup
          title="カバー済み装備"
          emptyLabel="所有装備でカバーされたスロットはありません。"
          icon="covered"
          slots={plan.covered_slots}
        />
      </section>

      {compatibleSlots.length > 0 ? (
        <details className="group rounded-lg bg-white p-5 shadow-soft">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-stone-500">分類と所有装備の確認</p>
              <h2 className="mt-1 text-lg font-semibold text-ink">照合結果の詳細</h2>
            </div>
            <ChevronDown className="h-5 w-5 shrink-0 text-stone-500 transition group-open:rotate-180" />
          </summary>
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
        </details>
      ) : null}

      <section className="rounded-lg bg-white p-5 shadow-soft">
        <h2 className="text-lg font-semibold text-ink">計画メモ</h2>
        <PlanningNotes plan={plan} compatibilityBySlot={compatibilityBySlot} />
      </section>
    </div>
  );
}

function calculatePlanProgress(plan: PackRequirementPlan) {
  const totalSlots = plan.required_slots.length;

  if (totalSlots === 0) {
    return 0;
  }

  return Math.round((plan.covered_slots.length / totalSlots) * 100);
}

function HeroReadinessCard({
  plan,
  coveragePercent,
  coveredCount,
  missingCount,
  totalSlots
}: {
  plan: PackRequirementPlan;
  coveragePercent: number;
  coveredCount: number;
  missingCount: number;
  totalSlots: number;
}) {
  return (
    <section className="overflow-hidden rounded-lg bg-ink text-white shadow-soft">
      <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="p-5 sm:p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-trail-300">
            <Mountain className="h-4 w-4" />
            山行準備
          </div>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-semibold tracking-normal">
                {plan.mountain.name_ja}
              </h2>
              <p className="mt-2 text-sm font-medium text-stone-200">
                {mountainFoundationSeasonLabels[plan.season]} / {mountainFoundationStyleLabels[plan.style]}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-stretch sm:text-right">
              <div className="rounded-lg bg-white/10 px-4 py-3">
                <p className="text-4xl font-semibold tracking-normal">
                  {coveragePercent}%
                </p>
                <p className="text-sm font-semibold text-stone-200">装備完成度</p>
              </div>
              <div className="rounded-lg bg-white/10 px-4 py-3 sm:hidden">
                <p className="text-4xl font-semibold tracking-normal text-red-200">
                  {missingCount.toLocaleString("ja-JP")}
                </p>
                <p className="text-sm font-semibold text-stone-200">不足</p>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden grid-cols-3 border-t border-white/10 bg-white/5 sm:grid lg:border-l lg:border-t-0">
          <ReadinessMetric
            label="カバー済み"
            value={coveredCount}
            suffix={`/${totalSlots}`}
            tone="covered"
          />
          <ReadinessMetric
            label="不足"
            value={missingCount}
            suffix="件"
            tone="missing"
          />
          <ReadinessMetric
            label="準備する"
            value={missingCount}
            suffix="件"
            tone="neutral"
          />
        </div>
      </div>
    </section>
  );
}

function ReadinessMetric({
  label,
  value,
  suffix,
  tone
}: {
  label: string;
  value: number;
  suffix: string;
  tone: "covered" | "missing" | "neutral";
}) {
  const valueClass =
    tone === "missing"
      ? "text-red-200"
      : tone === "covered"
        ? "text-forest-100"
        : "text-trail-100";

  return (
    <div className="border-r border-white/10 px-3 py-4 last:border-r-0 sm:px-5 sm:py-6">
      <p className="text-xs font-semibold text-stone-300">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${valueClass}`}>
        {value.toLocaleString("ja-JP")}
        <span className="ml-1 text-sm font-semibold text-stone-300">{suffix}</span>
      </p>
    </div>
  );
}

function SystemIcon({
  system,
  className
}: {
  system: PlanningSystem;
  className?: string;
}) {
  const Icon = systemIcons[system];

  return <Icon className={className} />;
}

function MissingGearCard({ slotPlan }: { slotPlan: PackRequirementSlotPlan }) {
  const system = slotSystems[slotPlan.slot];

  return (
    <article className="flex min-h-24 gap-3 rounded-lg border border-red-100 bg-red-50 px-4 py-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-red-800">
        <SystemIcon system={system} className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-red-950">
          {requirementSlotLabels[slotPlan.slot]}
        </p>
        <p className="mt-1 text-xs font-semibold text-red-700">
          {planningSystemLabels[system]}
        </p>
      </div>
    </article>
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
        <p className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-900">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>不足装備を先に確認してください: {plan.missing_slots.length.toLocaleString("ja-JP")} 件</span>
        </p>
      ) : (
        <p className="flex items-start gap-2 rounded-lg bg-forest-50 px-3 py-2 text-sm font-medium text-forest-900">
          <Check className="mt-0.5 h-4 w-4 shrink-0" />
          <span>必要な装備スロットはすべてカバーされています。</span>
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
