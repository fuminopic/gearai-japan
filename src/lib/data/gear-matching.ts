import { getGearProducts, getUserGear } from "@/lib/data/gear";
import { matchGearForRequirementSlot } from "@/lib/gear-matching/engine";
import type { RequirementSlot } from "@/lib/types";

export async function getGearMatchesForRequirementSlot(slot: RequirementSlot) {
  const [ownedGear, databaseGear] = await Promise.all([
    getUserGear({ status: "owned" }),
    getGearProducts()
  ]);

  return matchGearForRequirementSlot({
    slot,
    ownedGear,
    databaseGear
  });
}
