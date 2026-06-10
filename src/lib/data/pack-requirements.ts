import { getMountainFoundationProfileBySlug } from "@/lib/data/mountain-foundation";
import { getOwnedGearForPlanning } from "@/lib/data/gear";
import { generatePackRequirementPlan } from "@/lib/pack-requirements/engine";
import { getRequiredSystemsForTrip } from "@/lib/trip-requirements/engine";
import type { PackRequirementLookupInput } from "@/lib/types";

export async function getPackRequirementPlan({
  mountainSlug,
  season,
  style
}: PackRequirementLookupInput) {
  const mountain = await getMountainFoundationProfileBySlug(mountainSlug);

  if (!mountain) {
    throw new Error(`Mountain foundation profile not found: ${mountainSlug}`);
  }

  const requiredSystems = getRequiredSystemsForTrip({
    mountain,
    season,
    style
  });
  const ownedGear = await getOwnedGearForPlanning();

  return generatePackRequirementPlan({
    mountain,
    season,
    style,
    requiredSystems,
    ownedGear
  });
}
