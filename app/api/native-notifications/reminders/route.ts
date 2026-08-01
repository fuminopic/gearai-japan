import { NextResponse } from "next/server";

import { getTripPlans } from "@/lib/data/trip-plans";
import { requireUser } from "@/lib/data/gear";
import { buildNativeTripReminders } from "@/lib/native-trip-reminders";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Authenticated, same-origin source of truth for native reminder reconcile. */
export async function GET() {
  const [{ user }, plans] = await Promise.all([requireUser(), getTripPlans()]);

  return NextResponse.json(
    {
      scope: user.id,
      reminders: buildNativeTripReminders(plans)
    },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
