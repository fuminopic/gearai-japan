import type {
  GearMatchingOwnedGearMatch,
  MountainFoundationStyle,
  PackRequirementPlan,
  PackRequirementSlotPlan,
  RequirementSlot
} from "@/lib/types";

export type ChecklistPriority = "ESSENTIAL" | "SUGGESTED" | "OPTIONAL";
export type ChecklistItemSource = "GEAR_BACKED" | "CHECKLIST_ONLY";
export type ChecklistItemIcon =
  | "baseLayer"
  | "midLayer"
  | "insulation"
  | "rainwear"
  | "hat"
  | "gloves"
  | "gaiters"
  | "backpack"
  | "trekkingPoles"
  | "sunglasses"
  | "water"
  | "trailFood"
  | "meal"
  | "stove"
  | "cookPot"
  | "fuel"
  | "navigationApp"
  | "mapCompass"
  | "gpsDevice"
  | "headlamp"
  | "battery"
  | "firstAid"
  | "insurance"
  | "whistle"
  | "emergencySheet"
  | "helmet"
  | "traction"
  | "crampons"
  | "iceAxe"
  | "bearProtection"
  | "tent"
  | "sleepingBag"
  | "sleepingPad"
  | "pegs"
  | "groundsheet"
  | "innerSheet"
  | "toiletries"
  | "earplugs";
export type ChecklistCategoryId =
  | "CLOTHING"
  | "ACTION_GEAR"
  | "FOOD_WATER"
  | "NAV_ELECTRONICS"
  | "SAFETY_FIRST_AID"
  | "SPECIAL_GEAR"
  | "OVERNIGHT_GEAR";

export type ChecklistItemDefinition = {
  id: string;
  label: string;
  priority: ChecklistPriority;
  icon: ChecklistItemIcon;
  slots?: RequirementSlot[];
  ownedGearMatcher?: "GROUNDSHEET";
};

export type ChecklistItem = ChecklistItemDefinition & {
  source: ChecklistItemSource;
  checked: boolean;
  slots: RequirementSlot[];
  toggleSlots: RequirementSlot[];
  matchingOwnedGear: GearMatchingOwnedGearMatch[];
};

export type ChecklistCategory = {
  id: ChecklistCategoryId;
  label: string;
  items: ChecklistItem[];
  progress: ChecklistProgress;
  priorityGroups: Array<{
    priority: ChecklistPriority;
    label: string;
    items: ChecklistItem[];
  }>;
};

export type ChecklistProgress = {
  percent: number;
  checkedCount: number;
  missingCount: number;
  totalCount: number;
};

export type ChecklistView = {
  categories: ChecklistCategory[];
  summary: ChecklistProgress;
};

export const checklistPriorityLabels: Record<ChecklistPriority, string> = {
  ESSENTIAL: "必須",
  SUGGESTED: "推奨",
  OPTIONAL: "あると便利"
};

const checklistPriorityOrder: ChecklistPriority[] = [
  "ESSENTIAL",
  "SUGGESTED",
  "OPTIONAL"
];

const priorityWeights: Record<ChecklistPriority, number> = {
  ESSENTIAL: 5,
  SUGGESTED: 3,
  OPTIONAL: 1
};

const categoryLabels: Record<ChecklistCategoryId, string> = {
  CLOTHING: "衣類",
  ACTION_GEAR: "行動装備",
  FOOD_WATER: "水・食料",
  NAV_ELECTRONICS: "ナビ・電子機器",
  SAFETY_FIRST_AID: "安全・救急",
  SPECIAL_GEAR: "特殊装備",
  OVERNIGHT_GEAR: "宿泊装備"
};

type ChecklistCategoryDefinition = {
  id: ChecklistCategoryId;
  items: ChecklistItemDefinition[];
};

function getBaseCategories(plan: PackRequirementPlan): ChecklistCategoryDefinition[] {
  return [
    {
      id: "CLOTHING",
      items: getClothingItems(plan)
    },
    {
      id: "ACTION_GEAR",
      items: [
        {
          id: "action-backpack",
          label: "ザック",
          priority: "ESSENTIAL",
          icon: "backpack"
        },
        {
          id: "action-trekking-poles",
          label: "トレッキングポール",
          priority: "SUGGESTED",
          icon: "trekkingPoles"
        },
        {
          id: "action-sunglasses",
          label: "サングラス",
          priority: "SUGGESTED",
          icon: "sunglasses"
        }
      ]
    },
    {
      id: "FOOD_WATER",
      items: getFoodWaterItems(plan)
    },
    {
      id: "NAV_ELECTRONICS",
      items: getNavigationItems(plan)
    },
    {
      id: "SAFETY_FIRST_AID",
      items: [
        {
          id: "safety-first-aid",
          label: "救急セット",
          priority: "ESSENTIAL",
          icon: "firstAid",
          slots: ["FIRST_AID_KIT"]
        },
        {
          id: "safety-insurance-card",
          label: "保険証",
          priority: "ESSENTIAL",
          icon: "insurance"
        },
        {
          id: "safety-whistle",
          label: "ホイッスル",
          priority: "SUGGESTED",
          icon: "whistle"
        },
        {
          id: "safety-emergency-sheet",
          label: "エマージェンシーシート",
          priority: "SUGGESTED",
          icon: "emergencySheet"
        }
      ]
    }
  ];
}

function getClothingItems(plan: PackRequirementPlan): ChecklistItemDefinition[] {
  return [
      {
        id: "clothing-base-layer",
        label: "肌着・ベースレイヤー",
        priority: "ESSENTIAL",
        icon: "baseLayer",
        slots: ["BASE_LAYER"]
      },
      {
        id: "clothing-insulation",
        label: "防寒着",
        priority: "ESSENTIAL",
        icon: "insulation",
        slots: ["INSULATION_LAYER"]
      },
      {
        id: "clothing-rainwear",
        label: "レインウェア",
        priority: "ESSENTIAL",
        icon: "rainwear",
        slots: ["RAIN_JACKET", "RAIN_PANTS"]
      },
      {
        id: "clothing-mid-layer",
        label: "中間着",
        priority: "SUGGESTED",
        icon: "midLayer"
      },
      {
        id: "clothing-hat",
        label: "帽子",
        priority: "SUGGESTED",
        icon: "hat"
      },
      {
        id: "clothing-gloves",
        label: "手袋",
        priority: getGlovesPriority(plan),
        icon: "gloves"
      },
      {
        id: "clothing-gaiters",
        label: "ゲイター",
        priority: "OPTIONAL",
        icon: "gaiters"
      }
  ];
}

function getFoodWaterItems(plan: PackRequirementPlan): ChecklistItemDefinition[] {
  const items: ChecklistItemDefinition[] = [
    {
      id: "food-water",
      label: "飲み水",
      priority: "ESSENTIAL",
      icon: "water",
      slots: ["WATER_STORAGE", "WATER_TREATMENT"]
    },
    {
      id: "food-trail-snacks",
      label: "行動食",
      priority: "ESSENTIAL",
      icon: "trailFood"
    },
    {
      id: "food-meals",
      label: "食事・非常食",
      priority: "SUGGESTED",
      icon: "meal"
    }
  ];

  if (!hasAnyRequiredSlot(plan, ["STOVE", "COOK_POT", "FUEL"])) {
    return items;
  }

  return [
    ...items,
    {
      id: "food-stove",
      label: "バーナー",
      priority: "SUGGESTED",
      icon: "stove",
      slots: ["STOVE"]
    },
    {
      id: "food-cook-pot",
      label: "クッカー",
      priority: "SUGGESTED",
      icon: "cookPot",
      slots: ["COOK_POT"]
    },
    {
      id: "food-fuel",
      label: "ガス缶",
      priority: "SUGGESTED",
      icon: "fuel",
      slots: ["FUEL"]
    }
  ];
}

function getNavigationItems(plan: PackRequirementPlan): ChecklistItemDefinition[] {
  const headlampPriority = getHeadlampPriority(plan);
  const items: ChecklistItemDefinition[] = [
    {
      id: "nav-map-app",
      label: "登山地図アプリ（YAMAP・ヤマレコ等）",
      priority: "ESSENTIAL",
      icon: "navigationApp"
    },
    {
      id: "nav-map-compass",
      label: "紙地図・コンパス",
      priority: getBackupNavigationPriority(plan),
      icon: "mapCompass"
    }
  ];

  if (shouldShowGpsDevice(plan)) {
    items.push({
      id: "nav-gps-device",
      label: "GPS端末",
      priority: "SUGGESTED",
      icon: "gpsDevice",
      slots: ["GPS_DEVICE"]
    });
  }

  items.push(
    {
      id: "nav-headlamp",
      label: "ヘッドランプ",
      priority: headlampPriority,
      icon: "headlamp",
      slots: ["HEADLAMP"]
    },
    {
      id: "nav-spare-battery",
      label: "ヘッドランプ予備電池",
      priority: headlampPriority === "ESSENTIAL" ? "SUGGESTED" : "OPTIONAL",
      icon: "battery"
    },
    {
      id: "nav-power-bank",
      label: "モバイルバッテリー",
      priority: isHighNavigationRisk(plan) ? "ESSENTIAL" : "SUGGESTED",
      icon: "battery",
      slots: ["POWER_BANK"]
    }
  );

  return items;
}

export function buildPlanChecklist({
  plan,
  checkedSlots = [],
  checkedChecklistOnlyIds = [],
  ownedGear = []
}: {
  plan: PackRequirementPlan;
  checkedSlots?: readonly RequirementSlot[];
  checkedChecklistOnlyIds?: readonly string[];
  ownedGear?: readonly GearMatchingOwnedGearMatch[];
}): ChecklistView {
  const slotPlansBySlot = new Map(
    plan.required_slots.map((slotPlan) => [slotPlan.slot, slotPlan])
  );
  const checkedSlotSet = new Set(checkedSlots);
  const checkedChecklistOnlySet = new Set(checkedChecklistOnlyIds);
  const categories = [
    ...getBaseCategories(plan),
    {
      id: "SPECIAL_GEAR" as const,
      items: getSpecialGearItems(plan)
    },
    {
      id: "OVERNIGHT_GEAR" as const,
      items: getOvernightGearItems(plan)
    }
  ]
    .map(({ id, items }) => {
      const checklistItems = items.map((item) => {
        return buildChecklistItem({
          definition: item,
          slotPlansBySlot,
          checkedSlotSet,
          checkedChecklistOnlySet,
          ownedGear
        });
      });

      return buildChecklistCategory(id, checklistItems);
    })
    .filter((category) => category.items.length > 0);

  return {
    categories,
    summary: calculateProgress(categories.flatMap((category) => category.items))
  };
}

function buildChecklistItem({
  definition,
  slotPlansBySlot,
  checkedSlotSet,
  checkedChecklistOnlySet,
  ownedGear
}: {
  definition: ChecklistItemDefinition;
  slotPlansBySlot: Map<RequirementSlot, PackRequirementSlotPlan>;
  checkedSlotSet: Set<RequirementSlot>;
  checkedChecklistOnlySet: Set<string>;
  ownedGear: readonly GearMatchingOwnedGearMatch[];
}): ChecklistItem {
  const slots = (definition.slots ?? []).filter((slot) => slotPlansBySlot.has(slot));
  const auxiliaryOwnedGear = matchChecklistOwnedGear(definition, ownedGear);
  const source: ChecklistItemSource =
    slots.length > 0 || auxiliaryOwnedGear.length > 0
      ? "GEAR_BACKED"
      : "CHECKLIST_ONLY";
  const toggleSlots = slots.filter((slot) => {
    const slotPlan = slotPlansBySlot.get(slot);

    return slotPlan?.coverage_status === "MISSING";
  });
  const matchingOwnedGear = uniqueOwnedGear(
    [
      ...slots.flatMap((slot) => slotPlansBySlot.get(slot)?.matching_owned_gear ?? []),
      ...auxiliaryOwnedGear
    ]
  );
  const checked =
    source === "GEAR_BACKED"
      ? slots.length > 0
        ? slots.every((slot) => {
            const slotPlan = slotPlansBySlot.get(slot);

            return (
              slotPlan?.coverage_status === "COVERED" ||
              (slotPlan?.coverage_status === "MISSING" && checkedSlotSet.has(slot))
            );
          })
        : auxiliaryOwnedGear.length > 0
      : checkedChecklistOnlySet.has(definition.id);

  return {
    ...definition,
    source,
    checked,
    slots,
    toggleSlots,
    matchingOwnedGear
  };
}

function buildChecklistCategory(
  id: ChecklistCategoryId,
  items: ChecklistItem[]
): ChecklistCategory {
  return {
    id,
    label: categoryLabels[id],
    items,
    progress: calculateProgress(items),
    priorityGroups: checklistPriorityOrder
      .map((priority) => ({
        priority,
        label: checklistPriorityLabels[priority],
        items: items.filter((item) => item.priority === priority)
      }))
      .filter((group) => group.items.length > 0)
  };
}

function calculateProgress(items: readonly ChecklistItem[]): ChecklistProgress {
  const totalWeight = items.reduce((total, item) => {
    return total + priorityWeights[item.priority];
  }, 0);
  const checkedWeight = items.reduce((total, item) => {
    return item.checked ? total + priorityWeights[item.priority] : total;
  }, 0);
  const checkedCount = items.filter((item) => item.checked).length;
  const totalCount = items.length;

  return {
    percent: totalWeight === 0 ? 0 : Math.round((checkedWeight / totalWeight) * 100),
    checkedCount,
    missingCount: totalCount - checkedCount,
    totalCount
  };
}

function getSpecialGearItems(plan: PackRequirementPlan): ChecklistItemDefinition[] {
  const { mountain, season } = plan;
  const items: ChecklistItemDefinition[] = [];
  const needsHelmet =
    hasRequiredSlot(plan, "HELMET") ||
    mountain.helmet_guidance === "RECOMMENDED" ||
    mountain.helmet_guidance === "REQUIRED" ||
    mountain.technical_terrain === "CHAIN_LADDER" ||
    mountain.technical_terrain === "EXPOSED_SCRAMBLE";
  const needsTraction =
    hasRequiredSlot(plan, "TRACTION_DEVICE") ||
    mountain.snow_or_ice_risk === "LIKELY" ||
    mountain.snow_or_ice_risk === "WINTER_ALPINE" ||
    (mountain.snow_or_ice_risk === "SEASONAL_PATCHES" &&
      (season === "SPRING" || season === "AUTUMN" || season === "WINTER"));
  const winterSnow =
    mountain.snow_or_ice_risk === "WINTER_ALPINE" || season === "WINTER";

  if (needsHelmet) {
    items.push({
      id: "special-helmet",
      label: "ヘルメット",
      priority: mountain.helmet_guidance === "REQUIRED" ? "ESSENTIAL" : "SUGGESTED",
      icon: "helmet",
      slots: ["HELMET"]
    });
  }

  if (needsTraction) {
    items.push({
      id: "special-chain-spikes",
      label: "チェーンスパイク",
      priority:
        mountain.snow_or_ice_risk === "LIKELY" ||
        mountain.snow_or_ice_risk === "WINTER_ALPINE"
          ? "ESSENTIAL"
          : "SUGGESTED",
      icon: "traction",
      slots: ["TRACTION_DEVICE"]
    });
  }

  if (winterSnow) {
    items.push(
      {
        id: "special-crampons",
        label: "アイゼン",
        priority:
          mountain.snow_or_ice_risk === "WINTER_ALPINE" ? "ESSENTIAL" : "SUGGESTED",
        icon: "crampons"
      },
      {
        id: "special-ice-axe",
        label: "ピッケル",
        priority:
          mountain.snow_or_ice_risk === "WINTER_ALPINE" ? "SUGGESTED" : "OPTIONAL",
        icon: "iceAxe"
      }
    );
  }

  if (
    mountain.bear_or_wildlife_risk === "MODERATE" ||
    mountain.bear_or_wildlife_risk === "HIGH"
  ) {
    items.push({
      id: "special-bear-protection",
      label: "熊対策装備",
      priority: mountain.bear_or_wildlife_risk === "HIGH" ? "ESSENTIAL" : "SUGGESTED",
      icon: "bearProtection"
    });
  }

  return items;
}

function getOvernightGearItems(plan: PackRequirementPlan): ChecklistItemDefinition[] {
  if (plan.style === "DAY_HIKE") {
    return [];
  }

  if (usesTentStyle(plan.style, plan)) {
    return [
      {
        id: "overnight-tent",
        label: "テント",
        priority: "ESSENTIAL",
        icon: "tent",
        slots: ["TENT"]
      },
      {
        id: "overnight-sleeping-bag",
        label: "シュラフ（寝袋）",
        priority: "ESSENTIAL",
        icon: "sleepingBag",
        slots: ["SLEEP_INSULATION"]
      },
      {
        id: "overnight-sleeping-pad",
        label: "スリーピングマット",
        priority: "ESSENTIAL",
        icon: "sleepingPad",
        slots: ["SLEEP_PAD"]
      },
      {
        id: "overnight-pegs",
        label: "ペグ",
        priority: "SUGGESTED",
        icon: "pegs"
      },
      {
        id: "overnight-groundsheet",
        label: "グランドシート",
        priority: "SUGGESTED",
        icon: "groundsheet",
        ownedGearMatcher: "GROUNDSHEET"
      }
    ];
  }

  return [
    {
      id: "overnight-inner-sheet",
      label: "インナーシーツ",
      priority: "ESSENTIAL",
      icon: "innerSheet",
      slots: ["SLEEP_INSULATION"]
    },
    {
      id: "overnight-toiletries",
      label: "洗面用品",
      priority: "SUGGESTED",
      icon: "toiletries"
    },
    {
      id: "overnight-earplugs",
      label: "耳栓",
      priority: "OPTIONAL",
      icon: "earplugs"
    }
  ];
}

function usesTentStyle(style: MountainFoundationStyle, plan: PackRequirementPlan) {
  return style === "OVERNIGHT_TENT" || hasRequiredSlot(plan, "TENT");
}

function hasRequiredSlot(plan: PackRequirementPlan, slot: RequirementSlot) {
  return plan.required_slots.some((slotPlan) => slotPlan.slot === slot);
}

function hasAnyRequiredSlot(plan: PackRequirementPlan, slots: readonly RequirementSlot[]) {
  return slots.some((slot) => hasRequiredSlot(plan, slot));
}

function getGlovesPriority(plan: PackRequirementPlan): ChecklistPriority {
  const { mountain, season } = plan;

  if (
    season === "WINTER" ||
    mountain.snow_or_ice_risk === "WINTER_ALPINE" ||
    mountain.snow_or_ice_risk === "LIKELY"
  ) {
    return "ESSENTIAL";
  }

  if (
    season === "AUTUMN" ||
    ["ABOVE_TREELINE", "HIGH_ALPINE_EXPOSED"].includes(
      mountain.alpine_environment ?? ""
    ) ||
    ["HIGH", "EXTREME"].includes(mountain.route_seriousness ?? "")
  ) {
    return "SUGGESTED";
  }

  return "OPTIONAL";
}

function getHeadlampPriority(plan: PackRequirementPlan): ChecklistPriority {
  if (isHighNavigationRisk(plan) || plan.style !== "DAY_HIKE") {
    return "ESSENTIAL";
  }

  const { mountain } = plan;

  if (
    mountain.route_duration_band === "SHORT" &&
    mountain.route_seriousness === "LOW" &&
    mountain.technical_terrain === "MAINTAINED_TRAIL" &&
    mountain.alpine_environment === "LOWLAND_FOREST"
  ) {
    return "OPTIONAL";
  }

  return "SUGGESTED";
}

function getBackupNavigationPriority(plan: PackRequirementPlan): ChecklistPriority {
  if (isHighNavigationRisk(plan)) {
    return "SUGGESTED";
  }

  return "OPTIONAL";
}

function shouldShowGpsDevice(plan: PackRequirementPlan) {
  return hasRequiredSlot(plan, "GPS_DEVICE") && isHighNavigationRisk(plan);
}

function isHighNavigationRisk(plan: PackRequirementPlan) {
  const { mountain, season } = plan;

  return (
    plan.style === "MULTI_DAY_TREK" ||
    mountain.route_duration_band === "LONG_DAY" ||
    mountain.route_duration_band === "MULTI_DAY" ||
    ["HIGH", "EXTREME"].includes(mountain.route_seriousness ?? "") ||
    ["CHAIN_LADDER", "EXPOSED_SCRAMBLE"].includes(
      mountain.technical_terrain ?? ""
    ) ||
    ["LIMITED", "REMOTE"].includes(mountain.escape_options ?? "") ||
    ["POOR", "NONE"].includes(mountain.cell_signal_reliability ?? "") ||
    mountain.alpine_environment === "HIGH_ALPINE_EXPOSED" ||
    season === "WINTER"
  );
}

function matchChecklistOwnedGear(
  definition: ChecklistItemDefinition,
  ownedGear: readonly GearMatchingOwnedGearMatch[]
) {
  if (definition.ownedGearMatcher !== "GROUNDSHEET") {
    return [];
  }

  return ownedGear.filter(isGroundsheetGear);
}

function isGroundsheetGear(item: GearMatchingOwnedGearMatch) {
  const text = [
    item.name,
    item.brand,
    item.model,
    item.gear_categories?.name_en,
    item.gear_categories?.name_ja,
    item.gear_subcategories?.name_en,
    item.gear_subcategories?.name_ja
  ]
    .filter(Boolean)
    .join(" ")
    .normalize("NFKC");

  return (
    /ground\s*sheet|groundsheet|foot\s*print|footprint/i.test(text) ||
    /グラウンドシート|グランドシート|フットプリント|地布/.test(text)
  );
}

function uniqueOwnedGear(matches: GearMatchingOwnedGearMatch[]) {
  const matchesById = new Map<string, GearMatchingOwnedGearMatch>();

  for (const match of matches) {
    matchesById.set(match.id, match);
  }

  return Array.from(matchesById.values());
}

export function calculateChecklistProgress(
  plan: PackRequirementPlan,
  checkedSlots: readonly RequirementSlot[] = [],
  checkedChecklistOnlyIds: readonly string[] = [],
  ownedGear: readonly GearMatchingOwnedGearMatch[] = []
) {
  return buildPlanChecklist({
    plan,
    checkedSlots,
    checkedChecklistOnlyIds,
    ownedGear
  }).summary.percent;
}

export function applyChecklistOnlyIdsToChecklist(
  checklist: ChecklistView,
  checkedChecklistOnlyIds: readonly string[]
): ChecklistView {
  const checkedChecklistOnlySet = new Set(
    checkedChecklistOnlyIds.filter(isSupportedChecklistOnlyId)
  );
  const categories = checklist.categories.map((category) => {
    const items = category.items.map((item) => {
      if (item.source !== "CHECKLIST_ONLY") {
        return item;
      }

      return {
        ...item,
        checked: checkedChecklistOnlySet.has(item.id)
      };
    });

    return buildChecklistCategory(category.id, items);
  });

  return {
    categories,
    summary: calculateProgress(categories.flatMap((category) => category.items))
  };
}

export function getChecklistOnlyStorageKey(planId: string) {
  return `yamajitaku:trip-plan:checklist-only:${planId}`;
}

export function isSupportedChecklistOnlyId(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 80;
}
