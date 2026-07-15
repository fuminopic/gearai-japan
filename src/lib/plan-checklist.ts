import type {
  GearMatchingOwnedGearMatch,
  MountainFoundationStyle,
  PackRequirementPlan,
  PackRequirementSlotPlan,
  RequirementSlot
} from "@/lib/types";
import {
  matchOwnedGearForChecklist,
  type ChecklistOwnedGearMatcher
} from "@/lib/checklist-owned-gear-matchers";

export type ChecklistPriority = "ESSENTIAL" | "SUGGESTED" | "OPTIONAL";
export type ChecklistItemSource = "GEAR_BACKED" | "CHECKLIST_ONLY";
export type ChecklistGearStatus = "PACKED" | "OWNED" | "MISSING";
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
  | "riverShoes"
  | "portableToilet"
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
  ownedGearMatcher?: ChecklistOwnedGearMatcher;
};

export type ChecklistItem = ChecklistItemDefinition & {
  source: ChecklistItemSource;
  checked: boolean;
  reason: string;
  slots: RequirementSlot[];
  toggleSlots: RequirementSlot[];
  matchingOwnedGear: GearMatchingOwnedGearMatch[];
  gearStatus: ChecklistGearStatus | null;
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

export type PreDepartureActionStatus = "MISSING" | "CONFIRM" | "DONE";

export type PreDepartureSummaryStatus =
  | "NEEDS_ACTION"
  | "ALMOST_READY"
  | "CONFIRMED";

export type PreDepartureSummaryItem = {
  id: string;
  label: string;
  categoryId: ChecklistCategoryId;
  categoryLabel: string;
  priority: ChecklistPriority;
  reason: string;
  status: PreDepartureActionStatus;
};

export type PreDepartureSummary = {
  status: PreDepartureSummaryStatus;
  statusLabel: string;
  statusDescription: string;
  canComplete: boolean;
  missingItems: PreDepartureSummaryItem[];
  confirmationItems: PreDepartureSummaryItem[];
  importantItems: PreDepartureSummaryItem[];
  importantConfirmationItems: PreDepartureSummaryItem[];
  missingCount: number;
  confirmationCount: number;
  importantCount: number;
  importantConfirmationCount: number;
};

export type PlanDecisionChip = {
  label: string;
  reason: string;
};

export type PlanNotNeededItem = {
  label: string;
  reason: string;
};

const checkedSlotsStoragePrefix = "yamajitaku:trip-plan:checked-slots:";

const supportedRequirementSlots = new Set<RequirementSlot>([
  "WATER_STORAGE",
  "WATER_TREATMENT",
  "TENT",
  "SLEEP_INSULATION",
  "SLEEP_PAD",
  "STOVE",
  "FUEL",
  "COOK_POT",
  "TABLEWARE",
  "RAIN_JACKET",
  "RAIN_PANTS",
  "INSULATION_LAYER",
  "BASE_LAYER",
  "HELMET",
  "TRACTION_DEVICE",
  "GPS_DEVICE",
  "POWER_BANK",
  "FIRST_AID_KIT",
  "HEADLAMP"
]);

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
          icon: "backpack",
          ownedGearMatcher: "BACKPACK"
        },
        {
          id: "action-trekking-poles",
          label: "トレッキングポール",
          priority: "SUGGESTED",
          icon: "trekkingPoles",
          ownedGearMatcher: "TREKKING_POLES"
        },
        {
          id: "action-sunglasses",
          label: "サングラス",
          priority: "SUGGESTED",
          icon: "sunglasses",
          ownedGearMatcher: "SUNGLASSES"
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
          icon: "whistle",
          ownedGearMatcher: "WHISTLE"
        },
        {
          id: "safety-emergency-sheet",
          label: "エマージェンシーシート",
          priority: getEmergencySheetPriority(plan),
          icon: "emergencySheet",
          ownedGearMatcher: "EMERGENCY_SHEET"
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
        icon: "hat",
        ownedGearMatcher: "HAT"
      },
      {
        id: "clothing-gloves",
        label: "手袋",
        priority: getGlovesPriority(plan),
        icon: "gloves",
        ownedGearMatcher: "GLOVES"
      },
      {
        id: "clothing-gaiters",
        label: "ゲイター",
        priority: "OPTIONAL",
        icon: "gaiters",
        ownedGearMatcher: "GAITERS"
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
      icon: "mapCompass",
      ownedGearMatcher: "MAP_COMPASS"
    }
  ];

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
      priority: getSpareBatteryPriority(plan, headlampPriority),
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
  ownedGear = [],
  packedGearIds = []
}: {
  plan: PackRequirementPlan;
  checkedSlots?: readonly RequirementSlot[];
  checkedChecklistOnlyIds?: readonly string[];
  ownedGear?: readonly GearMatchingOwnedGearMatch[];
  packedGearIds?: readonly string[];
}): ChecklistView {
  const slotPlansBySlot = new Map(
    plan.required_slots.map((slotPlan) => [slotPlan.slot, slotPlan])
  );
  const checkedSlotSet = new Set(checkedSlots);
  const checkedChecklistOnlySet = new Set(checkedChecklistOnlyIds);
  const packedGearIdSet = new Set(packedGearIds);
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
          plan,
          slotPlansBySlot,
          checkedSlotSet,
          checkedChecklistOnlySet,
          ownedGear,
          packedGearIdSet
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

const importantPreDepartureItemIds = new Set<string>([
  "nav-headlamp",
  "nav-power-bank",
  "safety-first-aid",
  "safety-insurance-card",
  "safety-whistle",
  "safety-emergency-sheet",
  "special-helmet",
  "special-chain-spikes",
  "special-crampons",
  "special-ice-axe",
  "special-volcano-information",
  "special-bear-protection",
  "special-river-crossing-shoes",
  "special-portable-toilet"
]);

export function buildPreDepartureSummary(
  checklist: ChecklistView
): PreDepartureSummary {
  const actionItems = checklist.categories.flatMap((category) => {
    return category.items
      .map((item) => {
        const status = getPreDepartureItemActionStatus(item);

        return {
          id: item.id,
          label: item.label,
          categoryId: category.id,
          categoryLabel: category.label,
          priority: item.priority,
          reason: item.reason,
          status,
          important: isImportantPreDepartureItem(category, item)
        };
      })
      .filter((item) => item.status !== "DONE");
  });
  const missingItems = actionItems.filter((item) => item.status === "MISSING");
  const confirmationItems = actionItems.filter((item) => item.status === "CONFIRM");
  const importantItems = actionItems.filter((item) => item.important);
  const importantConfirmationItems = importantItems.filter(
    (item) => item.status === "CONFIRM"
  );
  const canComplete =
    missingItems.length === 0 && importantConfirmationItems.length === 0;
  const status = getPreDepartureSummaryStatus({
    missingCount: missingItems.length,
    importantConfirmationCount: importantConfirmationItems.length
  });

  return {
    status,
    statusLabel: preDepartureStatusLabels[status],
    statusDescription: preDepartureStatusDescriptions[status],
    canComplete,
    missingItems: missingItems.map(toPreDepartureSummaryItem),
    confirmationItems: confirmationItems.map(toPreDepartureSummaryItem),
    importantItems: importantItems.map(toPreDepartureSummaryItem),
    importantConfirmationItems: importantConfirmationItems.map(
      toPreDepartureSummaryItem
    ),
    missingCount: missingItems.length,
    confirmationCount: confirmationItems.length,
    importantCount: importantItems.length,
    importantConfirmationCount: importantConfirmationItems.length
  };
}

export function getPreDepartureItemActionStatus(
  item: ChecklistItem
): PreDepartureActionStatus {
  if (item.checked) {
    return "DONE";
  }

  if (item.source !== "GEAR_BACKED") {
    return "CONFIRM";
  }

  return item.matchingOwnedGear.length > 0 ? "CONFIRM" : "MISSING";
}

export function isImportantPreDepartureItem(
  category: Pick<ChecklistCategory, "id">,
  item: Pick<ChecklistItem, "id">
) {
  return (
    category.id === "SAFETY_FIRST_AID" ||
    category.id === "SPECIAL_GEAR" ||
    importantPreDepartureItemIds.has(item.id)
  );
}

function getPreDepartureSummaryStatus({
  missingCount,
  importantConfirmationCount
}: {
  missingCount: number;
  importantConfirmationCount: number;
}): PreDepartureSummaryStatus {
  if (missingCount === 0 && importantConfirmationCount === 0) {
    return "CONFIRMED";
  }

  if (missingCount === 0) {
    return "ALMOST_READY";
  }

  return "NEEDS_ACTION";
}

const preDepartureStatusLabels: Record<PreDepartureSummaryStatus, string> = {
  NEEDS_ACTION: "出発前確認が必要です",
  ALMOST_READY: "準備はほぼ完了",
  CONFIRMED: "出発前確認済み"
};

const preDepartureStatusDescriptions: Record<PreDepartureSummaryStatus, string> = {
  NEEDS_ACTION: "不足と未確認の項目を確認してから出発準備を完了してください。",
  ALMOST_READY: "不足はありません。安全に関わる確認を済ませると出発前確認を完了できます。",
  CONFIRMED: "不足と重要な未確認項目はありません。出発前の最終確認は完了しています。"
};

function toPreDepartureSummaryItem({
  important: _important,
  ...item
}: PreDepartureSummaryItem & { important: boolean }) {
  return item;
}

function buildChecklistItem({
  definition,
  plan,
  slotPlansBySlot,
  checkedSlotSet,
  checkedChecklistOnlySet,
  ownedGear,
  packedGearIdSet
}: {
  definition: ChecklistItemDefinition;
  plan: PackRequirementPlan;
  slotPlansBySlot: Map<RequirementSlot, PackRequirementSlotPlan>;
  checkedSlotSet: Set<RequirementSlot>;
  checkedChecklistOnlySet: Set<string>;
  ownedGear: readonly GearMatchingOwnedGearMatch[];
  packedGearIdSet: ReadonlySet<string>;
}): ChecklistItem {
  const slots = (definition.slots ?? []).filter((slot) => slotPlansBySlot.has(slot));
  const auxiliaryOwnedGear = matchChecklistOwnedGear(definition, ownedGear);
  const source: ChecklistItemSource =
    slots.length > 0 || auxiliaryOwnedGear.length > 0
      ? "GEAR_BACKED"
      : "CHECKLIST_ONLY";
  // 所持済みかどうかに関係なく、今回の山行で確認する requirement slot は切り替え可能。
  const toggleSlots = slots;
  const matchingOwnedGear = uniqueOwnedGear(
    [
      ...slots.flatMap((slot) => slotPlansBySlot.get(slot)?.matching_owned_gear ?? []),
      ...auxiliaryOwnedGear
    ]
  );
  const checked =
    source === "GEAR_BACKED"
      ? slots.length > 0
        ? slots.every((slot) => checkedSlotSet.has(slot))
        : checkedChecklistOnlySet.has(definition.id)
      : checkedChecklistOnlySet.has(definition.id);
  const gearStatus =
    source === "GEAR_BACKED"
      ? matchingOwnedGear.some((gear) => packedGearIdSet.has(gear.id))
        ? "PACKED"
        : matchingOwnedGear.length > 0
          ? "OWNED"
          : "MISSING"
      : null;

  return {
    ...definition,
    source,
    checked,
    reason: getChecklistItemReason(definition, plan),
    slots,
    toggleSlots,
    matchingOwnedGear,
    gearStatus
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
    isLowMountainWinterTractionContext(plan) ||
    (mountain.snow_or_ice_risk === "SEASONAL_PATCHES" &&
      (season === "SPRING" || season === "AUTUMN" || season === "WINTER"));
  const needsCrampons = requiresCrampons(plan);
  const needsIceAxe = requiresIceAxe(plan);

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
          : isLowMountainWinterTractionContext(plan)
            ? "OPTIONAL"
          : "SUGGESTED",
      icon: "traction",
      slots: ["TRACTION_DEVICE"]
    });
  }

  if (needsCrampons) {
    items.push({
      id: "special-crampons",
      label: "アイゼン",
      priority: mountain.snow_or_ice_risk === "WINTER_ALPINE" ? "ESSENTIAL" : "SUGGESTED",
      icon: "crampons",
      ownedGearMatcher: "CRAMPONS"
    });
  }

  if (needsIceAxe) {
    items.push({
      id: "special-ice-axe",
      label: "ピッケル",
      priority: mountain.snow_or_ice_risk === "WINTER_ALPINE" ? "SUGGESTED" : "OPTIONAL",
      icon: "iceAxe",
      ownedGearMatcher: "ICE_AXE"
    });
  }

  if (requiresVolcanoInformationCheck(plan)) {
    items.push({
      id: "special-volcano-information",
      label: "火山情報の確認",
      priority: "ESSENTIAL",
      icon: "firstAid"
    });
  }

  if (
    mountain.bear_or_wildlife_risk === "MODERATE" ||
    mountain.bear_or_wildlife_risk === "HIGH"
  ) {
    items.push({
      id: "special-bear-protection",
      label: "熊対策装備",
      priority: mountain.bear_or_wildlife_risk === "HIGH" ? "ESSENTIAL" : "SUGGESTED",
      icon: "bearProtection",
      ownedGearMatcher: "BEAR_PROTECTION"
    });
  }

  if (requiresRiverCrossingShoes(plan)) {
    items.push({
      id: "special-river-crossing-shoes",
      label: "渡渉用シューズ（沢靴・替え靴）",
      priority: "ESSENTIAL",
      icon: "riverShoes",
      ownedGearMatcher: "WATER_CROSSING_SHOES"
    });
  }

  if (requiresPortableToilet(plan)) {
    items.push({
      id: "special-portable-toilet",
      label: "携帯トイレ",
      priority: "ESSENTIAL",
      icon: "portableToilet",
      ownedGearMatcher: "PORTABLE_TOILET"
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
        icon: "pegs",
        ownedGearMatcher: "PEGS"
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
    getHutSleepItem(plan),
    ...(hasRequiredSlot(plan, "SLEEP_PAD")
      ? [
          {
            id: "overnight-hut-sleeping-pad",
            label: "スリーピングマット",
            priority: "ESSENTIAL" as const,
            icon: "sleepingPad" as const,
            slots: ["SLEEP_PAD" as const]
          }
        ]
      : []),
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

function getHutSleepItem(plan: PackRequirementPlan): ChecklistItemDefinition {
  if (hasRequiredSlot(plan, "SLEEP_INSULATION")) {
    return {
      id: "overnight-hut-sleeping-bag",
      label: "シュラフ（寝袋）",
      priority: "ESSENTIAL",
      icon: "sleepingBag",
      slots: ["SLEEP_INSULATION"]
    };
  }

  return {
    id: "overnight-inner-sheet",
    label: "インナーシーツ",
    priority: "ESSENTIAL",
    icon: "innerSheet",
    ownedGearMatcher: "INNER_SHEET"
  };
}

function getChecklistItemReason(
  definition: ChecklistItemDefinition,
  plan: PackRequirementPlan
) {
  const { mountain, season, style } = plan;
  const seasonLabel = getSeasonReasonLabel(season);

  if (definition.id === "clothing-rainwear") {
    return `${mountain.name_ja}では天候が変わることがあるため、上下の雨具を出発前に確認してください。`;
  }

  if (definition.id === "clothing-insulation") {
    if (
      season === "AUTUMN" ||
      season === "WINTER" ||
      ["ABOVE_TREELINE", "HIGH_ALPINE_EXPOSED"].includes(
        mountain.alpine_environment ?? ""
      )
    ) {
      return `${seasonLabel}の高所や稜線では停滞時に冷えやすいため、防寒着を確認してください。`;
    }

    return "休憩時や天候悪化時に体温を保つため、防寒着を一枚準備しておくと安心です。";
  }

  if (definition.id === "clothing-base-layer") {
    return "汗冷えを防ぐため、乾きやすい肌着・ベースレイヤーを選んでください。";
  }

  if (definition.id === "clothing-gloves") {
    return definition.priority === "OPTIONAL"
      ? "低山の日帰りでは必須ではありませんが、朝夕の冷えや手すり利用に備えて確認します。"
      : "稜線の風や低温で手先が冷えやすいため、手袋を確認してください。";
  }

  if (definition.id === "food-water") {
    if (mountain.water_availability === "UNRELIABLE") {
      return "水場が涸れる可能性があるため、水を多めに携行し、必要に応じた浄水手段も確認してください。";
    }

    if (mountain.water_availability === "LIMITED_OR_SEASONAL") {
      return "水場が限られるため、飲み水と必要に応じた浄水手段を多めに確認してください。";
    }

    return "行動中の脱水を防ぐため、飲み水とボトル容量を出発前に確認してください。";
  }

  if (definition.id === "food-trail-snacks") {
    return "歩きながら補給できる行動食は、疲労やシャリバテを防ぐために確認します。";
  }

  if (definition.id === "food-meals") {
    return "行程が長引いた場合に備えて、食事や非常食を少し余裕を持って確認してください。";
  }

  if (
    definition.id === "food-stove" ||
    definition.id === "food-cook-pot" ||
    definition.id === "food-fuel"
  ) {
    return "今回の計画で調理装備が必要な条件のため、バーナー・クッカー・燃料をまとめて確認します。";
  }

  if (definition.id === "nav-map-app") {
    return "スマホの登山地図アプリを事前に準備し、地図のダウンロードと現在地確認を済ませてください。";
  }

  if (definition.id === "nav-map-compass") {
    return isHighNavigationRisk(plan)
      ? "電波や視界が不安定な場面に備えて、紙地図・コンパスも確認してください。"
      : "必要に応じてスマホ以外の確認手段として紙地図・コンパスを準備します。";
  }

  if (definition.id === "nav-headlamp") {
    return definition.priority === "ESSENTIAL"
      ? "長時間行動や宿泊を想定し、暗くなる前提でヘッドランプを確認してください。"
      : "日帰りでも下山遅れに備えて、ヘッドランプの有無を確認してください。";
  }

  if (definition.id === "nav-power-bank") {
    return "登山地図アプリや連絡手段を保つため、モバイルバッテリーを確認してください。";
  }

  if (definition.id === "safety-first-aid") {
    return "小さなけがや靴ずれにすぐ対応できるよう、救急セットを確認してください。";
  }

  if (definition.id === "safety-insurance-card") {
    return "万一の手続きに備えて、保険証や保険情報をすぐ確認できる状態にしてください。";
  }

  if (definition.id === "safety-emergency-sheet") {
    return isForcedBivouacRisk(plan)
      ? "長時間行動や退避困難時の停滞に備えて、エマージェンシーシートを必ず確認してください。"
      : "休憩時の冷えや下山遅れに備えて、エマージェンシーシートを確認してください。";
  }

  if (definition.id === "special-helmet") {
    return mountain.helmet_guidance === "REQUIRED"
      ? "落石や岩場の危険が高いルートのため、ヘルメットを必ず確認してください。"
      : "鎖場・岩稜・落石リスクのある区間に備えて、ヘルメットを確認してください。";
  }

  if (definition.id === "special-chain-spikes") {
    return mountain.snow_or_ice_risk === "WINTER_ALPINE" ||
      mountain.snow_or_ice_risk === "LIKELY"
      ? "雪や凍結の可能性があるため、チェーンスパイク等の滑り止めを確認してください。アイゼン等の要否は直前の山行記録・現地情報で確認してください。"
      : "冬季や季節・標高によって凍結が残ることがあるため、チェーンスパイク等の滑り止めを確認してください。積雪・凍結状況により必要装備が変わります。";
  }

  if (definition.id === "special-crampons") {
    return "アイゼン等の要否は直前の山行記録・現地情報で確認してください。本格的な雪山は経験者判断が必要です。";
  }

  if (definition.id === "special-ice-axe") {
    return "ピッケル等が必要な本格的な雪山は経験者判断が必要です。直前の山行記録・現地情報で条件を確認してください。";
  }

  if (definition.id === "special-volcano-information") {
    return "活火山・火山監視対象の山です。噴火警戒レベル、入山規制、気象庁・自治体などの公式情報を出発前に必ず確認してください。";
  }

  if (definition.id === "special-bear-protection") {
    return getBearProtectionReason(mountain);
  }

  if (definition.id === "overnight-tent") {
    return "テント泊計画のため、テント本体と設営に必要な付属品を確認してください。";
  }

  if (
    definition.id === "overnight-sleeping-bag" ||
    definition.id === "overnight-hut-sleeping-bag"
  ) {
    return style === "OVERNIGHT_HUT"
      ? "寝具提供がない小屋泊に備えて、シュラフを確認してください。"
      : "夜間の気温低下に備えて、季節に合うシュラフを確認してください。";
  }

  if (definition.id === "overnight-groundsheet") {
    return "テント底面の保護と濡れ対策のため、グランドシートを確認してください。";
  }

  if (definition.id === "overnight-inner-sheet") {
    return "小屋泊の衛生面と寝具利用に備えて、インナーシーツを確認してください。";
  }

  return `${mountain.name_ja}の${seasonLabel}・${getStyleReasonLabel(style)}計画に合わせて、出発前に確認してください。`;
}

function isHokkaidoMountain(mountain: PackRequirementPlan["mountain"]): boolean {
  return (
    mountain.primary_region === "HOKKAIDO" ||
    mountain.region === "HOKKAIDO" ||
    mountain.prefectures.includes("北海道")
  );
}

function getBearProtectionReason(mountain: PackRequirementPlan["mountain"]): string {
  if (isHokkaidoMountain(mountain)) {
    return "ヒグマとの遭遇リスクに備えて、熊スプレー、食料管理、出没情報確認を必ず行ってください。";
  }

  return "ツキノワグマなどの出没情報確認を行い、熊鈴の携行と行動中の注意を徹底してください。";
}

function requiresVolcanoInformationCheck(plan: PackRequirementPlan): boolean {
  const { mountain } = plan;

  if (mountain.volcanic_risk === "ACTIVE_RESTRICTED") {
    return false;
  }

  return (
    mountain.volcanic_risk === "ACTIVE_MONITORED" ||
    mountain.active_volcano_status === "ACTIVE"
  );
}

export function buildPlanDecisionChips(plan: PackRequirementPlan): PlanDecisionChip[] {
  const { mountain } = plan;
  const chips: PlanDecisionChip[] = [];

  if (
    mountain.alpine_environment === "ABOVE_TREELINE" ||
    mountain.alpine_environment === "HIGH_ALPINE_EXPOSED"
  ) {
    chips.push({
      label: "高所稜線",
      reason: "森林限界以上の風雨と低温を考慮"
    });
  }

  if (
    plan.season === "WINTER" ||
    mountain.snow_or_ice_risk === "SEASONAL_PATCHES" ||
    mountain.snow_or_ice_risk === "LIKELY" ||
    mountain.snow_or_ice_risk === "WINTER_ALPINE"
  ) {
    chips.push({
      label: "残雪・凍結",
      reason: "季節や標高による足元リスクを考慮"
    });
  }

  if (
    mountain.technical_terrain === "CHAIN_LADDER" ||
    mountain.technical_terrain === "EXPOSED_SCRAMBLE" ||
    mountain.helmet_guidance === "RECOMMENDED" ||
    mountain.helmet_guidance === "REQUIRED"
  ) {
    chips.push({
      label: "鎖場・岩稜",
      reason: "転倒・落石・手を使う通過を考慮"
    });
  }

  if (
    mountain.water_availability === "LIMITED_OR_SEASONAL" ||
    mountain.water_availability === "UNRELIABLE"
  ) {
    chips.push({
      label: "水場限定",
      reason:
        mountain.water_availability === "UNRELIABLE"
          ? "水場が涸れる可能性と水を多めに携行する必要性を考慮"
          : "飲み水の補給しづらさを考慮"
    });
  }

  if (
    mountain.cell_signal_reliability === "PARTIAL" ||
    mountain.cell_signal_reliability === "POOR" ||
    mountain.cell_signal_reliability === "NONE"
  ) {
    chips.push({
      label: "電波不安定",
      reason: "スマホ依存を下げる必要性を考慮"
    });
  }

  if (
    mountain.route_duration_band === "LONG_DAY" ||
    mountain.route_duration_band === "MULTI_DAY" ||
    mountain.route_seriousness === "HIGH" ||
    mountain.route_seriousness === "EXTREME"
  ) {
    chips.push({
      label: "長時間行動",
      reason: "下山遅れと疲労時の余裕を考慮"
    });
  }

  return chips;
}

export function buildPlanNotNeededItems(
  plan: PackRequirementPlan
): PlanNotNeededItem[] {
  const items: PlanNotNeededItem[] = [];

  if (plan.style === "DAY_HIKE") {
    items.push(
      {
        label: "テント",
        reason: "日帰り計画のため、宿泊用テントは今回不要です。"
      },
      {
        label: "シュラフ",
        reason: "日帰り計画のため、寝袋は今回不要です。"
      },
      {
        label: "キャンプ装備",
        reason: "テント泊ではないため、ペグやグランドシートなどは今回不要です。"
      }
    );
  }

  if (
    plan.style === "OVERNIGHT_HUT" &&
    !hasRequiredSlot(plan, "SLEEP_INSULATION")
  ) {
    items.push({
      label: "シュラフ",
      reason: "寝具提供のある小屋泊として扱うため、寝袋は今回不要です。"
    });
  }

  if (isLowRiskMaintainedTrail(plan)) {
    items.push({
      label: "ヘルメット",
      reason: "低リスクの整備道として扱うため、ヘルメットは今回不要です。"
    });
  }

  return items;
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

function isLowRiskMaintainedTrail(plan: PackRequirementPlan) {
  const { mountain } = plan;

  return (
    mountain.helmet_guidance === "NOT_NEEDED" &&
    mountain.technical_terrain === "MAINTAINED_TRAIL" &&
    ["LOW", "MODERATE"].includes(mountain.route_seriousness ?? "")
  );
}

function getSeasonReasonLabel(season: PackRequirementPlan["season"]) {
  const labels: Record<PackRequirementPlan["season"], string> = {
    SPRING: "春",
    SUMMER: "夏",
    AUTUMN: "秋",
    WINTER: "冬"
  };

  return labels[season];
}

function getStyleReasonLabel(style: MountainFoundationStyle) {
  const labels: Record<MountainFoundationStyle, string> = {
    DAY_HIKE: "日帰り",
    OVERNIGHT_HUT: "小屋泊",
    OVERNIGHT_TENT: "テント泊",
    MULTI_DAY_TREK: "縦走"
  };

  return labels[style];
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

function getSpareBatteryPriority(
  plan: PackRequirementPlan,
  headlampPriority: ChecklistPriority
): ChecklistPriority {
  if (isForcedBivouacRisk(plan)) {
    return "ESSENTIAL";
  }

  return headlampPriority === "ESSENTIAL" ? "SUGGESTED" : "OPTIONAL";
}

function getEmergencySheetPriority(plan: PackRequirementPlan): ChecklistPriority {
  return isForcedBivouacRisk(plan) ? "ESSENTIAL" : "SUGGESTED";
}

function getBackupNavigationPriority(plan: PackRequirementPlan): ChecklistPriority {
  if (isHighNavigationRisk(plan)) {
    return "SUGGESTED";
  }

  return "OPTIONAL";
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

function isForcedBivouacRisk(plan: PackRequirementPlan) {
  const { mountain } = plan;

  return (
    plan.style === "MULTI_DAY_TREK" ||
    mountain.route_duration_band === "LONG_DAY" ||
    mountain.route_duration_band === "MULTI_DAY" ||
    mountain.route_seriousness === "EXTREME" ||
    mountain.escape_options === "REMOTE" ||
    mountain.cell_signal_reliability === "NONE" ||
    (mountain.cell_signal_reliability === "POOR" &&
      ["HIGH", "EXTREME"].includes(mountain.route_seriousness ?? ""))
  );
}

function isLowMountainWinterTractionContext(plan: PackRequirementPlan) {
  const { mountain, season } = plan;

  return (
    season === "WINTER" &&
    mountain.snow_or_ice_risk === "LOW" &&
    mountain.elevation_m < 1500 &&
    mountain.technical_terrain === "MAINTAINED_TRAIL" &&
    mountain.route_seriousness === "LOW"
  );
}

function requiresCrampons(plan: PackRequirementPlan) {
  const { mountain, season } = plan;

  if (mountain.snow_or_ice_risk === "WINTER_ALPINE") {
    return true;
  }

  return (
    season === "WINTER" &&
    mountain.snow_or_ice_risk === "LIKELY" &&
    mountain.elevation_m >= 1500 &&
    (["ABOVE_TREELINE", "HIGH_ALPINE_EXPOSED"].includes(
      mountain.alpine_environment ?? ""
    ) ||
      ["HIGH", "EXTREME"].includes(mountain.route_seriousness ?? ""))
  );
}

function requiresIceAxe(plan: PackRequirementPlan) {
  const { mountain, season } = plan;

  if (mountain.snow_or_ice_risk === "WINTER_ALPINE") {
    return true;
  }

  return (
    season === "WINTER" &&
    mountain.snow_or_ice_risk === "LIKELY" &&
    mountain.elevation_m >= 2000 &&
    (mountain.technical_terrain === "STEEP_ROCKY" ||
      mountain.technical_terrain === "CHAIN_LADDER" ||
      mountain.technical_terrain === "EXPOSED_SCRAMBLE") &&
    ["HIGH", "EXTREME"].includes(mountain.route_seriousness ?? "")
  );
}

function requiresRiverCrossingShoes(plan: PackRequirementPlan) {
  return /渡渉|徒渉|沢靴|替え靴|川渡り/.test(getMountainNotesText(plan));
}

function requiresPortableToilet(plan: PackRequirementPlan) {
  return /携帯トイレ|トイレ無|山中トイレ無/.test(getMountainNotesText(plan));
}

function getMountainNotesText(plan: PackRequirementPlan) {
  const { mountain } = plan;

  return [
    mountain.mandatory_gear_note,
    mountain.supplementary_notes,
    mountain.restriction_status_note
  ]
    .filter(Boolean)
    .join(" ")
    .normalize("NFKC");
}

function matchChecklistOwnedGear(
  definition: ChecklistItemDefinition,
  ownedGear: readonly GearMatchingOwnedGearMatch[]
) {
  if (!definition.ownedGearMatcher) {
    return [];
  }

  return matchOwnedGearForChecklist(definition.ownedGearMatcher, ownedGear);
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

export function filterCheckedSlotsForPlan(
  checkedSlots: readonly RequirementSlot[],
  plan: Pick<PackRequirementPlan, "required_slots">
) {
  const currentPlanSlots = new Set(plan.required_slots.map((slotPlan) => slotPlan.slot));
  const uniqueSlots: RequirementSlot[] = [];

  for (const slot of checkedSlots) {
    if (isSupportedRequirementSlot(slot) && !uniqueSlots.includes(slot)) {
      uniqueSlots.push(slot);
    }
  }

  return uniqueSlots.filter((slot) => currentPlanSlots.has(slot));
}

export function applyChecklistOnlyIdsToChecklist(
  checklist: ChecklistView,
  checkedChecklistOnlyIds: readonly string[]
): ChecklistView {
  return applyChecklistStateToChecklist({
    checklist,
    checkedChecklistOnlyIds
  });
}

export function applyChecklistStateToChecklist({
  checklist,
  checkedSlots,
  checkedChecklistOnlyIds
}: {
  checklist: ChecklistView;
  checkedSlots?: readonly RequirementSlot[];
  checkedChecklistOnlyIds?: readonly string[];
}): ChecklistView {
  const shouldApplyCheckedSlots = Array.isArray(checkedSlots);
  const shouldApplyChecklistOnlyIds = Array.isArray(checkedChecklistOnlyIds);
  const checkedSlotSet = new Set(
    (checkedSlots ?? []).filter(isSupportedRequirementSlot)
  );
  const checkedChecklistOnlySet = new Set(
    (checkedChecklistOnlyIds ?? []).filter(isSupportedChecklistOnlyId)
  );
  const categories = checklist.categories.map((category) => {
    const items = category.items.map((item) => {
      if (item.source === "GEAR_BACKED") {
        if (item.toggleSlots.length > 0 && shouldApplyCheckedSlots) {
          return {
            ...item,
            checked: item.toggleSlots.every((slot) => checkedSlotSet.has(slot))
          };
        }

        if (item.toggleSlots.length === 0 && shouldApplyChecklistOnlyIds) {
          return {
            ...item,
            checked: checkedChecklistOnlySet.has(item.id)
          };
        }

        if (item.toggleSlots.length === 0 || !shouldApplyCheckedSlots) {
          return item;
        }
      }

      if (item.source !== "CHECKLIST_ONLY" || !shouldApplyChecklistOnlyIds) {
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

export function getCheckedSlotsStorageKey(planId: string) {
  return `${checkedSlotsStoragePrefix}${planId}`;
}

export function isSupportedChecklistOnlyId(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 80;
}

export function isSupportedRequirementSlot(value: unknown): value is RequirementSlot {
  return typeof value === "string" && supportedRequirementSlots.has(value as RequirementSlot);
}
