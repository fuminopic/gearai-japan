"use client";

import {
  AlertTriangle,
  Axe,
  Backpack,
  Battery,
  Bean,
  Bed,
  Bell,
  BriefcaseMedical,
  Check,
  ChevronDown,
  CircleAlert,
  CircleDashed,
  ClipboardList,
  CloudRain,
  Compass,
  Cookie,
  CookingPot,
  Droplets,
  Footprints,
  Glasses,
  Hammer,
  Hand,
  HardHat,
  House,
  IdCard,
  Lamp,
  Map as MapIcon,
  Mountain,
  Navigation,
  PlugZap,
  Shirt,
  ShieldAlert,
  Snowflake,
  Soup,
  Sparkles,
  Tent,
  Toilet,
  Utensils,
  Volume2,
  X,
  Zap,
  type LucideIcon
} from "lucide-react";
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
  requirementSlotLabels
} from "@/lib/i18n/labels";
import {
  buildPlanChecklist,
  buildPlanDecisionChips,
  buildPlanNotNeededItems,
  buildPreDepartureSummary,
  calculateChecklistProgress,
  checklistPriorityLabels,
  getChecklistOnlyStorageKey,
  getCheckedSlotsStorageKey,
  getPreDepartureItemActionStatus,
  isImportantPreDepartureItem,
  isSupportedChecklistOnlyId,
  isSupportedRequirementSlot,
  type ChecklistCategory,
  type ChecklistItemIcon,
  type ChecklistItem,
  type PlanDecisionChip,
  type PlanNotNeededItem,
  type PreDepartureSummary
} from "@/lib/plan-checklist";
import { createClient } from "@/lib/supabase/client";
import { writeTripPlanLocalMeta } from "@/lib/trip-plan-local-meta";
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
  RequirementSlot,
  SavedTripPlan,
  UserGear
} from "@/lib/types";

type TripPlanningUIProps = {
  mountains: MountainFoundationProfile[];
  selectedMountainSlug: string;
  selectedSeason: MountainFoundationSeason;
  selectedStyle: MountainFoundationStyle;
  plan?: PackRequirementPlan;
  ownedGear?: UserGear[];
  compatibilityBySlot?: Partial<Record<RequirementSlot, GearMatchingResult>>;
  planHistory?: AIRecommendationRecord[];
  savedPlans?: SavedTripPlan[];
  selectedPlanId?: string | null;
  selectedSavedPlan?: SavedTripPlan | null;
  error?: string;
};

type DisplayRequirementSlotPlan = PackRequirementSlotPlan & {
  displayKey: string;
  slots: RequirementSlot[];
  missingSlots: RequirementSlot[];
};

type DisplayGearMatchingResult = Omit<GearMatchingResult, "slot"> & {
  slot: RequirementSlot;
};

const emptyCheckedSlots: RequirementSlot[] = [];
const emptyChecklistOnlyIds: string[] = [];
type ChecklistScanFilter = "ACTION" | "MISSING" | "CONFIRM" | "IMPORTANT" | "ALL";

export function TripPlanningUI({
  mountains,
  selectedMountainSlug,
  selectedSeason,
  selectedStyle,
  plan,
  ownedGear = [],
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
  const shouldFocusChecklist = searchParams.get("focus") === "checklist";
  const shouldFocusPreDeparture = searchParams.get("focus") === "predeparture";
  const resultSectionRef = useRef<HTMLDivElement>(null);
  const initialSavedPlan =
    selectedSavedPlan ?? savedPlans.find((record) => record.id === planId) ?? null;
  const [hydratedPlan, setHydratedPlan] = useState<SavedTripPlan | null>(
    initialSavedPlan
  );
  const [, setInteractiveProgress] = useState<number | null>(null);
  const [interactiveCheckedSlots, setInteractiveCheckedSlots] = useState<
    RequirementSlot[] | null
  >(null);
  const [interactiveChecklistOnlyIds, setInteractiveChecklistOnlyIds] = useState<
    string[] | null
  >(null);
  const [storedCheckedSlots, setStoredCheckedSlots] = useState<RequirementSlot[]>([]);
  const [storedChecklistOnlyIds, setStoredChecklistOnlyIds] = useState<string[]>([]);
  const effectiveMountainSlug = hydratedPlan?.mountain_slug ?? selectedMountainSlug;
  const effectiveSeason = hydratedPlan?.season ?? selectedSeason;
  const effectiveStyle = hydratedPlan?.style ?? selectedStyle;
  const resolvedPlannedDate =
    sanitizeDateParam(searchParams.get("date")) ?? hydratedPlan?.planned_date ?? "";
  const resolvedTripMemo =
    sanitizeMemoParam(searchParams.get("memo")) ?? hydratedPlan?.trip_memo ?? "";
  const resolvedBringCash =
    parseBooleanParam(searchParams.get("cash")) ?? hydratedPlan?.bring_cash ?? false;
  const resolvedHasMountainInsurance =
    parseBooleanParam(searchParams.get("insurance")) ??
    hydratedPlan?.has_mountain_insurance ??
    false;
  const [planDetailsDraft, setPlanDetailsDraft] = useState({
    plannedDate: resolvedPlannedDate,
    tripMemo: resolvedTripMemo,
    bringCash: resolvedBringCash,
    hasMountainInsurance: resolvedHasMountainInsurance
  });
  const selectedMountain =
    mountains.find((mountain) => mountain.slug === effectiveMountainSlug) ?? null;
  const savedCheckedSlots = getSavedPlanCheckedSlots(hydratedPlan);
  const restoredCheckedSlots =
    storedCheckedSlots.length > 0 ? storedCheckedSlots : savedCheckedSlots ?? [];
  const rawCurrentCheckedSlots = interactiveCheckedSlots ?? restoredCheckedSlots;
  const currentCheckedSlots = plan
    ? filterCheckedSlotsForPlan(rawCurrentCheckedSlots, plan)
    : rawCurrentCheckedSlots;
  const currentChecklistOnlyIds =
    interactiveChecklistOnlyIds ?? storedChecklistOnlyIds;
  const currentProgressValue = plan
    ? calculateChecklistProgress(
        plan,
        currentCheckedSlots,
        currentChecklistOnlyIds,
        ownedGear
      )
    : hydratedPlan?.progress ?? 0;
  const planStateKey = plan
    ? `${plan.mountain.slug}:${plan.season}:${plan.style}`
    : "no-plan";

  useEffect(() => {
    setInteractiveProgress(null);
    setInteractiveCheckedSlots(null);
    setInteractiveChecklistOnlyIds(null);
    setStoredCheckedSlots(planId ? readStoredCheckedSlots(planId) : []);
    setStoredChecklistOnlyIds(planId ? readStoredChecklistOnlyIds(planId) : []);
  }, [planId, planStateKey]);

  useEffect(() => {
    setPlanDetailsDraft({
      plannedDate: resolvedPlannedDate,
      tripMemo: resolvedTripMemo,
      bringCash: resolvedBringCash,
      hasMountainInsurance: resolvedHasMountainInsurance
    });
  }, [
    resolvedBringCash,
    resolvedHasMountainInsurance,
    resolvedPlannedDate,
    resolvedTripMemo
  ]);

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
        if (nextPlan.planned_date) {
          nextParams.set("date", nextPlan.planned_date);
        }
        if (nextPlan.trip_memo) {
          nextParams.set("memo", nextPlan.trip_memo);
        }
        nextParams.set("cash", nextPlan.bring_cash ? "1" : "0");
        nextParams.set(
          "insurance",
          nextPlan.has_mountain_insurance ? "1" : "0"
        );
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

  useEffect(() => {
    if (!plan || (!shouldFocusChecklist && !shouldFocusPreDeparture)) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      resultSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }, 80);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [plan, planStateKey, shouldFocusChecklist, shouldFocusPreDeparture]);

  return (
    <div className="space-y-5 pb-24">
      <TripPlanningForm
        mountains={mountains}
        selectedMountainSlug={effectiveMountainSlug}
        selectedSeason={effectiveSeason}
        selectedStyle={effectiveStyle}
        selectedPlannedDate={planDetailsDraft.plannedDate}
        selectedTripMemo={planDetailsDraft.tripMemo}
        onPlanDetailsChange={(details) =>
          setPlanDetailsDraft((current) => ({ ...current, ...details }))
        }
        planId={planId}
        error={error}
      />

      {plan ? (
        <>
          <div ref={resultSectionRef} className="scroll-mt-24">
            <TripPlanningResult
              plan={plan}
              compatibilityBySlot={compatibilityBySlot}
              ownedGear={ownedGear}
              plannedDate={planDetailsDraft.plannedDate}
              initialCheckedSlots={currentCheckedSlots}
              initialChecklistOnlyIds={currentChecklistOnlyIds}
              onProgressChange={setInteractiveProgress}
              onCheckedSlotsChange={setInteractiveCheckedSlots}
              onChecklistOnlyIdsChange={setInteractiveChecklistOnlyIds}
              planId={planId}
            />
          </div>
          {selectedMountain ? (
            <SavePlanButton
              mountainSlug={selectedMountain.slug}
              mountainName={selectedMountain.name_ja}
              season={effectiveSeason}
              style={effectiveStyle}
              plannedDate={planDetailsDraft.plannedDate}
              tripMemo={planDetailsDraft.tripMemo}
              bringCash={planDetailsDraft.bringCash}
              hasMountainInsurance={planDetailsDraft.hasMountainInsurance}
              progress={currentProgressValue}
              checkedSlots={currentCheckedSlots}
              checklistOnlyIds={currentChecklistOnlyIds}
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
  plannedDate,
  tripMemo,
  bringCash,
  hasMountainInsurance,
  progress,
  checkedSlots,
  checklistOnlyIds
}: {
  planId: string | null;
  mountainSlug: string;
  mountainName: string;
  season: MountainFoundationSeason;
  style: MountainFoundationStyle;
  plannedDate: string;
  tripMemo: string;
  bringCash: boolean;
  hasMountainInsurance: boolean;
  progress: number;
  checkedSlots: RequirementSlot[];
  checklistOnlyIds: string[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  function handleSavePlan() {
    const form = formRef.current;

    if (!form) {
      return;
    }

    const formData = new FormData(form);
    startTransition(async () => {
      let result: { id?: string } | undefined;

      if (planId) {
        result = await updateTripPlan(formData);
      } else {
        result = await saveTripPlan(formData);
      }

      const savedPlanId = result?.id ?? planId;

      if (savedPlanId) {
        writeStoredCheckedSlots(savedPlanId, checkedSlots);
        writeStoredChecklistOnlyIds(savedPlanId, checklistOnlyIds);
        writeTripPlanLocalMeta(savedPlanId, {
          plannedDate,
          tripMemo
        });
      }

      router.push("/dashboard");
    });
  }

  return (
    <form
      ref={formRef}
      className="rounded-lg border border-forest-100 bg-white p-4 shadow-soft sm:p-5"
    >
      {planId ? <input type="hidden" name="id" value={planId} /> : null}
      <input type="hidden" name="mountain_slug" value={mountainSlug} />
      <input type="hidden" name="mountain_name" value={mountainName} />
      <input type="hidden" name="season" value={season} />
      <input type="hidden" name="style" value={style} />
      <input type="hidden" name="planned_date" value={plannedDate} />
      <input type="hidden" name="trip_memo" value={tripMemo} />
      <input type="hidden" name="bring_cash" value={bringCash ? "1" : "0"} />
      <input
        type="hidden"
        name="has_mountain_insurance"
        value={hasMountainInsurance ? "1" : "0"}
      />
      <input type="hidden" name="progress" value={progress} />
      <input
        type="hidden"
        name="checked_slots"
        value={JSON.stringify(checkedSlots)}
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-forest-700">計画を保存</p>
          <p className="mt-1 text-xs font-semibold text-stone-500">
            保存するとホームの次回山行カードに反映されます。
          </p>
        </div>
        <p className="text-sm font-bold text-ink">
          完成度 {progress.toLocaleString("ja-JP")}%
        </p>
      </div>
      <button
        type="button"
        disabled={isPending}
        onClick={handleSavePlan}
        className="mt-3 inline-flex h-12 w-full items-center justify-center rounded-lg bg-forest-700 text-base font-bold text-white shadow-sm transition active:scale-[0.99] disabled:opacity-70"
      >
        {isPending ? "保存中..." : planId ? "変更を更新" : "計画を保存"}
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
          <form
            action={clearTripPlans}
            onSubmit={(event) => {
              if (!window.confirm("保存済みプランをすべて削除しますか？")) {
                event.preventDefault();
              }
            }}
          >
            <button
              type="submit"
              className="rounded-full border border-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50"
            >
              すべて削除
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
                <form
                  action={deleteTripPlan}
                  onSubmit={(event) => {
                    if (!window.confirm("この計画を削除しますか？")) {
                      event.preventDefault();
                    }
                  }}
                >
                  <input type="hidden" name="id" value={record.id} />
                  <button
                    type="submit"
                    className="rounded-full border border-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                  >
                    削除
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
    record.planned_date
      ? formatPlanDate(record.planned_date)
      : new Date(record.created_at).toLocaleDateString("ja-JP")
  ];

  return parts.join(" / ");
}

function sanitizeDateParam(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  return value;
}

function sanitizeMemoParam(value: string | null) {
  const trimmed = value?.trim() ?? "";

  return trimmed ? trimmed.slice(0, 200) : null;
}

function parseBooleanParam(value: string | null) {
  if (value === "1" || value === "true") {
    return true;
  }

  if (value === "0" || value === "false") {
    return false;
  }

  return null;
}

function formatPlanDate(value: string) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    weekday: "short"
  }).format(date);
}

function getSavedPlanCheckedSlots(plan: SavedTripPlan | null) {
  if (!plan || !Array.isArray(plan.checked_slots)) {
    return null;
  }

  return uniqueRequirementSlots(plan.checked_slots);
}

function readStoredCheckedSlots(planId: string) {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedValue = window.localStorage.getItem(getCheckedSlotsStorageKey(planId));

    if (!storedValue) {
      return [];
    }

    const parsed = JSON.parse(storedValue);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return uniqueRequirementSlots(parsed);
  } catch {
    return [];
  }
}

function writeStoredCheckedSlots(planId: string, checkedSlots: RequirementSlot[]) {
  if (typeof window === "undefined") {
    return;
  }

  const storageKey = getCheckedSlotsStorageKey(planId);

  if (checkedSlots.length === 0) {
    window.localStorage.removeItem(storageKey);
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(checkedSlots));
}

function readStoredChecklistOnlyIds(planId: string) {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedValue = window.localStorage.getItem(getChecklistOnlyStorageKey(planId));

    if (!storedValue) {
      return [];
    }

    const parsed = JSON.parse(storedValue);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return uniqueChecklistOnlyIds(parsed);
  } catch {
    return [];
  }
}

function writeStoredChecklistOnlyIds(planId: string, checklistOnlyIds: string[]) {
  if (typeof window === "undefined") {
    return;
  }

  const storageKey = getChecklistOnlyStorageKey(planId);

  if (checklistOnlyIds.length === 0) {
    window.localStorage.removeItem(storageKey);
    return;
  }

  window.localStorage.setItem(
    storageKey,
    JSON.stringify(uniqueChecklistOnlyIds(checklistOnlyIds))
  );
}

function TripPlanningResult({
  plan,
  compatibilityBySlot,
  ownedGear,
  plannedDate,
  planId,
  initialCheckedSlots = emptyCheckedSlots,
  initialChecklistOnlyIds = emptyChecklistOnlyIds,
  onProgressChange,
  onCheckedSlotsChange,
  onChecklistOnlyIdsChange
}: {
  plan: PackRequirementPlan;
  compatibilityBySlot: Partial<Record<RequirementSlot, GearMatchingResult>>;
  ownedGear: UserGear[];
  plannedDate: string;
  planId: string | null;
  initialCheckedSlots?: RequirementSlot[];
  initialChecklistOnlyIds?: string[];
  onProgressChange?: (progress: number) => void;
  onCheckedSlotsChange?: (checkedSlots: RequirementSlot[]) => void;
  onChecklistOnlyIdsChange?: (checklistOnlyIds: string[]) => void;
}) {
  const [checkedSlots, setCheckedSlots] = useState<RequirementSlot[]>(() => {
    return filterCheckedSlotsForPlan(initialCheckedSlots, plan);
  });
  const [checklistOnlyIds, setChecklistOnlyIds] = useState<string[]>(() => {
    return uniqueChecklistOnlyIds(initialChecklistOnlyIds);
  });
  const initialCheckedSlotsKey = initialCheckedSlots.join("|");
  const initialChecklistOnlyIdsKey = initialChecklistOnlyIds.join("|");
  const checklist = buildPlanChecklist({
    plan,
    checkedSlots,
    checkedChecklistOnlyIds: checklistOnlyIds,
    ownedGear
  });
  const preDepartureSummary = buildPreDepartureSummary(checklist);
  const decisionChips = buildPlanDecisionChips(plan);
  const notNeededItems = buildPlanNotNeededItems(plan);
  const [scanFilter, setScanFilter] = useState<ChecklistScanFilter>("ACTION");
  const [isChecklistSheetOpen, setIsChecklistSheetOpen] = useState(false);
  const visibleCategories = filterChecklistCategoriesForScan(
    checklist.categories,
    scanFilter
  );
  const actionCategoryLabel = getChecklistScanFilterLabel(scanFilter);
  const displaySlots = dedupeDisplaySlots(plan.required_slots);
  const compatibleSlots = displaySlots
    .map((slotPlan) => ({
      slotPlan,
      match: mergeCompatibilityMatches(slotPlan, compatibilityBySlot)
    }))
    .filter(({ match }) => {
      return (
        match.matching_owned_gear.length > 0 ||
        match.matching_database_gear.length > 0
      );
    });

  useEffect(() => {
    const nextCheckedSlots = filterCheckedSlotsForPlan(initialCheckedSlots, plan);

    setCheckedSlots(nextCheckedSlots);
  }, [initialCheckedSlotsKey, plan]);

  useEffect(() => {
    const nextChecklistOnlyIds = uniqueChecklistOnlyIds(initialChecklistOnlyIds);

    setChecklistOnlyIds(nextChecklistOnlyIds);
  }, [initialChecklistOnlyIdsKey]);

  useEffect(() => {
    onProgressChange?.(checklist.summary.percent);
  }, [checklist.summary.percent, onProgressChange]);

  function handleToggleChecklistItem(item: ChecklistItem) {
    if (item.source === "GEAR_BACKED") {
      handleToggleGearBackedItem(item.toggleSlots);
      return;
    }

    handleToggleChecklistOnlyItem(item.id);
  }

  function handleToggleGearBackedItem(slots: RequirementSlot[]) {
    if (slots.length === 0) {
      return;
    }

    setCheckedSlots((currentSlots) => {
      const nextSlots = new Set(currentSlots);
      const shouldUncheck = slots.every((slot) => nextSlots.has(slot));

      for (const slot of slots) {
        if (shouldUncheck) {
          nextSlots.delete(slot);
        } else {
          nextSlots.add(slot);
        }
      }

      const nextCheckedSlots = filterCheckedSlotsForPlan(Array.from(nextSlots), plan);

      if (planId) {
        writeStoredCheckedSlots(planId, nextCheckedSlots);
      }

      onCheckedSlotsChange?.(nextCheckedSlots);

      return nextCheckedSlots;
    });
  }

  function handleToggleChecklistOnlyItem(id: string) {
    setChecklistOnlyIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (nextIds.has(id)) {
        nextIds.delete(id);
      } else {
        nextIds.add(id);
      }

      const nextChecklistOnlyIds = uniqueChecklistOnlyIds(Array.from(nextIds));

      if (planId) {
        writeStoredChecklistOnlyIds(planId, nextChecklistOnlyIds);
      }

      onChecklistOnlyIdsChange?.(nextChecklistOnlyIds);

      return nextChecklistOnlyIds;
    });
  }

  return (
    <div className="space-y-5">
      <HeroReadinessCard
        plan={plan}
        checkedCount={checklist.summary.checkedCount}
        missingCount={checklist.summary.missingCount}
        totalCount={checklist.summary.totalCount}
        progressPercent={checklist.summary.percent}
      />

      <PreDepartureConfirmationPanel
        summary={preDepartureSummary}
        progressPercent={checklist.summary.percent}
        onShowAllItems={() => setScanFilter("ALL")}
        onOpenChecklistSheet={() => setIsChecklistSheetOpen(true)}
      />

      {decisionChips.length > 0 ? (
        <DecisionChipsSection chips={decisionChips} />
      ) : null}

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-forest-700">準備確認</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-normal text-ink">
              装備チェックリスト
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center sm:w-auto">
            <ChecklistStat label="完成" value={`${checklist.summary.percent}%`} />
            <ChecklistStat
              label="完了"
              value={checklist.summary.checkedCount.toLocaleString("ja-JP")}
            />
            <ChecklistStat
              label="未完了"
              value={checklist.summary.missingCount.toLocaleString("ja-JP")}
              tone="missing"
            />
          </div>
        </div>

        <ChecklistScanControls
          activeFilter={scanFilter}
          summary={preDepartureSummary}
          onFilterChange={setScanFilter}
        />

        <div className="grid gap-4 xl:grid-cols-2">
          {visibleCategories.length > 0 ? (
            visibleCategories.map((category) => (
            <ChecklistCategoryCard
              key={category.id}
              category={category}
              compatibilityBySlot={compatibilityBySlot}
              onToggle={handleToggleChecklistItem}
            />
            ))
          ) : (
            <div className="rounded-lg bg-white p-5 text-sm font-semibold text-stone-500 shadow-soft xl:col-span-2">
              {actionCategoryLabel}の項目はありません。
            </div>
          )}
        </div>
      </section>

      {notNeededItems.length > 0 ? (
        <NotNeededItemsSection items={notNeededItems} />
      ) : null}

      {compatibleSlots.length > 0 ? (
        <details className="group rounded-lg bg-white p-5 shadow-soft">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-stone-500">登録装備との対応</p>
              <h2 className="mt-1 text-lg font-semibold text-ink">所持済みの判定理由</h2>
            </div>
            <ChevronDown className="h-5 w-5 shrink-0 text-stone-500 transition group-open:rotate-180" />
          </summary>
          <div className="mt-4 divide-y divide-stone-100">
            {compatibleSlots.map(({ slotPlan, match }) => {
              return (
                <CompatibleGearSlot
                  key={slotPlan.displayKey}
                  slotPlan={slotPlan}
                  match={match}
                />
              );
            })}
          </div>
        </details>
      ) : null}

      <section className="rounded-lg bg-white p-5 shadow-soft">
        <h2 className="text-lg font-semibold text-ink">確認メモ</h2>
        <PlanningNotes
          missingCount={checklist.summary.missingCount}
          displaySlots={displaySlots}
          compatibilityBySlot={compatibilityBySlot}
        />
      </section>

      <ChecklistSheetModal
        isOpen={isChecklistSheetOpen}
        onClose={() => setIsChecklistSheetOpen(false)}
        plan={plan}
        plannedDate={plannedDate}
        checklist={checklist}
        summary={preDepartureSummary}
      />
    </div>
  );
}

function ChecklistSheetModal({
  isOpen,
  onClose,
  plan,
  plannedDate,
  checklist,
  summary
}: {
  isOpen: boolean;
  onClose: () => void;
  plan: PackRequirementPlan;
  plannedDate: string;
  checklist: ReturnType<typeof buildPlanChecklist>;
  summary: PreDepartureSummary;
}) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const sheetCounts = getChecklistSheetCounts(checklist);

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/40 sm:px-6 sm:py-6"
      role="dialog"
      aria-modal="true"
      aria-label="チェック表"
    >
      <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-[#FAFAFA] shadow-2xl sm:mx-auto sm:h-[calc(100dvh-3rem)] sm:max-w-3xl sm:rounded-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-stone-100 bg-white px-4 pb-3 pt-[max(env(safe-area-inset-top),16px)] sm:px-6 sm:pt-5">
          <div>
            <p className="text-xs font-bold text-forest-700">出発前確認</p>
            <h2 className="mt-1 text-xl font-semibold tracking-normal text-ink">
              チェック表
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-stone-100 text-stone-700 transition active:scale-95"
            aria-label="チェック表を閉じる"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          <section className="rounded-lg bg-white p-4 shadow-soft">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-bold text-stone-500">
                  {formatChecklistSheetDate(plannedDate)}
                </p>
                <h3 className="mt-1 text-2xl font-semibold tracking-normal text-ink">
                  {plan.mountain.name_ja}
                </h3>
                <p className="mt-1 text-sm font-semibold text-stone-600">
                  {mountainFoundationSeasonLabels[plan.season]} / {mountainFoundationStyleLabels[plan.style]}
                </p>
              </div>
              <span className="inline-flex w-fit rounded-lg bg-forest-50 px-3 py-2 text-xs font-bold text-forest-800">
                {summary.statusLabel}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-4 gap-2 text-center">
              <ChecklistSheetMetric label="不足" value={sheetCounts.missing} tone="missing" />
              <ChecklistSheetMetric label="確認する" value={sheetCounts.confirm} tone="confirm" />
              <ChecklistSheetMetric label="所持済み" value={sheetCounts.owned} tone="owned" />
              <ChecklistSheetMetric label="確認済み" value={sheetCounts.checked} tone="checked" />
            </div>
          </section>

          <div className="mt-4 space-y-4">
            {checklist.categories.map((category) => (
              <ChecklistSheetCategory
                key={category.id}
                category={category}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChecklistSheetMetric({
  label,
  value,
  tone
}: {
  label: string;
  value: number;
  tone: "missing" | "confirm" | "owned" | "checked";
}) {
  const toneClass =
    tone === "missing"
      ? "bg-red-50 text-red-700"
      : tone === "confirm"
        ? "bg-amber-50 text-amber-800"
        : tone === "owned"
          ? "bg-forest-50 text-forest-800"
          : "bg-blue-50 text-blue-700";

  return (
    <div className={`rounded-lg px-2 py-2 ${toneClass}`}>
      <p className="text-[10px] font-bold leading-none">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value.toLocaleString("ja-JP")}</p>
    </div>
  );
}

function ChecklistSheetCategory({ category }: { category: ChecklistCategory }) {
  return (
    <section className="overflow-hidden rounded-lg bg-white shadow-soft">
      <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
        <h3 className="text-sm font-bold text-ink">{category.label}</h3>
        <span className="text-xs font-bold text-stone-500">
          {category.items.length.toLocaleString("ja-JP")} 件
        </span>
      </div>
      <div className="divide-y divide-stone-100">
        {category.items.map((item) => (
          <ChecklistSheetRow
            key={`${category.id}-${item.id}`}
            item={item}
            categoryLabel={category.label}
          />
        ))}
      </div>
    </section>
  );
}

function ChecklistSheetRow({
  item,
  categoryLabel
}: {
  item: ChecklistItem;
  categoryLabel: string;
}) {
  const status = getChecklistSheetItemStatus(item);

  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3">
      <span
        className={`flex h-5 w-5 items-center justify-center rounded border ${
          status.checked
            ? "border-forest-700 bg-forest-700 text-white"
            : "border-stone-300 bg-white text-stone-300"
        }`}
        aria-hidden="true"
      >
        {status.checked ? <Check className="h-3.5 w-3.5" /> : null}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-ink">{item.label}</p>
        <p className="mt-0.5 text-[11px] font-semibold text-stone-500">
          {categoryLabel}
        </p>
      </div>
      <span className={`rounded px-2 py-1 text-[11px] font-bold ${status.className}`}>
        {status.label}
      </span>
    </div>
  );
}

function getChecklistSheetCounts(checklist: ReturnType<typeof buildPlanChecklist>) {
  const counts = {
    missing: 0,
    confirm: 0,
    owned: 0,
    checked: 0
  };

  for (const category of checklist.categories) {
    for (const item of category.items) {
      const status = getChecklistSheetItemStatus(item);

      if (status.kind === "MISSING") {
        counts.missing += 1;
      } else if (status.kind === "CONFIRM") {
        counts.confirm += 1;
      } else if (status.kind === "OWNED") {
        counts.owned += 1;
      } else {
        counts.checked += 1;
      }
    }
  }

  return counts;
}

function getChecklistSheetItemStatus(item: ChecklistItem) {
  if (item.matchingOwnedGear.length > 0) {
    return {
      kind: "OWNED" as const,
      label: "所持済み",
      checked: true,
      className: "bg-forest-50 text-forest-800"
    };
  }

  if (item.checked) {
    return {
      kind: "CHECKED" as const,
      label: "確認済み",
      checked: true,
      className: "bg-blue-50 text-blue-700"
    };
  }

  const actionStatus = getPreDepartureItemActionStatus(item);

  if (actionStatus === "MISSING") {
    return {
      kind: "MISSING" as const,
      label: "不足",
      checked: false,
      className: "bg-red-50 text-red-700"
    };
  }

  return {
    kind: "CONFIRM" as const,
    label: "確認する",
    checked: false,
    className: "bg-stone-100 text-stone-600"
  };
}

function formatChecklistSheetDate(value: string) {
  return value ? value.replaceAll("-", "/") : "予定日未設定";
}

function filterCheckedSlotsForPlan(
  checkedSlots: readonly RequirementSlot[],
  plan: PackRequirementPlan
) {
  const missingSlots = new Set(
    plan.required_slots
      .filter((slotPlan) => slotPlan.coverage_status === "MISSING")
      .map((slotPlan) => slotPlan.slot)
  );

  return uniqueRequirementSlots(checkedSlots).filter((slot) => missingSlots.has(slot));
}

function uniqueRequirementSlots(values: readonly unknown[]) {
  const slots: RequirementSlot[] = [];

  for (const value of values) {
    if (
      isSupportedRequirementSlot(value) &&
      !slots.includes(value as RequirementSlot)
    ) {
      slots.push(value as RequirementSlot);
    }
  }

  return slots;
}

function uniqueChecklistOnlyIds(values: readonly unknown[]) {
  const ids: string[] = [];

  for (const value of values) {
    if (isSupportedChecklistOnlyId(value) && !ids.includes(value)) {
      ids.push(value);
    }
  }

  return ids;
}

function dedupeDisplaySlots(
  slots: readonly PackRequirementSlotPlan[]
): DisplayRequirementSlotPlan[] {
  const displaySlots = new Map<string, DisplayRequirementSlotPlan>();

  for (const slotPlan of slots) {
    const displayKey = getRequirementSlotDisplayKey(slotPlan.slot);
    const existingSlot = displaySlots.get(displayKey);

    if (existingSlot) {
      existingSlot.slots.push(slotPlan.slot);

      if (slotPlan.coverage_status === "MISSING") {
        existingSlot.missingSlots.push(slotPlan.slot);
      }

      existingSlot.coverage_status =
        existingSlot.coverage_status === "COVERED" &&
        slotPlan.coverage_status === "COVERED"
          ? "COVERED"
          : "MISSING";
      existingSlot.matching_owned_gear = uniqueGearMatches([
        ...existingSlot.matching_owned_gear,
        ...slotPlan.matching_owned_gear
      ]);
      continue;
    }

    displaySlots.set(displayKey, {
      ...slotPlan,
      displayKey,
      slots: [slotPlan.slot],
      missingSlots: slotPlan.coverage_status === "MISSING" ? [slotPlan.slot] : []
    });
  }

  return Array.from(displaySlots.values());
}

function getRequirementSlotDisplayKey(slot: RequirementSlot) {
  if (slot === "WATER_STORAGE" || slot === "WATER_TREATMENT") {
    return "WATER";
  }

  if (slot === "RAIN_JACKET" || slot === "RAIN_PANTS") {
    return "RAIN_GEAR";
  }

  return slot;
}

function uniqueGearMatches(matches: GearMatchingOwnedGearMatch[]) {
  const gearById = new Map<string, GearMatchingOwnedGearMatch>();

  for (const match of matches) {
    gearById.set(match.id, match);
  }

  return Array.from(gearById.values());
}

function mergeCompatibilityMatches(
  slotPlan: DisplayRequirementSlotPlan,
  compatibilityBySlot: Partial<Record<RequirementSlot, GearMatchingResult>>
): DisplayGearMatchingResult {
  const matches = slotPlan.slots
    .map((slot) => compatibilityBySlot[slot])
    .filter((match): match is GearMatchingResult => Boolean(match));

  return {
    slot: slotPlan.slot,
    compatible_categories: uniqueStrings(
      matches.flatMap((match) => match.compatible_categories)
    ),
    compatible_subcategories: uniqueStrings(
      matches.flatMap((match) => match.compatible_subcategories)
    ),
    matching_owned_gear: uniqueGearMatches(
      matches.flatMap((match) => match.matching_owned_gear)
    ),
    matching_database_gear: uniqueDatabaseGearMatches(
      matches.flatMap((match) => match.matching_database_gear)
    ),
    confidence: mergeGearMatchingConfidence(matches),
    ambiguous_cases: uniqueStrings(matches.flatMap((match) => match.ambiguous_cases))
  };
}

function uniqueDatabaseGearMatches(matches: GearMatchingDatabaseGearMatch[]) {
  const gearById = new Map<string, GearMatchingDatabaseGearMatch>();

  for (const match of matches) {
    gearById.set(match.id, match);
  }

  return Array.from(gearById.values());
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values));
}

function mergeGearMatchingConfidence(matches: GearMatchingResult[]) {
  if (matches.some((match) => match.confidence === "LOW")) {
    return "LOW";
  }

  if (matches.some((match) => match.confidence === "MEDIUM")) {
    return "MEDIUM";
  }

  return "HIGH";
}

function PreDepartureConfirmationPanel({
  summary,
  progressPercent,
  onShowAllItems,
  onOpenChecklistSheet
}: {
  summary: PreDepartureSummary;
  progressPercent: number;
  onShowAllItems: () => void;
  onOpenChecklistSheet: () => void;
}) {
  const [completionMessage, setCompletionMessage] = useState<string | null>(null);

  function handleComplete() {
    setCompletionMessage(
      summary.canComplete
        ? "出発前確認が完了しました"
        : "不足または未確認の項目があります"
    );
  }

  return (
    <section className="rounded-lg border border-forest-100 bg-white p-4 shadow-soft sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-bold text-forest-700">出発前の最終確認</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-normal text-ink">
            {summary.statusLabel}
          </h2>
          <p className="mt-2 text-sm font-medium leading-6 text-stone-600">
            {summary.statusDescription}
          </p>
        </div>
        <div className="rounded-lg bg-stone-50 px-4 py-3 text-right">
          <p className="text-xs font-bold text-stone-500">準備進捗</p>
          <p className="mt-1 text-2xl font-semibold text-ink">{progressPercent}%</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <PreDepartureMetric
          label="不足"
          value={summary.missingCount}
          tone={summary.missingCount > 0 ? "missing" : "ok"}
        />
        <PreDepartureMetric
          label="未確認"
          value={summary.confirmationCount}
          tone={summary.confirmationCount > 0 ? "confirm" : "ok"}
        />
        <PreDepartureMetric
          label="重要確認"
          value={summary.importantConfirmationCount}
          tone={summary.importantConfirmationCount > 0 ? "confirm" : "ok"}
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <PreDepartureSummaryGroup
          title="不足しているもの"
          emptyLabel="不足はありません"
          items={summary.missingItems}
          tone="missing"
        />
        <PreDepartureSummaryGroup
          title="出発前に確認するもの"
          emptyLabel="未確認はありません"
          items={summary.confirmationItems}
          tone="confirm"
        />
        <PreDepartureSummaryGroup
          title="安全に関わる確認"
          emptyLabel="安全確認はありません"
          items={summary.importantItems}
          tone="important"
        />
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {completionMessage ? (
          <p
            className={`rounded-lg px-3 py-2 text-sm font-bold ${
              summary.canComplete
                ? "bg-forest-50 text-forest-800"
                : "bg-amber-50 text-amber-800"
            }`}
          >
            {completionMessage}
          </p>
        ) : (
          <p className="text-xs font-semibold leading-5 text-stone-500">
            不足がなく、安全に関わる未確認がない場合に完了できます。
          </p>
        )}
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onOpenChecklistSheet}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-5 text-sm font-bold text-ink transition active:scale-[0.99]"
          >
            <ClipboardList className="h-4 w-4" aria-hidden="true" />
            チェック表を見る
          </button>
          <button
            type="button"
            onClick={onShowAllItems}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-forest-200 bg-white px-5 text-sm font-bold text-forest-700 transition active:scale-[0.99]"
          >
            すべての持ち物を見る
          </button>
          <button
            type="button"
            onClick={handleComplete}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-forest-700 px-5 text-sm font-bold text-white shadow-sm transition active:scale-[0.99]"
          >
            出発前確認を完了
          </button>
        </div>
      </div>
    </section>
  );
}

function PreDepartureMetric({
  label,
  value,
  tone
}: {
  label: string;
  value: number;
  tone: "missing" | "confirm" | "ok";
}) {
  const toneClass =
    tone === "missing"
      ? "bg-red-50 text-red-700"
      : tone === "confirm"
        ? "bg-amber-50 text-amber-800"
        : "bg-forest-50 text-forest-800";

  return (
    <div className={`rounded-lg px-3 py-2 text-center ${toneClass}`}>
      <p className="text-[11px] font-bold">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value.toLocaleString("ja-JP")}</p>
    </div>
  );
}

function PreDepartureSummaryGroup({
  title,
  emptyLabel,
  items,
  tone
}: {
  title: string;
  emptyLabel: string;
  items: PreDepartureSummary["missingItems"];
  tone: "missing" | "confirm" | "important";
}) {
  const visibleItems = items.slice(0, 3);
  const remainingCount = items.length - visibleItems.length;
  const dotClass =
    tone === "missing"
      ? "bg-red-500"
      : tone === "confirm"
        ? "bg-amber-500"
        : "bg-forest-700";

  return (
    <div className="rounded-lg border border-stone-100 bg-stone-50 p-3">
      <h3 className="text-sm font-bold text-ink">{title}</h3>
      {visibleItems.length > 0 ? (
        <div className="mt-2 space-y-2">
          {visibleItems.map((item) => (
            <div key={`${title}-${item.id}`} className="flex items-start gap-2">
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dotClass}`} />
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-ink">{item.label}</p>
                <p className="text-[11px] font-semibold text-stone-500">
                  {item.categoryLabel}
                </p>
              </div>
            </div>
          ))}
          {remainingCount > 0 ? (
            <p className="text-xs font-bold text-stone-500">
              残り {remainingCount.toLocaleString("ja-JP")} 件
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mt-2 text-xs font-semibold text-stone-500">{emptyLabel}</p>
      )}
    </div>
  );
}

function ChecklistScanControls({
  activeFilter,
  summary,
  onFilterChange
}: {
  activeFilter: ChecklistScanFilter;
  summary: PreDepartureSummary;
  onFilterChange: (filter: ChecklistScanFilter) => void;
}) {
  const filters: Array<{
    value: ChecklistScanFilter;
    label: string;
    count?: number;
  }> = [
    {
      value: "ACTION",
      label: "要対応",
      count: summary.missingCount + summary.confirmationCount
    },
    { value: "MISSING", label: "不足", count: summary.missingCount },
    { value: "CONFIRM", label: "未確認", count: summary.confirmationCount },
    { value: "IMPORTANT", label: "重要", count: summary.importantConfirmationCount },
    { value: "ALL", label: "すべての持ち物" }
  ];

  return (
    <div className="rounded-lg bg-white p-3 shadow-soft">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <p className="text-xs font-bold text-forest-700">臨行前スキャン</p>
        <p className="text-[11px] font-semibold leading-5 text-stone-500">
          すべての持ち物と確認状態を見られます
        </p>
      </div>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
        {filters.map((filter) => {
          const isActive = activeFilter === filter.value;

          return (
            <button
              key={filter.value}
              type="button"
              onClick={() => onFilterChange(filter.value)}
              className={`shrink-0 rounded-full px-3 py-2 text-xs font-bold transition ${
                isActive
                  ? "bg-forest-700 text-white"
                  : "bg-stone-100 text-stone-700"
              }`}
            >
              {filter.label}
              {typeof filter.count === "number" ? (
                <span className="ml-1">{filter.count.toLocaleString("ja-JP")}</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function filterChecklistCategoriesForScan(
  categories: ChecklistCategory[],
  filter: ChecklistScanFilter
): ChecklistCategory[] {
  if (filter === "ALL") {
    return categories;
  }

  return categories
    .map((category) => {
      const filteredItems = category.items.filter((item) => {
        const actionStatus = getPreDepartureItemActionStatus(item);
        const isImportant = isImportantPreDepartureItem(category, item);

        if (filter === "ACTION") {
          return actionStatus !== "DONE";
        }

        if (filter === "MISSING") {
          return actionStatus === "MISSING";
        }

        if (filter === "CONFIRM") {
          return actionStatus === "CONFIRM";
        }

        return isImportant && actionStatus !== "DONE";
      });

      return {
        ...category,
        priorityGroups: category.priorityGroups
          .map((group) => ({
            ...group,
            items: group.items.filter((item) => filteredItems.includes(item))
          }))
          .filter((group) => group.items.length > 0),
        items: filteredItems
      };
    })
    .filter((category) => category.items.length > 0);
}

function getChecklistScanFilterLabel(filter: ChecklistScanFilter) {
  const labels: Record<ChecklistScanFilter, string> = {
    ACTION: "要対応",
    MISSING: "不足",
    CONFIRM: "未確認",
    IMPORTANT: "重要",
    ALL: "すべての持ち物"
  };

  return labels[filter];
}

function HeroReadinessCard({
  plan,
  checkedCount,
  missingCount,
  totalCount,
  progressPercent
}: {
  plan: PackRequirementPlan;
  checkedCount: number;
  missingCount: number;
  totalCount: number;
  progressPercent: number;
}) {
  const mountainBrief = buildMountainBrief(plan);

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
                  {progressPercent}%
                </p>
                <p className="text-sm font-semibold text-stone-200">総完成度</p>
              </div>
              <div className="rounded-lg bg-white/10 px-4 py-3 sm:hidden">
                <p className="text-4xl font-semibold tracking-normal text-red-200">
                  {missingCount.toLocaleString("ja-JP")}
                </p>
                <p className="text-sm font-semibold text-stone-200">未完了</p>
              </div>
            </div>
          </div>
          <div className="mt-5 max-w-2xl space-y-1 text-sm font-medium leading-6 text-stone-200">
            {mountainBrief.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>

        <div className="hidden grid-cols-3 border-t border-white/10 bg-white/5 sm:grid lg:border-l lg:border-t-0">
          <ReadinessMetric
            label="完了"
            value={checkedCount}
            suffix={`/${totalCount}`}
            tone="covered"
          />
          <ReadinessMetric
            label="未完了"
            value={missingCount}
            suffix="件"
            tone="missing"
          />
          <ReadinessMetric
            label="完成度"
            value={progressPercent}
            suffix="%"
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

function DecisionChipsSection({ chips }: { chips: PlanDecisionChip[] }) {
  return (
    <section className="rounded-lg bg-white p-4 shadow-soft sm:p-5">
      <div className="flex items-center gap-2">
        <CircleAlert className="h-4 w-4 text-forest-700" aria-hidden="true" />
        <h2 className="text-sm font-bold text-ink">判断根拠</h2>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {chips.map((chip) => (
          <span
            key={chip.label}
            title={chip.reason}
            className="inline-flex items-center rounded-full bg-forest-50 px-3 py-1.5 text-xs font-bold text-forest-800"
          >
            {chip.label}
          </span>
        ))}
      </div>
    </section>
  );
}

function NotNeededItemsSection({ items }: { items: PlanNotNeededItem[] }) {
  return (
    <section className="rounded-lg bg-white p-4 shadow-soft sm:p-5">
      <div className="flex items-center gap-2">
        <Check className="h-4 w-4 text-forest-700" aria-hidden="true" />
        <h2 className="text-sm font-bold text-ink">今回不要なもの</h2>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-stone-100 bg-stone-50 px-3 py-2"
          >
            <p className="text-sm font-bold text-ink">{item.label}</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-stone-500">
              {item.reason}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function buildMountainBrief(plan: PackRequirementPlan) {
  const { mountain } = plan;
  const lines = [
    `${formatMountainStatus(mountain.is_hyakumeizan)}標高${mountain.elevation_m.toLocaleString("ja-JP")}mの山です。`,
    getMountainConditionLine(plan),
    `本チェックリストは現在の${mountainFoundationStyleLabels[plan.style]}計画に基づいています。`
  ];

  return lines.filter(Boolean).slice(0, 4);
}

function formatMountainStatus(isHyakumeizan: boolean) {
  return isHyakumeizan ? "日本百名山の一座で、" : "";
}

function getMountainConditionLine(plan: PackRequirementPlan) {
  const { mountain, season } = plan;

  if (mountain.volcanic_risk === "ACTIVE_RESTRICTED") {
    return "火山情報と入山規制を確認し、行動判断を慎重に行う必要があります。";
  }

  if (mountain.alpine_environment === "HIGH_ALPINE_EXPOSED") {
    return "稜線や高所では天候変化が大きく、防寒と雨具の確認が重要です。";
  }

  if (mountain.alpine_environment === "ABOVE_TREELINE") {
    return "森林限界を越える区間では風雨と低温への備えが必要です。";
  }

  if (
    mountain.snow_or_ice_risk === "LIKELY" ||
    mountain.snow_or_ice_risk === "WINTER_ALPINE"
  ) {
    return "雪や凍結を前提に、足まわりと防寒装備を丁寧に確認してください。";
  }

  if (
    mountain.snow_or_ice_risk === "SEASONAL_PATCHES" &&
    (season === "SPRING" || season === "AUTUMN" || season === "WINTER")
  ) {
    return "季節により残雪や凍結が出るため、直前の登山道状況を確認してください。";
  }

  if (mountain.route_seriousness === "HIGH" || mountain.route_seriousness === "EXTREME") {
    return "行動時間とエスケープルートを確認し、余裕のある準備が必要です。";
  }

  return "天候変化と行動時間を確認し、基本装備を一つずつ準備してください。";
}

function ChecklistStat({
  label,
  value,
  tone = "neutral"
}: {
  label: string;
  value: string;
  tone?: "neutral" | "missing";
}) {
  return (
    <div className="rounded-lg border border-stone-100 bg-white px-3 py-2 shadow-soft sm:min-w-24">
      <p className="text-[11px] font-semibold text-stone-500">{label}</p>
      <p
        className={`mt-1 text-lg font-semibold ${
          tone === "missing" ? "text-red-700" : "text-ink"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function ChecklistCategoryCard({
  category,
  compatibilityBySlot,
  onToggle
}: {
  category: ChecklistCategory;
  compatibilityBySlot: Partial<Record<RequirementSlot, GearMatchingResult>>;
  onToggle: (item: ChecklistItem) => void;
}) {
  return (
    <article className="rounded-lg bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-ink">{category.label}</h3>
          <p className="mt-1 text-xs font-semibold text-stone-500">
            {category.progress.checkedCount.toLocaleString("ja-JP")} 完了
            {category.progress.missingCount > 0 ? (
              <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-red-700">
                不足 {category.progress.missingCount.toLocaleString("ja-JP")}
              </span>
            ) : (
              <span className="ml-2 rounded-full bg-forest-50 px-2 py-0.5 text-forest-800">
                不足なし
              </span>
            )}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold tracking-normal text-forest-800">
            {category.progress.percent}%
          </p>
          <div className="mt-2 h-1.5 w-20 overflow-hidden rounded-full bg-stone-100">
            <div
              className="h-full rounded-full bg-forest-700"
              style={{ width: `${category.progress.percent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {category.priorityGroups.map((group) => (
          <div key={group.priority}>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-px flex-1 bg-stone-100" />
              <p className="text-xs font-semibold text-stone-500">
                {checklistPriorityLabels[group.priority]}
              </p>
              <span className="h-px flex-1 bg-stone-100" />
            </div>
            <div className="space-y-2">
              {group.items.map((item) => (
                <ChecklistItemRow
                  key={item.id}
                  item={item}
                  compatibilityBySlot={compatibilityBySlot}
                  onToggle={onToggle}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function ChecklistItemRow({
  item,
  compatibilityBySlot,
  onToggle
}: {
  item: ChecklistItem;
  compatibilityBySlot: Partial<Record<RequirementSlot, GearMatchingResult>>;
  onToggle: (item: ChecklistItem) => void;
}) {
  const canToggle = item.source === "CHECKLIST_ONLY" || item.toggleSlots.length > 0;
  const ItemIcon = checklistItemIcons[item.icon];
  const status = getChecklistItemStatus(item);
  const matchingInsight = getChecklistItemMatchingInsight(item, compatibilityBySlot);

  return (
    <label
      className={`flex min-h-14 gap-3 rounded-lg border px-3 py-2.5 transition ${
        item.checked
          ? "border-forest-100 bg-forest-50/70"
          : "border-stone-100 bg-white hover:border-stone-200"
      } ${canToggle ? "cursor-pointer" : ""}`}
    >
      <input
        type="checkbox"
        className="sr-only"
        checked={item.checked}
        disabled={!canToggle}
        onChange={() => onToggle(item)}
      />
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-700">
        <ItemIcon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
          item.checked
            ? "border-forest-700 bg-forest-700 text-white"
            : "border-stone-300 bg-white text-stone-400"
        }`}
      >
        {item.checked ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <CircleDashed className="h-3.5 w-3.5" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-ink">{item.label}</span>
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${status.className}`}>
            {status.label}
          </span>
        </span>
        {item.matchingOwnedGear.length > 0 ? (
          <span className="mt-1 block truncate text-xs font-medium text-stone-500">
            {item.matchingOwnedGear.map(formatOwnedGearName).join(" / ")}
          </span>
        ) : null}
        {matchingInsight ? (
          <span className="mt-1 block text-xs font-medium leading-5 text-forest-800">
            {matchingInsight.coverage}
          </span>
        ) : null}
        {matchingInsight?.caution ? (
          <span className="mt-1 block rounded-lg bg-amber-50 px-2 py-1.5 text-xs font-medium leading-5 text-amber-800">
            {matchingInsight.caution}
          </span>
        ) : null}
        <span className="mt-1 block text-xs font-medium leading-5 text-stone-500">
          {item.reason}
        </span>
      </span>
    </label>
  );
}

const checklistItemIcons: Record<ChecklistItemIcon, LucideIcon> = {
  baseLayer: Shirt,
  midLayer: Shirt,
  insulation: Snowflake,
  rainwear: CloudRain,
  hat: Sparkles,
  gloves: Hand,
  gaiters: Footprints,
  backpack: Backpack,
  trekkingPoles: Footprints,
  sunglasses: Glasses,
  water: Droplets,
  trailFood: Cookie,
  meal: Soup,
  stove: CookingPot,
  cookPot: Utensils,
  fuel: PlugZap,
  navigationApp: Navigation,
  mapCompass: Compass,
  headlamp: Lamp,
  battery: Battery,
  firstAid: BriefcaseMedical,
  insurance: IdCard,
  whistle: Volume2,
  emergencySheet: ShieldAlert,
  helmet: HardHat,
  traction: Zap,
  crampons: Snowflake,
  iceAxe: Axe,
  bearProtection: Bell,
  riverShoes: Footprints,
  portableToilet: Toilet,
  tent: Tent,
  sleepingBag: Bed,
  sleepingPad: Bed,
  pegs: Hammer,
  groundsheet: MapIcon,
  innerSheet: House,
  toiletries: Sparkles,
  earplugs: Bean
};

function getChecklistItemStatus(item: ChecklistItem) {
  if (item.matchingOwnedGear.length > 0) {
    return {
      label: "所持済み",
      className: "bg-forest-50 text-forest-800"
    };
  }

  if (item.source === "GEAR_BACKED" && item.checked) {
    return {
      label: "確認済み",
      className: "bg-blue-50 text-blue-700"
    };
  }

  if (item.source === "GEAR_BACKED") {
    return {
      label: "不足",
      className: "bg-red-50 text-red-700"
    };
  }

  if (item.checked) {
    return {
      label: "確認済み",
      className: "bg-blue-50 text-blue-700"
    };
  }

  return {
    label: "確認する",
    className: "bg-stone-100 text-stone-600"
  };
}

function getChecklistItemMatchingInsight(
  item: ChecklistItem,
  compatibilityBySlot: Partial<Record<RequirementSlot, GearMatchingResult>>
) {
  if (item.matchingOwnedGear.length === 0) {
    return null;
  }

  const matchedResults = item.slots
    .map((slot) => compatibilityBySlot[slot])
    .filter((match): match is GearMatchingResult => Boolean(match));
  const confidence =
    matchedResults.length > 0 ? mergeGearMatchingConfidence(matchedResults) : "HIGH";
  const firstGear = item.matchingOwnedGear[0];
  const classification =
    firstGear.gear_subcategories?.name_ja ??
    firstGear.gear_categories?.name_ja ??
    "登録装備";
  const coverage =
    item.matchingOwnedGear.length > 1
      ? `${classification}など ${item.matchingOwnedGear.length.toLocaleString("ja-JP")} 件の登録装備で、${item.label}をカバーしています。`
      : `${classification}として登録されているため、${item.label}をカバーしています。`;
  const hasAmbiguity = matchedResults.some((match) => match.ambiguous_cases.length > 0);
  const caution =
    confidence === "HIGH" && !hasAmbiguity
      ? null
      : "分類が近いため候補にしています。出発前に用途を確認してください。";

  return {
    coverage,
    caution
  };
}

function CompatibleGearSlot({
  slotPlan,
  match
}: {
  slotPlan: DisplayRequirementSlotPlan;
  match: DisplayGearMatchingResult;
}) {
  return (
    <article className="py-4 first:pt-0 last:pb-0">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-semibold text-ink">{requirementSlotLabels[slotPlan.slot]}</h3>
        <span className="text-xs font-semibold text-stone-500">
          判定の確かさ: {gearMatchingConfidenceLabels[match.confidence]}
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
  missingCount,
  displaySlots,
  compatibilityBySlot
}: {
  missingCount: number;
  displaySlots: DisplayRequirementSlotPlan[];
  compatibilityBySlot: Partial<Record<RequirementSlot, GearMatchingResult>>;
}) {
  const ambiguousSlots = displaySlots.filter((slotPlan) => {
    return slotPlan.slots.some((slot) => {
      return (compatibilityBySlot[slot]?.ambiguous_cases.length ?? 0) > 0;
    });
  });

  return (
    <div className="mt-4 space-y-2">
      {missingCount > 0 ? (
        <p className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-900">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>不足・未確認の項目を先に確認してください: {missingCount.toLocaleString("ja-JP")} 件</span>
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
  return formatDisplayGearName({
    brand: gear.brand,
    model: gear.model,
    name: gear.name
  });
}

function formatDatabaseGearName(gear: GearMatchingDatabaseGearMatch) {
  return formatDisplayGearName({
    brand: gear.brand,
    model: gear.model,
    name: gear.name_ja
  });
}

function formatDisplayGearName({
  brand,
  model,
  name
}: {
  brand: string | null;
  model: string | null;
  name: string | null;
}) {
  const primaryName = [brand, model].filter(Boolean).join(" ").trim();

  if (primaryName && name && !primaryName.includes(name)) {
    return `${primaryName}（${name}）`;
  }

  return primaryName || name || "登録装備";
}
