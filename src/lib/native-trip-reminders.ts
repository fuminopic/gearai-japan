import type { SavedTripPlan } from "@/lib/types";

export const tripReminderTitle = "明日の山、準備はできていますか？";
export const tripReminderBody =
  "安心して出発できるように、持ち物をひと目だけ確認しておきましょう。";
export const weekendPlanReminderTitle = "今週末、山の予定はありますか？";
export const weekendPlanReminderBody =
  "予定が決まっていたら、山支度で少しずつ準備を始めましょう。";
export const tripReminderTodayTitle = "本日の登山予定";
export const tripReminderTomorrowTitle = "明日の登山予定";
export const tripReminderImmediateBody =
  "出発前に、装備チェックを確認しましょう。";

export type NativeReminderConfig = {
  key: string;
  title: string;
  body: string;
  route: string;
  schedule:
    | { kind: "once"; at: string; timeZone: "Asia/Tokyo" }
    | {
        kind: "weekly";
        weekday: number;
        hour: number;
        minute: number;
        timeZone: "Asia/Tokyo";
      };
  immediate?: {
    key: string;
    plannedDate: string;
    title: string;
    body: string;
    route: string;
  };
};

type ReminderPlan = Pick<
  SavedTripPlan,
  "id" | "planned_date" | "planned_end_date"
>;

/**
 * Convert a date-only trip date into an absolute 20:00 JST reminder on its
 * previous calendar day. This deliberately never uses the device timezone.
 */
export function buildTripPlanReminder(
  plan: ReminderPlan,
  now = new Date()
): NativeReminderConfig | null {
  const plannedDate = plan.planned_date;
  const match = plannedDate?.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!plannedDate || !match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const reminderUtc = Date.UTC(year, month - 1, day - 1, 11, 0, 0);

  if (!Number.isFinite(reminderUtc)) {
    return null;
  }

  // A notification is an explicit "open the checklist now" action. Route it
  // to the dedicated checklist view instead of loading the complete plan page
  // and waiting for its scroll-to-checklist effect. This keeps the cold native
  // handoff focused on the user-visible destination without changing plan data
  // or authentication.
  const route = `/plan?id=${plan.id}&view=checklist`;

  return {
    key: plan.id,
    title: tripReminderTitle,
    body: tripReminderBody,
    route,
    schedule: {
      kind: "once",
      at: new Date(reminderUtc).toISOString(),
      timeZone: "Asia/Tokyo"
    },
    immediate: buildImmediateChecklistReminder(
      plannedDate,
      reminderUtc,
      now,
      route,
      plan.id
    )
  };
}

/**
 * Native reminder configuration remains authored by the authenticated Web
 * application. Besides each saved trip's previous-evening reminder, we add at
 * most one one-off Thursday prompt for the next weekend that has no plan.
 */
export function buildNativeTripReminders(
  plans: ReminderPlan[],
  now = new Date()
) {
  const tripReminders = plans
    .map((plan) => buildTripPlanReminder(plan, now))
    .filter((value): value is NativeReminderConfig => value !== null);
  const weekendReminder = buildWeekendPlanReminder(plans, now);

  return weekendReminder ? [...tripReminders, weekendReminder] : tripReminders;
}

/**
 * Schedule only the next upcoming Thursday at 19:30 JST. When this week's
 * cutoff has passed, this deliberately moves to next Thursday instead of
 * backfilling a notification immediately.
 */
export function buildWeekendPlanReminder(
  plans: ReminderPlan[],
  now = new Date()
): NativeReminderConfig | null {
  const today = japaneseCalendarDate(now);
  const daysUntilThursday = (4 - today.getUTCDay() + 7) % 7;
  let thursday = addDays(today, daysUntilThursday);
  const cutoff = Date.UTC(
    thursday.getUTCFullYear(),
    thursday.getUTCMonth(),
    thursday.getUTCDate(),
    10,
    30,
    0
  );

  if (now.getTime() >= cutoff) {
    thursday = addDays(thursday, 7);
  }

  const saturday = dateOnly(thursday, 2);
  const sunday = dateOnly(thursday, 3);
  if (plans.some((plan) => overlapsWeekend(plan, saturday, sunday))) {
    return null;
  }

  const key = `weekend-plan-${dateOnly(thursday)}`;
  const at = Date.UTC(
    thursday.getUTCFullYear(),
    thursday.getUTCMonth(),
    thursday.getUTCDate(),
    10,
    30,
    0
  );

  return {
    key,
    title: weekendPlanReminderTitle,
    body: weekendPlanReminderBody,
    route: "/plan",
    schedule: {
      kind: "once",
      at: new Date(at).toISOString(),
      timeZone: "Asia/Tokyo"
    }
  };
}

/**
 * A reminder cannot be scheduled in the past. Only a trip that is today, or
 * tomorrow after the 20:00 JST cutoff, needs an immediate in-app checklist
 * prompt. Older dates remain intentionally silent.
 */
function buildImmediateChecklistReminder(
  plannedDate: string,
  reminderUtc: number,
  now: Date,
  route: string,
  key: string
) {
  if (reminderUtc > now.getTime()) {
    return undefined;
  }

  const todayJst = japaneseDateOnly(now);
  const dayOffset = dateOnlyOffsetDays(plannedDate, todayJst);

  if (dayOffset === 0) {
    return {
      key,
      plannedDate,
      title: tripReminderTodayTitle,
      body: tripReminderImmediateBody,
      route
    };
  }

  if (dayOffset === 1) {
    return {
      key,
      plannedDate,
      title: tripReminderTomorrowTitle,
      body: tripReminderImmediateBody,
      route
    };
  }

  return undefined;
}

function japaneseDateOnly(now: Date) {
  return dateOnly(japaneseCalendarDate(now));
}

function japaneseCalendarDate(now: Date) {
  return new Date(now.getTime() + 9 * 60 * 60 * 1000);
}

function dateOnly(date: Date, offsetDays = 0) {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + offsetDays);
  return [next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate()]
    .map((value, index) =>
      index === 0 ? String(value) : String(value).padStart(2, "0")
    )
    .join("-");
}

function addDays(date: Date, days: number) {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function overlapsWeekend(plan: ReminderPlan, saturday: string, sunday: string) {
  const start = plan.planned_date;
  if (!isDateOnly(start) || start === null) return false;
  const plannedEndDate = plan.planned_end_date;
  const end = isDateOnly(plannedEndDate) && plannedEndDate !== null && plannedEndDate >= start
    ? plannedEndDate
    : start;
  return start <= sunday && end >= saturday;
}

function isDateOnly(value: string | null) {
  return Boolean(value?.match(/^\d{4}-\d{2}-\d{2}$/));
}

function dateOnlyOffsetDays(left: string, right: string) {
  const leftTime = Date.parse(`${left}T00:00:00Z`);
  const rightTime = Date.parse(`${right}T00:00:00Z`);
  return Number.isFinite(leftTime) && Number.isFinite(rightTime)
    ? Math.round((leftTime - rightTime) / (24 * 60 * 60 * 1000))
    : Number.NaN;
}
