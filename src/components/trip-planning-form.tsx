"use client";

import { useMemo, useState } from "react";
import { ClipboardCheck } from "lucide-react";

import {
  mountainFoundationSeasonLabels,
  mountainFoundationStyleLabels
} from "@/lib/i18n/labels";
import type {
  MountainFoundationProfile,
  MountainFoundationSeason,
  MountainFoundationStyle
} from "@/lib/types";

type TripPlanningFormProps = {
  mountains: MountainFoundationProfile[];
  selectedMountainSlug: string;
  selectedSeason: MountainFoundationSeason;
  selectedStyle: MountainFoundationStyle;
  error?: string;
};

export function TripPlanningForm({
  mountains,
  selectedMountainSlug,
  selectedSeason,
  selectedStyle,
  error
}: TripPlanningFormProps) {
  const initialMountainSlug = getAvailableMountainSlug(selectedMountainSlug, mountains);
  const [mountainSlug, setMountainSlug] = useState(initialMountainSlug);
  const selectedMountain = useMemo(() => {
    return mountains.find((mountain) => mountain.slug === mountainSlug) ?? mountains[0];
  }, [mountainSlug, mountains]);
  const seasonOptions = selectedMountain?.supported_seasons ?? [];
  const styleOptions = selectedMountain?.supported_styles ?? [];
  const effectiveSeason = seasonOptions.includes(selectedSeason)
    ? selectedSeason
    : seasonOptions[0];
  const effectiveStyle = styleOptions.includes(selectedStyle)
    ? selectedStyle
    : styleOptions[0];

  return (
    <form action="/plan" className="rounded-lg bg-white p-4 shadow-soft sm:p-5">
      {error ? (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}

      <div className="grid gap-3 md:grid-cols-[1.3fr_1fr_1fr]">
        <label className="block">
          <span className="text-sm font-medium text-stone-700">山</span>
          <select
            name="mountain"
            value={mountainSlug}
            required
            onChange={(event) => setMountainSlug(event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-2.5 text-base outline-none focus:border-forest-500 focus:bg-white sm:mt-2 sm:py-3"
          >
            {mountains.length === 0 ? (
              <option value="">山データを読み込めません</option>
            ) : (
              mountains.map((mountain) => (
                <option key={mountain.slug} value={mountain.slug}>
                  {mountain.name_ja}
                </option>
              ))
            )}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-stone-700">季節</span>
          <select
            key={`${mountainSlug}-season`}
            name="season"
            defaultValue={effectiveSeason}
            required
            disabled={seasonOptions.length === 0}
            className="mt-1.5 w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-2.5 text-base outline-none focus:border-forest-500 focus:bg-white disabled:opacity-60 sm:mt-2 sm:py-3"
          >
            {seasonOptions.map((season) => (
              <option key={season} value={season}>
                {mountainFoundationSeasonLabels[season]}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-stone-700">スタイル</span>
          <select
            key={`${mountainSlug}-style`}
            name="style"
            defaultValue={effectiveStyle}
            required
            disabled={styleOptions.length === 0}
            className="mt-1.5 w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-2.5 text-base outline-none focus:border-forest-500 focus:bg-white disabled:opacity-60 sm:mt-2 sm:py-3"
          >
            {styleOptions.map((style) => (
              <option key={style} value={style}>
                {mountainFoundationStyleLabels[style]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button
        disabled={mountains.length === 0}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-forest-700 px-5 py-3 text-base font-semibold text-white transition hover:bg-forest-900 disabled:opacity-60 sm:mt-4 sm:py-4"
      >
        <ClipboardCheck className="h-5 w-5" />
        パック計画を作成
      </button>
    </form>
  );
}

function getAvailableMountainSlug(
  slug: string,
  mountains: readonly MountainFoundationProfile[]
) {
  if (mountains.some((mountain) => mountain.slug === slug)) {
    return slug;
  }

  return mountains[0]?.slug ?? "";
}
