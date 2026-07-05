import type { PluginListenerHandle } from "@capacitor/core";
import type {
  ActionPerformed,
  LocalNotificationsPlugin,
  PendingLocalNotificationSchema
} from "@capacitor/local-notifications";

const TRIP_REMINDER_KIND = "yamajitaku-trip-checklist-reminder-v1";
const TRIP_REMINDER_STORAGE_PREFIX = "yamajitaku:v1:user:";
const TRIP_REMINDER_STORAGE_SUFFIX = ":meta";
const TRIP_REMINDER_ID_OFFSET = 100_000_000;
const TRIP_REMINDER_ID_MODULO = 1_900_000_000;

export type TripReminderPlan = {
  planId: string;
  plannedDate: string | null | undefined;
};

type TripReminderExtra = {
  kind: typeof TRIP_REMINDER_KIND;
  planId: string;
  plannedDate: string;
  route: string;
};

type TripReminderLocalMetaEnvelope = {
  schemaVersion?: unknown;
  expiresAt?: unknown;
  value?: {
    plannedDate?: unknown;
  };
};

type DesiredReminder = {
  id: number;
  planId: string;
  plannedDate: string;
  route: string;
  notifyAt: Date;
};

type TripReminderPermissionOptions = {
  diagnostics?: boolean;
};

export function readTripReminderPlansFromLocalStorage(userId: string): TripReminderPlan[] {
  if (!userId || typeof window === "undefined") {
    return [];
  }

  const storage = window.localStorage;
  const keyPrefix = `${TRIP_REMINDER_STORAGE_PREFIX}${userId}:trip-plan:`;
  const plans: TripReminderPlan[] = [];

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);

    if (!key?.startsWith(keyPrefix) || !key.endsWith(TRIP_REMINDER_STORAGE_SUFFIX)) {
      continue;
    }

    const planId = key.slice(keyPrefix.length, -TRIP_REMINDER_STORAGE_SUFFIX.length);
    const plannedDate = readPlannedDateFromStorageValue(storage.getItem(key));

    if (planId && plannedDate) {
      plans.push({ planId, plannedDate });
    }
  }

  return plans;
}

export function getTripReminderNotificationId(planId: string) {
  let hash = 2166136261;

  for (let index = 0; index < planId.length; index += 1) {
    hash ^= planId.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return TRIP_REMINDER_ID_OFFSET + ((hash >>> 0) % TRIP_REMINDER_ID_MODULO);
}

export function getTripReminderNotificationDate(plannedDate: string) {
  const match = plannedDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const reminderDate = new Date(year, monthIndex, day, 20, 0, 0, 0);

  if (
    reminderDate.getFullYear() !== year ||
    reminderDate.getMonth() !== monthIndex ||
    reminderDate.getDate() !== day
  ) {
    return null;
  }

  reminderDate.setDate(reminderDate.getDate() - 1);

  return reminderDate;
}

export async function requestReminderPermission(
  options: TripReminderPermissionOptions = {}
) {
  const notifications = await loadNativeLocalNotifications(options);

  if (!notifications) {
    return false;
  }

  return requestReminderPermissionForPlugin(notifications, options);
}

export async function scheduleTripReminder(planId: string, plannedDate: string) {
  const notifications = await loadNativeLocalNotifications();
  const desired = buildDesiredReminder({ planId, plannedDate }, new Date());

  if (!notifications || !desired) {
    return;
  }

  try {
    const permitted = await requestReminderPermissionForPlugin(notifications);

    if (!permitted) {
      return;
    }

    await notifications.cancel({ notifications: [{ id: desired.id }] });
    await notifications.schedule({ notifications: [buildNotificationSchema(desired)] });
  } catch {
    // Older native shells may not include this plugin yet. Keep the web app safe.
  }
}

export async function cancelTripReminder(planId: string) {
  const notifications = await loadNativeLocalNotifications();

  if (!notifications) {
    return;
  }

  try {
    await notifications.cancel({
      notifications: [{ id: getTripReminderNotificationId(planId) }]
    });
  } catch {
    // Native plugin unavailable or not ready; reminder cancellation is best-effort.
  }
}

export async function reconcileTripReminders(plans: readonly TripReminderPlan[]) {
  const notifications = await loadNativeLocalNotifications();

  if (!notifications) {
    return;
  }

  const now = new Date();
  const desiredById = new Map<number, DesiredReminder>();

  for (const plan of plans) {
    const desired = buildDesiredReminder(plan, now);

    if (desired) {
      desiredById.set(desired.id, desired);
    }
  }

  try {
    const pending = await notifications.getPending();
    const reminderPending = pending.notifications.filter(isTripReminderNotification);
    const staleNotifications = reminderPending.filter((notification) => {
      const desired = desiredById.get(notification.id);
      const extra = getTripReminderExtra(notification);

      return !desired || !extra || extra.plannedDate !== desired.plannedDate;
    });

    if (staleNotifications.length > 0) {
      await notifications.cancel({
        notifications: staleNotifications.map((notification) => ({ id: notification.id }))
      });
    }

    const activePendingIds = new Set(
      reminderPending
        .filter((notification) => !staleNotifications.some((stale) => stale.id === notification.id))
        .map((notification) => notification.id)
    );
    const remindersToSchedule = [...desiredById.values()].filter(
      (reminder) => !activePendingIds.has(reminder.id)
    );

    if (remindersToSchedule.length === 0) {
      return;
    }

    const permitted = await requestReminderPermissionForPlugin(notifications);

    if (!permitted) {
      return;
    }

    await notifications.schedule({
      notifications: remindersToSchedule.map(buildNotificationSchema)
    });
  } catch {
    // Reconcile is best-effort and must never break the app shell.
  }
}

export async function registerTripReminderActionListener(
  onOpenPlan: (planId: string) => void
) {
  const notifications = await loadNativeLocalNotifications();

  if (!notifications) {
    return noop;
  }

  try {
    const handle = await notifications.addListener(
      "localNotificationActionPerformed",
      (event: ActionPerformed) => {
        const extra = getTripReminderExtra(event.notification);

        if (extra?.planId) {
          onOpenPlan(extra.planId);
        }
      }
    );

    return buildListenerCleanup(handle);
  } catch {
    return noop;
  }
}

function buildDesiredReminder(
  plan: TripReminderPlan,
  now: Date
): DesiredReminder | null {
  if (!plan.planId || !plan.plannedDate) {
    return null;
  }

  const notifyAt = getTripReminderNotificationDate(plan.plannedDate);

  if (!notifyAt || notifyAt.getTime() <= now.getTime()) {
    return null;
  }

  const route = `/plan?id=${encodeURIComponent(plan.planId)}&focus=checklist`;

  return {
    id: getTripReminderNotificationId(plan.planId),
    planId: plan.planId,
    plannedDate: plan.plannedDate,
    route,
    notifyAt
  };
}

function buildNotificationSchema(reminder: DesiredReminder) {
  const extra: TripReminderExtra = {
    kind: TRIP_REMINDER_KIND,
    planId: reminder.planId,
    plannedDate: reminder.plannedDate,
    route: reminder.route
  };

  return {
    id: reminder.id,
    title: "山支度",
    body: "明日の山行前に装備チェックリストを確認しましょう。",
    schedule: {
      at: reminder.notifyAt
    },
    extra
  };
}

async function loadNativeLocalNotifications(
  options: TripReminderPermissionOptions = {}
): Promise<LocalNotificationsPlugin | null> {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const { Capacitor } = await import("@capacitor/core");
    const isNativePlatform = Capacitor.isNativePlatform();

    if (!isNativePlatform || Capacitor.getPlatform() !== "ios") {
      return null;
    }

    logTripReminderPermissionDiagnostic(
      options,
      "Capacitor.isNativePlatform()",
      isNativePlatform
    );

    try {
      const { LocalNotifications } = await import("@capacitor/local-notifications");

      logTripReminderPermissionDiagnostic(
        options,
        "LocalNotifications import succeeded",
        true
      );

      return LocalNotifications;
    } catch (error) {
      logTripReminderPermissionDiagnostic(options, "catch error", error);
      return null;
    }
  } catch {
    return null;
  }
}

async function requestReminderPermissionForPlugin(
  notifications: LocalNotificationsPlugin,
  options: TripReminderPermissionOptions = {}
) {
  try {
    const current = await notifications.checkPermissions();

    logTripReminderPermissionDiagnostic(options, "checkPermissions result", current);

    if (current.display === "granted") {
      logTripReminderPermissionDiagnostic(options, "requestPermissions called", false);
      return true;
    }

    if (current.display === "denied") {
      logTripReminderPermissionDiagnostic(options, "requestPermissions called", false);
      return false;
    }

    logTripReminderPermissionDiagnostic(options, "requestPermissions called", true);
    const requested = await notifications.requestPermissions();

    logTripReminderPermissionDiagnostic(options, "requestPermissions result", requested);

    return requested.display === "granted";
  } catch (error) {
    logTripReminderPermissionDiagnostic(options, "catch error", error);
    return false;
  }
}

function logTripReminderPermissionDiagnostic(
  options: TripReminderPermissionOptions,
  message: string,
  value: unknown
) {
  if (!options.diagnostics) {
    return;
  }

  console.debug("[TripReminder]", message, value);
}

function isTripReminderNotification(notification: PendingLocalNotificationSchema) {
  return Boolean(getTripReminderExtra(notification));
}

function getTripReminderExtra(notification: {
  extra?: unknown;
}): TripReminderExtra | null {
  if (!notification.extra || typeof notification.extra !== "object") {
    return null;
  }

  const extra = notification.extra as Partial<TripReminderExtra>;

  if (
    extra.kind !== TRIP_REMINDER_KIND ||
    typeof extra.planId !== "string" ||
    typeof extra.plannedDate !== "string" ||
    typeof extra.route !== "string"
  ) {
    return null;
  }

  return {
    kind: TRIP_REMINDER_KIND,
    planId: extra.planId,
    plannedDate: extra.plannedDate,
    route: extra.route
  };
}

function readPlannedDateFromStorageValue(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as TripReminderLocalMetaEnvelope;

    if (
      typeof parsed.expiresAt === "string" &&
      new Date(parsed.expiresAt).getTime() <= Date.now()
    ) {
      return null;
    }

    if (
      parsed.schemaVersion !== "v1" ||
      !parsed.value ||
      typeof parsed.value.plannedDate !== "string"
    ) {
      return null;
    }

    return parsed.value.plannedDate.match(/^\d{4}-\d{2}-\d{2}$/)
      ? parsed.value.plannedDate
      : null;
  } catch {
    return null;
  }
}

function buildListenerCleanup(handle: PluginListenerHandle) {
  return () => {
    void handle.remove();
  };
}

function noop() {}
