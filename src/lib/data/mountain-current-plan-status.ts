import { cache } from "react";

import {
  resolveMountainCurrentPlanStatus,
  type MountainCurrentPlanStatusRow
} from "@/lib/mountain-current-plan-status";
import { createClient } from "@/lib/supabase/server";
import type { MountainCurrentPlanStatusBySlug } from "@/lib/types";

const MOUNTAIN_CURRENT_PLAN_STATUS_SELECT = [
  "mountain_slug",
  "status",
  "reason_code",
  "message_ja",
  "source_url",
  "verified_at",
  "review_after"
].join(",");

export const getMountainCurrentPlanStatuses = cache(
  async function getMountainCurrentPlanStatuses(): Promise<MountainCurrentPlanStatusBySlug> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("mountain_current_plan_status")
      .select(MOUNTAIN_CURRENT_PLAN_STATUS_SELECT)
      .returns<MountainCurrentPlanStatusRow[]>();

    if (error) {
      throw new Error(error.message);
    }

    return Object.fromEntries(
      (data ?? []).map((row) => [
        row.mountain_slug,
        resolveMountainCurrentPlanStatus(row)
      ])
    );
  }
);
