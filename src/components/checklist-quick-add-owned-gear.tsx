"use client";

import { Check, Loader2, PackagePlus, Plus, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { captureAnalyticsEvent } from "@/lib/analytics";
import { createGear } from "@/lib/actions/gear";
import { getGearCompatibilityRule } from "@/lib/gear-matching/engine";
import type {
  GearMatchingDatabaseGearMatch,
  GearMatchingResult,
  RequirementSlot
} from "@/lib/types";

type ChecklistQuickAddOwnedGearProps = {
  itemLabel: string;
  requirementSlots: RequirementSlot[];
  compatibilityBySlot: Partial<Record<RequirementSlot, GearMatchingResult>>;
};

export function ChecklistQuickAddOwnedGear({
  itemLabel,
  requirementSlots,
  compatibilityBySlot
}: ChecklistQuickAddOwnedGearProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  const [manualName, setManualName] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const submissionInFlightRef = useRef(false);
  const catalogCandidates = useMemo(
    () => getCatalogCandidates(requirementSlots, compatibilityBySlot),
    [compatibilityBySlot, requirementSlots]
  );
  const target = getGearCompatibilityRule(requirementSlots[0]).compatible_targets[0];

  function closeSheet() {
    if (isSaving) {
      return;
    }

    setIsOpen(false);
    setIsManualEntryOpen(false);
    setSubmitError("");
  }

  async function handleCatalogAdd(candidate: GearMatchingDatabaseGearMatch) {
    await submitOwnedGear({
      formData: buildCatalogGearFormData(candidate),
      category: candidate.category_id,
      isCatalogItem: true
    });
  }

  async function handleManualAdd() {
    const name = manualName.trim();

    if (!name) {
      setSubmitError("装備名を入力してください。");
      return;
    }

    const formData = new FormData();
    formData.set("category_id", target.category);
    formData.set("subcategory_id", target.subcategory);
    formData.set("name", name);
    formData.set("status", "owned");
    formData.set("weight_type", "base");

    await submitOwnedGear({
      formData,
      category: target.category,
      isCatalogItem: false
    });
  }

  async function submitOwnedGear({
    formData,
    category,
    isCatalogItem
  }: {
    formData: FormData;
    category: string;
    isCatalogItem: boolean;
  }) {
    if (submissionInFlightRef.current) {
      return;
    }

    submissionInFlightRef.current = true;
    setIsSaving(true);
    setSubmitError("");
    let didSave = false;

    try {
      const result = await createGear(formData);

      if (!result.ok) {
        setSubmitError(result.error);
        return;
      }

      didSave = true;
      captureAnalyticsEvent("gear_mark_owned", {
        source: "checklist",
        category,
        is_catalog_item: isCatalogItem
      });
      setIsOpen(false);
      router.refresh();
    } catch {
      setSubmitError("装備を保存できませんでした。もう一度お試しください。");
    } finally {
      if (!didSave) {
        submissionInFlightRef.current = false;
        setIsSaving(false);
      }
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="mt-2 inline-flex min-h-9 items-center gap-1.5 rounded border border-forest-200 bg-forest-50 px-2.5 text-xs font-semibold text-forest-800 transition hover:border-forest-400 hover:bg-forest-100"
      >
        <PackagePlus className="h-3.5 w-3.5" aria-hidden="true" />
        持ってる
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/40 sm:items-center sm:justify-center sm:p-6"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) {
              closeSheet();
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="quick-add-owned-gear-title"
            className="max-h-[88dvh] w-full overflow-y-auto rounded-t-lg bg-white px-5 pb-6 pt-4 shadow-xl sm:max-w-xl sm:rounded-lg"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-forest-800">所持品に追加</p>
                <h2 id="quick-add-owned-gear-title" className="mt-1 text-lg font-semibold text-ink">
                  {itemLabel}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeSheet}
                disabled={isSaving}
                aria-label="閉じる"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-stone-200 text-stone-600 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {catalogCandidates.length > 0 ? (
              <div className="mt-5">
                <h3 className="text-sm font-semibold text-ink">公式カタログの候補</h3>
                <div className="mt-2 space-y-2">
                  {catalogCandidates.map((candidate) => (
                    <button
                      key={candidate.id}
                      type="button"
                      onClick={() => void handleCatalogAdd(candidate)}
                      disabled={isSaving}
                      className="flex w-full items-center justify-between gap-3 rounded-lg border border-stone-200 px-3 py-3 text-left transition hover:border-forest-300 hover:bg-forest-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-ink">
                          {getCatalogCandidateTitle(candidate)}
                        </span>
                        <span className="mt-0.5 block truncate text-xs font-medium text-stone-500">
                          {candidate.gear_subcategories?.name_ja ?? candidate.subcategory_id ?? "装備"}
                        </span>
                      </span>
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-forest-700" aria-hidden="true" />
                      ) : (
                        <Check className="h-4 w-4 shrink-0 text-forest-700" aria-hidden="true" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-5 border-t border-stone-100 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsManualEntryOpen((current) => !current);
                  setSubmitError("");
                }}
                disabled={isSaving}
                className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-forest-800 transition hover:text-forest-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                自分の装備を追加
              </button>

              {isManualEntryOpen ? (
                <div className="mt-3">
                  <label htmlFor="quick-add-owned-gear-name" className="text-sm font-semibold text-ink">
                    装備名
                  </label>
                  <input
                    id="quick-add-owned-gear-name"
                    value={manualName}
                    onChange={(event) => setManualName(event.target.value)}
                    disabled={isSaving}
                    className="mt-1.5 min-h-11 w-full rounded border border-stone-300 px-3 text-sm text-ink outline-none transition focus:border-forest-600 focus:ring-2 focus:ring-forest-100 disabled:bg-stone-50"
                    placeholder="例: 手持ちのレインジャケット"
                  />
                  <button
                    type="button"
                    onClick={() => void handleManualAdd()}
                    disabled={isSaving || !manualName.trim()}
                    className="mt-3 inline-flex min-h-10 items-center gap-2 rounded bg-forest-700 px-3.5 text-sm font-semibold text-white transition hover:bg-forest-800 disabled:cursor-not-allowed disabled:bg-stone-300"
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                    所持品に追加
                  </button>
                </div>
              ) : null}
            </div>

            {submitError ? (
              <p role="alert" className="mt-4 rounded bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                {submitError}
              </p>
            ) : null}
          </section>
        </div>
      ) : null}
    </>
  );
}

function getCatalogCandidates(
  requirementSlots: RequirementSlot[],
  compatibilityBySlot: Partial<Record<RequirementSlot, GearMatchingResult>>
) {
  const candidates = new Map<string, GearMatchingDatabaseGearMatch>();

  for (const slot of requirementSlots) {
    for (const candidate of compatibilityBySlot[slot]?.matching_database_gear ?? []) {
      candidates.set(candidate.id, candidate);
    }
  }

  return Array.from(candidates.values());
}

function buildCatalogGearFormData(candidate: GearMatchingDatabaseGearMatch) {
  const formData = new FormData();

  formData.set("product_id", candidate.id);
  formData.set("category_id", candidate.category_id);
  formData.set("subcategory_id", candidate.subcategory_id ?? "");
  formData.set("name", getCatalogCandidateTitle(candidate));
  formData.set("brand", candidate.brand);
  formData.set("model", candidate.model);
  formData.set("status", "owned");
  formData.set("weight_type", "base");

  return formData;
}

function getCatalogCandidateTitle(candidate: GearMatchingDatabaseGearMatch) {
  return candidate.name_ja?.trim() || [candidate.brand, candidate.model].filter(Boolean).join(" ");
}
