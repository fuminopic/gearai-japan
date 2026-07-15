import type { RequirementSlot } from "@/lib/types";

const TRIP_PLAN_STORAGE_VERSION = "v1";
const TRIP_PLAN_META_TTL_MS = 90 * 24 * 60 * 60 * 1000;
const TRIP_PLAN_CHECKLIST_TTL_MS = 90 * 24 * 60 * 60 * 1000;

export type TripPlanMetaStorageValue = {
  plannedDate: string;
  plannedEndDate: string;
  tripMemo: string;
};

type TripPlanChecklistStorageReadSource = "scoped" | "legacy" | "none";
type TripPlanChecklistStorageReadStatus =
  | "found"
  | "missing"
  | "expired"
  | "invalid";

export type TripPlanChecklistStorageReadResult<T> = {
  status: TripPlanChecklistStorageReadStatus;
  source: TripPlanChecklistStorageReadSource;
  value: T;
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

type TripPlanCheckedSlotsWriteInput = TripPlanMetaStorageInput & {
  value: RequirementSlot[];
};

type TripPlanChecklistOnlyWriteInput = TripPlanMetaStorageInput & {
  value: string[];
};

export function buildTripPlanMetaStorageKey(userId: string, planId: string) {
  return `yamajitaku:${TRIP_PLAN_STORAGE_VERSION}:user:${userId}:trip-plan:${planId}:meta`;
}

export function buildLegacyTripPlanMetaStorageKey(planId: string) {
  return `yamajitaku:trip-plan-meta:${planId}`;
}

export function buildTripPlanCheckedSlotsStorageKey(
  userId: string,
  planId: string
) {
  return `yamajitaku:${TRIP_PLAN_STORAGE_VERSION}:user:${userId}:trip-plan:${planId}:checked-slots`;
}

export function buildLegacyTripPlanCheckedSlotsStorageKey(planId: string) {
  return `yamajitaku:trip-plan:checked-slots:${planId}`;
}

export function buildTripPlanUncheckedPackedSlotsStorageKey(
  userId: string,
  planId: string
) {
  return `yamajitaku:${TRIP_PLAN_STORAGE_VERSION}:user:${userId}:trip-plan:${planId}:unchecked-packed-slots`;
}

export function buildLegacyTripPlanUncheckedPackedSlotsStorageKey(planId: string) {
  return `yamajitaku:trip-plan:unchecked-packed-slots:${planId}`;
}

export function buildTripPlanChecklistOnlyStorageKey(
  userId: string,
  planId: string
) {
  return `yamajitaku:${TRIP_PLAN_STORAGE_VERSION}:user:${userId}:trip-plan:${planId}:checklist-only`;
}

export function buildLegacyTripPlanChecklistOnlyStorageKey(planId: string) {
  return `yamajitaku:trip-plan:checklist-only:${planId}`;
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

export function readTripPlanCheckedSlots({
  userId,
  planId
}: TripPlanMetaStorageInput): TripPlanChecklistStorageReadResult<
  RequirementSlot[]
> {
  return readTripPlanChecklistStorageArray({
    userId,
    planId,
    buildScopedKey: buildTripPlanCheckedSlotsStorageKey,
    buildLegacyKey: buildLegacyTripPlanCheckedSlotsStorageKey,
    sanitizeValue: sanitizeRequirementSlots
  });
}

export function writeTripPlanCheckedSlots({
  userId,
  planId,
  value
}: TripPlanCheckedSlotsWriteInput) {
  writeTripPlanChecklistStorageArray({
    userId,
    planId,
    value,
    buildScopedKey: buildTripPlanCheckedSlotsStorageKey,
    buildLegacyKey: buildLegacyTripPlanCheckedSlotsStorageKey,
    sanitizeValue: sanitizeRequirementSlots
  });
}

export function removeTripPlanCheckedSlots({
  userId,
  planId
}: TripPlanMetaStorageInput) {
  removeTripPlanChecklistStorageArray({
    userId,
    planId,
    buildScopedKey: buildTripPlanCheckedSlotsStorageKey,
    buildLegacyKey: buildLegacyTripPlanCheckedSlotsStorageKey
  });
}

export function readTripPlanUncheckedPackedSlots({
  userId,
  planId
}: TripPlanMetaStorageInput): TripPlanChecklistStorageReadResult<
  RequirementSlot[]
> {
  return readTripPlanChecklistStorageArray({
    userId,
    planId,
    buildScopedKey: buildTripPlanUncheckedPackedSlotsStorageKey,
    buildLegacyKey: buildLegacyTripPlanUncheckedPackedSlotsStorageKey,
    sanitizeValue: sanitizeRequirementSlots
  });
}

export function writeTripPlanUncheckedPackedSlots({
  userId,
  planId,
  value
}: TripPlanCheckedSlotsWriteInput) {
  writeTripPlanChecklistStorageArray({
    userId,
    planId,
    value,
    buildScopedKey: buildTripPlanUncheckedPackedSlotsStorageKey,
    buildLegacyKey: buildLegacyTripPlanUncheckedPackedSlotsStorageKey,
    sanitizeValue: sanitizeRequirementSlots
  });
}

export function removeTripPlanUncheckedPackedSlots({
  userId,
  planId
}: TripPlanMetaStorageInput) {
  removeTripPlanChecklistStorageArray({
    userId,
    planId,
    buildScopedKey: buildTripPlanUncheckedPackedSlotsStorageKey,
    buildLegacyKey: buildLegacyTripPlanUncheckedPackedSlotsStorageKey
  });
}

export function readTripPlanChecklistOnlyIds({
  userId,
  planId
}: TripPlanMetaStorageInput): TripPlanChecklistStorageReadResult<string[]> {
  return readTripPlanChecklistStorageArray({
    userId,
    planId,
    buildScopedKey: buildTripPlanChecklistOnlyStorageKey,
    buildLegacyKey: buildLegacyTripPlanChecklistOnlyStorageKey,
    sanitizeValue: sanitizeStringArray
  });
}

export function writeTripPlanChecklistOnlyIds({
  userId,
  planId,
  value
}: TripPlanChecklistOnlyWriteInput) {
  writeTripPlanChecklistStorageArray({
    userId,
    planId,
    value,
    buildScopedKey: buildTripPlanChecklistOnlyStorageKey,
    buildLegacyKey: buildLegacyTripPlanChecklistOnlyStorageKey,
    sanitizeValue: sanitizeStringArray
  });
}

export function removeTripPlanChecklistOnlyIds({
  userId,
  planId
}: TripPlanMetaStorageInput) {
  removeTripPlanChecklistStorageArray({
    userId,
    planId,
    buildScopedKey: buildTripPlanChecklistOnlyStorageKey,
    buildLegacyKey: buildLegacyTripPlanChecklistOnlyStorageKey
  });
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

function readTripPlanChecklistStorageArray<T extends string>({
  userId,
  planId,
  buildScopedKey,
  buildLegacyKey,
  sanitizeValue
}: TripPlanMetaStorageInput & {
  buildScopedKey: (userId: string, planId: string) => string;
  buildLegacyKey: (planId: string) => string;
  sanitizeValue: (value: unknown) => T[];
}): TripPlanChecklistStorageReadResult<T[]> {
  const storage = getLocalStorage();

  if (!storage) {
    return {
      status: "missing",
      source: "none",
      value: []
    };
  }

  if (userId) {
    const scopedResult = readScopedChecklistStorageArray(
      storage,
      buildScopedKey(userId, planId),
      sanitizeValue
    );

    if (scopedResult.status !== "missing") {
      return scopedResult;
    }
  }

  const legacyKey = buildLegacyKey(planId);
  const legacyResult = readLegacyChecklistStorageArray(
    storage,
    legacyKey,
    sanitizeValue
  );

  if (legacyResult.status !== "found" || !userId) {
    return legacyResult;
  }

  writeTripPlanChecklistStorageArray({
    userId,
    planId,
    value: legacyResult.value,
    buildScopedKey,
    buildLegacyKey,
    sanitizeValue
  });
  storage.removeItem(legacyKey);

  return legacyResult;
}

function writeTripPlanChecklistStorageArray<T extends string>({
  userId,
  planId,
  value,
  buildScopedKey,
  buildLegacyKey,
  sanitizeValue
}: TripPlanMetaStorageInput & {
  value: T[];
  buildScopedKey: (userId: string, planId: string) => string;
  buildLegacyKey: (planId: string) => string;
  sanitizeValue: (value: unknown) => T[];
}) {
  const storage = getLocalStorage();

  if (!storage) {
    return;
  }

  const nextValue = sanitizeValue(value);

  if (!userId) {
    storage.setItem(buildLegacyKey(planId), JSON.stringify(nextValue));
    return;
  }

  const now = new Date();
  const envelope: StorageEnvelope<T[]> = {
    schemaVersion: TRIP_PLAN_STORAGE_VERSION,
    updatedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + TRIP_PLAN_CHECKLIST_TTL_MS).toISOString(),
    value: nextValue
  };

  storage.setItem(buildScopedKey(userId, planId), JSON.stringify(envelope));
  storage.removeItem(buildLegacyKey(planId));
}

function removeTripPlanChecklistStorageArray({
  userId,
  planId,
  buildScopedKey,
  buildLegacyKey
}: TripPlanMetaStorageInput & {
  buildScopedKey: (userId: string, planId: string) => string;
  buildLegacyKey: (planId: string) => string;
}) {
  const storage = getLocalStorage();

  if (!storage) {
    return;
  }

  if (userId) {
    storage.removeItem(buildScopedKey(userId, planId));
  }

  storage.removeItem(buildLegacyKey(planId));
}

function readScopedChecklistStorageArray<T extends string>(
  storage: Storage,
  storageKey: string,
  sanitizeValue: (value: unknown) => T[]
): TripPlanChecklistStorageReadResult<T[]> {
  const storedValue = storage.getItem(storageKey);

  if (!storedValue) {
    return {
      status: "missing",
      source: "none",
      value: []
    };
  }

  try {
    const parsed = JSON.parse(storedValue);

    if (!isStorageEnvelope(parsed)) {
      storage.removeItem(storageKey);
      return {
        status: "invalid",
        source: "scoped",
        value: []
      };
    }

    if (Date.parse(parsed.expiresAt) <= Date.now()) {
      storage.removeItem(storageKey);
      return {
        status: "expired",
        source: "scoped",
        value: []
      };
    }

    return {
      status: "found",
      source: "scoped",
      value: sanitizeValue(parsed.value)
    };
  } catch {
    storage.removeItem(storageKey);
    return {
      status: "invalid",
      source: "scoped",
      value: []
    };
  }
}

function readLegacyChecklistStorageArray<T extends string>(
  storage: Storage,
  storageKey: string,
  sanitizeValue: (value: unknown) => T[]
): TripPlanChecklistStorageReadResult<T[]> {
  try {
    const storedValue = storage.getItem(storageKey);

    if (!storedValue) {
      return {
        status: "missing",
        source: "none",
        value: []
      };
    }

    const parsed = JSON.parse(storedValue);

    if (!Array.isArray(parsed)) {
      return {
        status: "invalid",
        source: "legacy",
        value: []
      };
    }

    return {
      status: "found",
      source: "legacy",
      value: sanitizeValue(parsed)
    };
  } catch {
    return {
      status: "invalid",
      source: "legacy",
      value: []
    };
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

function sanitizeRequirementSlots(value: unknown): RequirementSlot[] {
  return sanitizeStringArray(value) as RequirementSlot[];
}

function sanitizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of value) {
    if (typeof item !== "string" || seen.has(item)) {
      continue;
    }

    seen.add(item);
    result.push(item);
  }

  return result;
}

function sanitizeLocalDate(value: string) {
  const trimmed = value.trim();

  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : "";
}

function sanitizeLocalMemo(value: string) {
  return value.trim().slice(0, 200);
}
