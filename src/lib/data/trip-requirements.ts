import { getMountainFoundationProfileBySlug } from "@/lib/data/mountain-foundation";
import { getRequiredSystemsForTrip } from "@/lib/trip-requirements/engine";
import type { TripRequirementLookupInput } from "@/lib/types";

export async function getTripRequiredSystems({
  mountainSlug,
  season,
  style
}: TripRequirementLookupInput) {
  const mountain = await getMountainFoundationProfileBySlug(mountainSlug);

  if (!mountain) {
    throw new Error(`Mountain foundation profile not found: ${mountainSlug}`);
  }

  return getRequiredSystemsForTrip({
    mountain,
    season,
    style
  });
}
