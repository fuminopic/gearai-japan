import type { GearMatchingOwnedGearMatch, UserGear } from "@/lib/types";

export type ChecklistOwnedGearMatcher =
  | "BACKPACK"
  | "TREKKING_POLES"
  | "HAT"
  | "GLOVES"
  | "GAITERS"
  | "SUNGLASSES"
  | "MAP_COMPASS"
  | "WHISTLE"
  | "EMERGENCY_SHEET"
  | "BEAR_PROTECTION"
  | "PORTABLE_TOILET"
  | "CRAMPONS"
  | "ICE_AXE"
  | "WATER_CROSSING_SHOES"
  | "PEGS"
  | "INNER_SHEET"
  | "GROUNDSHEET";

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

  if (matcher === "HAT") {
    return isHatGear(item);
  }

  if (matcher === "GLOVES") {
    return isGlovesGear(item);
  }

  if (matcher === "GAITERS") {
    return isGaitersGear(item);
  }

  if (matcher === "SUNGLASSES") {
    return isSunglassesGear(item);
  }

  if (matcher === "MAP_COMPASS") {
    return isMapCompassGear(item);
  }

  if (matcher === "WHISTLE") {
    return isWhistleGear(item);
  }

  if (matcher === "EMERGENCY_SHEET") {
    return isEmergencySheetGear(item);
  }

  if (matcher === "BEAR_PROTECTION") {
    return isBearProtectionGear(item);
  }

  if (matcher === "PORTABLE_TOILET") {
    return isPortableToiletGear(item);
  }

  if (matcher === "CRAMPONS") {
    return isCramponsGear(item);
  }

  if (matcher === "ICE_AXE") {
    return isIceAxeGear(item);
  }

  if (matcher === "WATER_CROSSING_SHOES") {
    return isWaterCrossingShoesGear(item);
  }

  if (matcher === "PEGS") {
    return isPegsGear(item);
  }

  if (matcher === "INNER_SHEET") {
    return isInnerSheetGear(item);
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

function isHatGear(item: ChecklistOwnedGearItem) {
  if (hasCategorySubcategory(item, ["clothing"], ["hat"]) || hasSubcategory(item, ["hat"])) {
    return true;
  }

  const text = getGearSearchText(item);

  return /\b(hat|cap|beanie)\b/i.test(text) || /帽子|キャップ|ハット|ビーニー|ニット帽/.test(text);
}

function isGlovesGear(item: ChecklistOwnedGearItem) {
  if (hasCategory(item, ["gloves"]) || hasSubcategory(item, ["gloves"])) {
    return true;
  }

  const text = getGearSearchText(item);

  return /\bgloves?\b/i.test(text) || /手袋|グローブ/.test(text);
}

function isGaitersGear(item: ChecklistOwnedGearItem) {
  if (
    hasCategorySubcategory(item, ["clothing"], ["gaiters"]) ||
    hasSubcategory(item, ["gaiters"])
  ) {
    return true;
  }

  const text = getGearSearchText(item);

  return /\bgaiters?\b/i.test(text) || /ゲイター|ゲイターズ|スパッツ/.test(text);
}

function isSunglassesGear(item: ChecklistOwnedGearItem) {
  if (
    hasCategorySubcategory(item, ["clothing"], ["sunglasses"]) ||
    hasSubcategory(item, ["sunglasses"])
  ) {
    return true;
  }

  const text = getGearSearchText(item);

  return /\bsun\s*glasses\b|\bsunglasses\b/i.test(text) || /サングラス/.test(text);
}

function isMapCompassGear(item: ChecklistOwnedGearItem) {
  const text = getGearSearchText(item);

  if (isKnownMapApp(text)) {
    return false;
  }

  if (
    hasCategorySubcategory(item, ["electronics", "navigation"], ["map", "compass"]) ||
    hasSubcategory(item, ["map", "compass"])
  ) {
    return true;
  }

  return (
    /\b(compass|paper\s*map|topographic\s*map)\b/i.test(text) ||
    /紙地図|山と高原地図|コンパス/.test(text) ||
    (/地図/.test(text) && !isKnownMapApp(text))
  );
}

function isWhistleGear(item: ChecklistOwnedGearItem) {
  if (hasSubcategory(item, ["whistle"])) {
    return true;
  }

  const text = getGearSearchText(item);

  return /\bwhistle\b/i.test(text) || /ホイッスル|笛/.test(text);
}

function isEmergencySheetGear(item: ChecklistOwnedGearItem) {
  if (hasSubcategory(item, ["emergency_sheet"])) {
    return true;
  }

  const text = getGearSearchText(item);

  return (
    /\b(emergency|survival)\s*(sheet|blanket)\b/i.test(text) ||
    /エマージェンシーシート|サバイバルシート/.test(text)
  );
}

function isBearProtectionGear(item: ChecklistOwnedGearItem) {
  if (hasCategory(item, ["bear_safety"]) || hasSubcategory(item, ["bear_bell", "bear_spray"])) {
    return true;
  }

  const text = getGearSearchText(item);

  return (
    /\bbear\s*(bell|spray)\b/i.test(text) ||
    /熊鈴|熊スプレー|熊よけ|熊除け/.test(text)
  );
}

function isPortableToiletGear(item: ChecklistOwnedGearItem) {
  if (hasSubcategory(item, ["portable_toilet"])) {
    return true;
  }

  const text = getGearSearchText(item);

  return /\bportable\s*toilet\b/i.test(text) || /携帯トイレ/.test(text);
}

function isCramponsGear(item: ChecklistOwnedGearItem) {
  const text = getGearSearchText(item);

  if (isKnownNonCramponsTraction(text)) {
    return false;
  }

  if (
    hasCategorySubcategory(item, ["other", "climbing", "snow"], ["crampons"]) ||
    hasSubcategory(item, ["crampons"])
  ) {
    return true;
  }

  return /\bcrampons\b/i.test(text) || /アイゼン|10本爪|12本爪/.test(text);
}

function isIceAxeGear(item: ChecklistOwnedGearItem) {
  if (
    hasCategorySubcategory(item, ["other", "climbing", "snow"], ["ice_axe"]) ||
    hasSubcategory(item, ["ice_axe"])
  ) {
    return true;
  }

  const text = getGearSearchText(item);

  return /\bice\s*axe\b/i.test(text) || /ピッケル/.test(text);
}

function isWaterCrossingShoesGear(item: ChecklistOwnedGearItem) {
  if (
    hasCategorySubcategory(item, ["shoes", "footwear", "other"], ["water_shoes"]) ||
    hasSubcategory(item, ["water_shoes"])
  ) {
    return true;
  }

  const text = getGearSearchText(item);

  return /\bwater\s*shoes?\b/i.test(text) || /渡渉用シューズ|沢靴|ウォーターシューズ/.test(text);
}

function isPegsGear(item: ChecklistOwnedGearItem) {
  if (hasCategorySubcategory(item, ["shelter"], ["pegs"]) || hasSubcategory(item, ["pegs"])) {
    return true;
  }

  const text = getGearSearchText(item);

  return (
    /\b(tent\s*)?(stakes?)\b/i.test(text) ||
    /\btent\s*pegs?\b/i.test(text) ||
    /ペグ/.test(text)
  );
}

function isInnerSheetGear(item: ChecklistOwnedGearItem) {
  if (hasCategorySubcategory(item, ["sleep"], ["inner_sheet"]) || hasSubcategory(item, ["inner_sheet"])) {
    return true;
  }

  const text = getGearSearchText(item);

  return (
    /\b(inner\s*sheet|sleeping\s*bag\s*liner)\b/i.test(text) ||
    /インナーシーツ|シュラフシーツ|シュラフライナー|寝袋ライナー/.test(text)
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

function hasCategorySubcategory(
  item: ChecklistOwnedGearItem,
  categories: readonly string[],
  subcategories: readonly string[]
) {
  return hasCategory(item, categories) && hasSubcategory(item, subcategories);
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

function isKnownMapApp(text: string) {
  return /登山地図アプリ|地図アプリ|YAMAP|ヤマレコ|アプリ/i.test(text);
}

function isKnownNonCramponsTraction(text: string) {
  return /チェーンスパイク|chain\s*spikes?|microspikes?/i.test(text);
}
