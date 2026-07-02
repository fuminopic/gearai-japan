const TRIP_PLAN_STORAGE_VERSION = "v1";
const TRIP_PLAN_META_TTL_MS = 90 * 24 * 60 * 60 * 1000;

export type TripPlanMetaStorageValue = {
  plannedDate: string;
  plannedEndDate: string;
  tripMemo: string;
};

type StorageEnvelope<T> = {
  schemaVersion: typeof TRIP_PLAN_STORAGE_VERSION;
  updatedAt: string;
  expiresAt: string;
  value: T;
};

type TripPlanMetaStorageInput = {
  userId?: string | null;
  planId: string;
};

type TripPlanMetaWriteInput = TripPlanMetaStorageInput & {
  value: TripPlanMetaStorageValue;
};

export function buildTripPlanMetaStorageKey(userId: string, planId: string) {
  return `yamajitaku:${TRIP_PLAN_STORAGE_VERSION}:user:${userId}:trip-plan:${planId}:meta`;
}

export function buildLegacyTripPlanMetaStorageKey(planId: string) {
  return `yamajitaku:trip-plan-meta:${planId}`;
}

export function readTripPlanMeta({
  userId,
  planId
}: TripPlanMetaStorageInput): TripPlanMetaStorageValue | null {
  const storage = getLocalStorage();

  if (!storage) {
    return null;
  }

  if (userId) {
    const storageKey = buildTripPlanMetaStorageKey(userId, planId);
    const scopedValue = readScopedTripPlanMeta(storage, storageKey);

    if (scopedValue.status === "found") {
      return scopedValue.value;
    }
  }

  const legacyKey = buildLegacyTripPlanMetaStorageKey(planId);
  const legacyValue = readLegacyTripPlanMeta(storage, legacyKey);

  if (!legacyValue || !userId) {
    return legacyValue;
  }

  writeTripPlanMeta({ userId, planId, value: legacyValue });
  storage.removeItem(legacyKey);

  return legacyValue;
}

export function writeTripPlanMeta({
  userId,
  planId,
  value
}: TripPlanMetaWriteInput) {
  const storage = getLocalStorage();

  if (!storage) {
    return;
  }

  const nextValue = sanitizeTripPlanMeta(value);

  if (!nextValue.plannedDate && !nextValue.plannedEndDate && !nextValue.tripMemo) {
    removeTripPlanMeta({ userId, planId });
    return;
  }

  if (!userId) {
    storage.setItem(
      buildLegacyTripPlanMetaStorageKey(planId),
      JSON.stringify(nextValue)
    );
    return;
  }

  const now = new Date();
  const envelope: StorageEnvelope<TripPlanMetaStorageValue> = {
    schemaVersion: TRIP_PLAN_STORAGE_VERSION,
    updatedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + TRIP_PLAN_META_TTL_MS).toISOString(),
    value: nextValue
  };

  storage.setItem(
    buildTripPlanMetaStorageKey(userId, planId),
    JSON.stringify(envelope)
  );
  storage.removeItem(buildLegacyTripPlanMetaStorageKey(planId));
}

export function removeTripPlanMeta({ userId, planId }: TripPlanMetaStorageInput) {
  const storage = getLocalStorage();

  if (!storage) {
    return;
  }

  if (userId) {
    storage.removeItem(buildTripPlanMetaStorageKey(userId, planId));
  }

  storage.removeItem(buildLegacyTripPlanMetaStorageKey(planId));
}

function getLocalStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function readScopedTripPlanMeta(
  storage: Storage,
  storageKey: string
): { status: "found"; value: TripPlanMetaStorageValue | null } | { status: "missing" } {
  const storedValue = storage.getItem(storageKey);

  if (!storedValue) {
    return { status: "missing" };
  }

  try {
    const parsed = JSON.parse(storedValue);

    if (!isStorageEnvelope(parsed)) {
      storage.removeItem(storageKey);
      return { status: "found", value: null };
    }

    if (Date.parse(parsed.expiresAt) <= Date.now()) {
      storage.removeItem(storageKey);
      return { status: "found", value: null };
    }

    return {
      status: "found",
      value: sanitizeTripPlanMeta(parsed.value)
    };
  } catch {
    storage.removeItem(storageKey);
    return { status: "found", value: null };
  }
}

function readLegacyTripPlanMeta(
  storage: Storage,
  storageKey: string
): TripPlanMetaStorageValue | null {
  try {
    const storedValue = storage.getItem(storageKey);

    if (!storedValue) {
      return null;
    }

    const parsed = JSON.parse(storedValue);

    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    return sanitizeTripPlanMeta(parsed);
  } catch {
    return null;
  }
}

function isStorageEnvelope(value: unknown): value is StorageEnvelope<unknown> {
  if (!value || typeof value !== "object") {
    return false;
  }

  const envelope = value as Partial<StorageEnvelope<unknown>>;

  return (
    envelope.schemaVersion === TRIP_PLAN_STORAGE_VERSION &&
    typeof envelope.updatedAt === "string" &&
    typeof envelope.expiresAt === "string" &&
    "value" in envelope
  );
}

function sanitizeTripPlanMeta(value: unknown): TripPlanMetaStorageValue {
  if (!value || typeof value !== "object") {
    return {
      plannedDate: "",
      plannedEndDate: "",
      tripMemo: ""
    };
  }

  const meta = value as Partial<TripPlanMetaStorageValue>;

  return {
    plannedDate:
      typeof meta.plannedDate === "string" ? sanitizeLocalDate(meta.plannedDate) : "",
    plannedEndDate:
      typeof meta.plannedEndDate === "string"
        ? sanitizeLocalDate(meta.plannedEndDate)
        : "",
    tripMemo: typeof meta.tripMemo === "string" ? sanitizeLocalMemo(meta.tripMemo) : ""
  };
}

function sanitizeLocalDate(value: string) {
  const trimmed = value.trim();

  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : "";
}

function sanitizeLocalMemo(value: string) {
  return value.trim().slice(0, 200);
}
