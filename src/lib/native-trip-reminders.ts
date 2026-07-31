import type { SavedTripPlan } from "@/lib/types";

export const tripReminderTitle = "山行前日の準備をお知らせします";
export const tripReminderBody =
  "山行日の前日に、装備チェックのリマインダーをお送りします。";

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
};

/**
 * Convert a date-only trip date into an absolute 20:00 JST reminder on its
 * previous calendar day. This deliberately never uses the device timezone.
 */
export function buildTripPlanReminder(plan: Pick<SavedTripPlan, "id" | "planned_date">): NativeReminderConfig | null {
  const plannedDate = plan.planned_date;
  const match = plannedDate?.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const reminderUtc = Date.UTC(year, month - 1, day - 1, 11, 0, 0);

  if (!Number.isFinite(reminderUtc)) {
    return null;
  }

  return {
    key: plan.id,
    title: tripReminderTitle,
    body: tripReminderBody,
    route: `/plan?id=${plan.id}&focus=checklist`,
    schedule: {
      kind: "once",
      at: new Date(reminderUtc).toISOString(),
      timeZone: "Asia/Tokyo"
    }
  };
}
