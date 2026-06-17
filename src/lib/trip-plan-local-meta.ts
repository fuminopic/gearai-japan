export type TripPlanLocalMeta = {
  plannedDate: string;
  tripMemo: string;
};

export function getTripPlanMetaStorageKey(planId: string) {
  return `yamajitaku:trip-plan-meta:${planId}`;
}

export function readTripPlanLocalMeta(planId: string): TripPlanLocalMeta | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedValue = window.localStorage.getItem(getTripPlanMetaStorageKey(planId));

    if (!storedValue) {
      return null;
    }

    const parsed = JSON.parse(storedValue);

    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    return {
      plannedDate:
        typeof parsed.plannedDate === "string" ? parsed.plannedDate : "",
      tripMemo: typeof parsed.tripMemo === "string" ? parsed.tripMemo : ""
    };
  } catch {
    return null;
  }
}

export function writeTripPlanLocalMeta(planId: string, meta: TripPlanLocalMeta) {
  if (typeof window === "undefined") {
    return;
  }

  const plannedDate = sanitizeLocalDate(meta.plannedDate);
  const tripMemo = sanitizeLocalMemo(meta.tripMemo);
  const storageKey = getTripPlanMetaStorageKey(planId);

  if (!plannedDate && !tripMemo) {
    window.localStorage.removeItem(storageKey);
    return;
  }

  window.localStorage.setItem(
    storageKey,
    JSON.stringify({
      plannedDate,
      tripMemo
    })
  );
}

function sanitizeLocalDate(value: string) {
  const trimmed = value.trim();

  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : "";
}

function sanitizeLocalMemo(value: string) {
  return value.trim().slice(0, 200);
}
