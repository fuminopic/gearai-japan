import type { SavedTripPlan } from "@/lib/types";

export const tripReminderTitle = "山行前日の準備をお知らせします";
export const tripReminderBody =
  "山行日の前日に、装備チェックのリマインダーをお送りします。";
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
    title: string;
    body: string;
    route: string;
  };
};

/**
 * Convert a date-only trip date into an absolute 20:00 JST reminder on its
 * previous calendar day. This deliberately never uses the device timezone.
 */
export function buildTripPlanReminder(
  plan: Pick<SavedTripPlan, "id" | "planned_date">,
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
      route
    )
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
  route: string
) {
  if (reminderUtc > now.getTime()) {
    return undefined;
  }

  const todayJst = japaneseDateOnly(now);
  const dayOffset = dateOnlyOffsetDays(plannedDate, todayJst);

  if (dayOffset === 0) {
    return {
      title: tripReminderTodayTitle,
      body: tripReminderImmediateBody,
      route
    };
  }

  if (dayOffset === 1) {
    return {
      title: tripReminderTomorrowTitle,
      body: tripReminderImmediateBody,
      route
    };
  }

  return undefined;
}

function japaneseDateOnly(now: Date) {
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return [jst.getUTCFullYear(), jst.getUTCMonth() + 1, jst.getUTCDate()]
    .map((value, index) =>
      index === 0 ? String(value) : String(value).padStart(2, "0")
    )
    .join("-");
}

function dateOnlyOffsetDays(left: string, right: string) {
  const leftTime = Date.parse(`${left}T00:00:00Z`);
  const rightTime = Date.parse(`${right}T00:00:00Z`);
  return Number.isFinite(leftTime) && Number.isFinite(rightTime)
    ? Math.round((leftTime - rightTime) / (24 * 60 * 60 * 1000))
    : Number.NaN;
}
