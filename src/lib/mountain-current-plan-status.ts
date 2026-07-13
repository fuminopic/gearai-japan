import type {
  MountainCurrentPlanStatus,
  MountainCurrentPlanStatusCode,
  MountainCurrentPlanStatusReasonCode,
  MountainFoundationProfile
} from "@/lib/types";

export const mountainCurrentPlanStatusStaleMessage =
  "情報の確認期限を過ぎています。最新の公式情報を確認してください。";
export const restrictedVolcanoPlanningMessage =
  "この山は現在、火山活動または入山規制により通常の登山計画を作成できません。気象庁・自治体などの公式情報を確認してください。";
export const nonStandardRoutePlanningMessage =
  "この山は通常の装備計画を作成する前に、登山道状況・入山可否・山行形態を公式情報で確認してください。";

export type MountainCurrentPlanStatusRow = {
  mountain_slug: string;
  status: MountainCurrentPlanStatusCode;
  reason_code: MountainCurrentPlanStatusReasonCode;
  message_ja: string;
  source_url: string;
  verified_at: string;
  review_after: string;
};

type MountainPlanningProfile = Pick<
  MountainFoundationProfile,
  "volcanic_risk" | "planning_status"
>;

export type MountainPlanAccess = {
  currentPlanStatus?: MountainCurrentPlanStatus;
  planningBlockMessage: string | null;
  currentPlanStatusReadFailed: boolean;
  isGenerationBlocked: boolean;
};

export function resolveMountainCurrentPlanStatus(
  row: MountainCurrentPlanStatusRow,
  today = getJapanCalendarDate()
): MountainCurrentPlanStatus {
  return {
    status: row.status,
    reasonCode: row.reason_code,
    messageJa: row.message_ja,
    sourceUrl: row.source_url,
    verifiedAt: row.verified_at,
    reviewAfter: row.review_after,
    isStale: row.review_after < today
  };
}

export function isMountainCurrentPlanStatusBlocked(
  status: MountainCurrentPlanStatus | undefined
): status is MountainCurrentPlanStatus & { status: "BLOCKED" } {
  return status?.status === "BLOCKED";
}

export function resolveMountainPlanAccess({
  mountain,
  currentPlanStatus,
  currentPlanStatusReadFailed = false
}: {
  mountain: MountainPlanningProfile | null | undefined;
  currentPlanStatus?: MountainCurrentPlanStatus;
  currentPlanStatusReadFailed?: boolean;
}): MountainPlanAccess {
  const planningBlockMessage = getMountainPlanningBlockMessage(mountain, currentPlanStatus);

  return {
    currentPlanStatus,
    planningBlockMessage,
    currentPlanStatusReadFailed,
    isGenerationBlocked: currentPlanStatusReadFailed || planningBlockMessage !== null
  };
}

export function getMountainPlanningBlockMessage(
  mountain: MountainPlanningProfile | null | undefined,
  currentPlanStatus?: MountainCurrentPlanStatus
) {
  if (mountain?.volcanic_risk === "ACTIVE_RESTRICTED") {
    return restrictedVolcanoPlanningMessage;
  }

  if (mountain?.planning_status === "NOT_STANDARD_ROUTE") {
    return nonStandardRoutePlanningMessage;
  }

  if (isMountainCurrentPlanStatusBlocked(currentPlanStatus)) {
    return currentPlanStatus.messageJa;
  }

  return null;
}

export function getJapanCalendarDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(now);
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  return `${values.year}-${values.month}-${values.day}`;
}
