import {
  buildLegacyTripPlanMetaStorageKey,
  readTripPlanMeta,
  removeTripPlanMeta,
  writeTripPlanMeta,
  type TripPlanMetaStorageValue
} from "@/lib/trip-plan-storage";

export type TripPlanLocalMeta = {
  plannedDate: string;
  plannedEndDate: string;
  tripMemo: string;
};

type TripPlanLocalMetaOptions = {
  userId?: string | null;
};

export function getTripPlanMetaStorageKey(planId: string) {
  return buildLegacyTripPlanMetaStorageKey(planId);
}

export function readTripPlanLocalMeta(
  planId: string,
  options: TripPlanLocalMetaOptions = {}
): TripPlanLocalMeta | null {
  return readTripPlanMeta({ planId, userId: options.userId });
}

export function writeTripPlanLocalMeta(
  planId: string,
  meta: TripPlanLocalMeta,
  options: TripPlanLocalMetaOptions = {}
) {
  writeTripPlanMeta({
    planId,
    userId: options.userId,
    value: meta satisfies TripPlanMetaStorageValue
  });
}

export function removeTripPlanLocalMeta(
  planId: string,
  options: TripPlanLocalMetaOptions = {}
) {
  removeTripPlanMeta({ planId, userId: options.userId });
}
