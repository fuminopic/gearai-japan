import type { GearMatchingOwnedGearMatch, UserGear } from "@/lib/types";

export type ChecklistOwnedGearMatcher = "BACKPACK" | "TREKKING_POLES" | "GROUNDSHEET";

type ChecklistOwnedGearItem = GearMatchingOwnedGearMatch & {
  gear_products?: UserGear["gear_products"];
};

export function matchOwnedGearForChecklist<T extends ChecklistOwnedGearItem>(
  matcher: ChecklistOwnedGearMatcher,
  ownedGear: readonly T[]
) {
  return ownedGear.filter((item) => matchesChecklistOwnedGear(matcher, item));
}

function matchesChecklistOwnedGear(
  matcher: ChecklistOwnedGearMatcher,
  item: ChecklistOwnedGearItem
) {
  if (matcher === "BACKPACK") {
    return isBackpackGear(item);
  }

  if (matcher === "TREKKING_POLES") {
    return isTrekkingPoleGear(item);
  }

  return isGroundsheetGear(item);
}

function isBackpackGear(item: ChecklistOwnedGearItem) {
  if (
    hasCategory(item, ["backpack", "carry"]) ||
    hasSubcategory(item, ["backpack"])
  ) {
    return true;
  }

  const text = getGearSearchText(item);

  return (
    /ザック|バックパック|リュック/.test(text) ||
    /\b(backpack|rucksack|day\s*pack|daypack)\b/i.test(text) ||
    (/\bpack\b/i.test(text) && !isKnownNonBackpackPack(text))
  );
}

function isTrekkingPoleGear(item: ChecklistOwnedGearItem) {
  if (hasSubcategory(item, ["trekking_pole"])) {
    return true;
  }

  const text = getGearSearchText(item);

  return (
    /\b(trekking|hiking|walking)\s*poles?\b/i.test(text) ||
    (/トレッキングポール|ポール/.test(text) && !isKnownNonTrekkingPole(text))
  );
}

function isGroundsheetGear(item: ChecklistOwnedGearItem) {
  const text = getGearSearchText(item);

  return (
    /ground\s*sheet|groundsheet|foot\s*print|footprint/i.test(text) ||
    /グラウンドシート|グランドシート|フットプリント|地布/.test(text)
  );
}

function hasCategory(item: ChecklistOwnedGearItem, values: readonly string[]) {
  const categories = [
    item.gear_categories?.name_en,
    item.gear_products?.gear_categories?.name_en
  ];

  return categories.some((category) => {
    return category ? values.includes(normalizeToken(category)) : false;
  });
}

function hasSubcategory(item: ChecklistOwnedGearItem, values: readonly string[]) {
  const subcategories = [
    item.gear_subcategories?.name_en,
    item.gear_products?.gear_subcategories?.name_en
  ];

  return subcategories.some((subcategory) => {
    return subcategory ? values.includes(normalizeToken(subcategory)) : false;
  });
}

function getGearSearchText(item: ChecklistOwnedGearItem) {
  return [
    item.name,
    item.brand,
    item.model,
    item.gear_categories?.name_en,
    item.gear_categories?.name_ja,
    item.gear_subcategories?.name_en,
    item.gear_subcategories?.name_ja,
    item.gear_products?.brand,
    item.gear_products?.model,
    item.gear_products?.name_ja,
    item.gear_products?.gear_categories?.name_en,
    item.gear_products?.gear_categories?.name_ja,
    item.gear_products?.gear_subcategories?.name_en,
    item.gear_products?.gear_subcategories?.name_ja
  ]
    .filter(Boolean)
    .join(" ")
    .normalize("NFKC");
}

function normalizeToken(value: string) {
  return value.trim().normalize("NFKC").toLowerCase();
}

function isKnownNonBackpackPack(text: string) {
  return /\b(battery|power|fuel|gas|stuff|dry|sleeping|cook|first aid)\s+pack\b/i.test(text);
}

function isKnownNonTrekkingPole(text: string) {
  return /テント|タープ|シェルター|tent|tarp|shelter/i.test(text);
}
