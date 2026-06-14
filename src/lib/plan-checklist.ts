import type {
  GearMatchingOwnedGearMatch,
  MountainFoundationStyle,
  PackRequirementPlan,
  PackRequirementSlotPlan,
  RequirementSlot
} from "@/lib/types";

export type ChecklistPriority = "ESSENTIAL" | "SUGGESTED" | "OPTIONAL";
export type ChecklistItemSource = "GEAR_BACKED" | "CHECKLIST_ONLY";
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
  slots?: RequirementSlot[];
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

const baseCategories: Array<{
  id: ChecklistCategoryId;
  items: ChecklistItemDefinition[];
}> = [
  {
    id: "CLOTHING",
    items: [
      {
        id: "clothing-base-layer",
        label: "ベースレイヤー",
        priority: "ESSENTIAL",
        slots: ["BASE_LAYER"]
      },
      {
        id: "clothing-insulation",
        label: "防寒着",
        priority: "ESSENTIAL",
        slots: ["INSULATION_LAYER"]
      },
      {
        id: "clothing-rainwear",
        label: "レインウェア",
        priority: "ESSENTIAL",
        slots: ["RAIN_JACKET", "RAIN_PANTS"]
      },
      {
        id: "clothing-mid-layer",
        label: "ミドルレイヤー",
        priority: "SUGGESTED"
      },
      {
        id: "clothing-hat",
        label: "帽子",
        priority: "SUGGESTED"
      },
      {
        id: "clothing-gloves",
        label: "手袋",
        priority: "SUGGESTED"
      },
      {
        id: "clothing-gaiters",
        label: "ゲイター",
        priority: "OPTIONAL"
      }
    ]
  },
  {
    id: "ACTION_GEAR",
    items: [
      {
        id: "action-backpack",
        label: "ザック",
        priority: "ESSENTIAL"
      },
      {
        id: "action-trekking-poles",
        label: "トレッキングポール",
        priority: "SUGGESTED"
      },
      {
        id: "action-sunglasses",
        label: "サングラス",
        priority: "SUGGESTED"
      }
    ]
  },
  {
    id: "FOOD_WATER",
    items: [
      {
        id: "food-water",
        label: "水",
        priority: "ESSENTIAL",
        slots: ["WATER_STORAGE", "WATER_TREATMENT"]
      },
      {
        id: "food-trail-snacks",
        label: "行動食",
        priority: "ESSENTIAL"
      },
      {
        id: "food-meals",
        label: "食料",
        priority: "SUGGESTED"
      },
      {
        id: "food-stove",
        label: "バーナー",
        priority: "SUGGESTED",
        slots: ["STOVE"]
      },
      {
        id: "food-cook-pot",
        label: "クッカー",
        priority: "SUGGESTED",
        slots: ["COOK_POT"]
      },
      {
        id: "food-fuel",
        label: "ガス",
        priority: "SUGGESTED",
        slots: ["FUEL"]
      }
    ]
  },
  {
    id: "NAV_ELECTRONICS",
    items: [
      {
        id: "nav-map",
        label: "地図",
        priority: "ESSENTIAL"
      },
      {
        id: "nav-smartphone",
        label: "スマホ",
        priority: "ESSENTIAL"
      },
      {
        id: "nav-headlamp",
        label: "ヘッドランプ",
        priority: "ESSENTIAL",
        slots: ["HEADLAMP"]
      },
      {
        id: "nav-compass",
        label: "コンパス",
        priority: "SUGGESTED"
      },
      {
        id: "nav-gps",
        label: "GPS",
        priority: "SUGGESTED",
        slots: ["GPS_DEVICE"]
      },
      {
        id: "nav-spare-battery",
        label: "予備電池",
        priority: "SUGGESTED"
      },
      {
        id: "nav-power-bank",
        label: "モバイルバッテリー",
        priority: "SUGGESTED",
        slots: ["POWER_BANK"]
      }
    ]
  },
  {
    id: "SAFETY_FIRST_AID",
    items: [
      {
        id: "safety-first-aid",
        label: "ファーストエイド",
        priority: "ESSENTIAL",
        slots: ["FIRST_AID_KIT"]
      },
      {
        id: "safety-insurance-card",
        label: "保険証",
        priority: "ESSENTIAL"
      },
      {
        id: "safety-whistle",
        label: "ホイッスル",
        priority: "SUGGESTED"
      },
      {
        id: "safety-emergency-sheet",
        label: "エマージェンシーシート",
        priority: "SUGGESTED"
      }
    ]
  }
];

export function buildPlanChecklist({
  plan,
  checkedSlots = [],
  checkedChecklistOnlyIds = []
}: {
  plan: PackRequirementPlan;
  checkedSlots?: readonly RequirementSlot[];
  checkedChecklistOnlyIds?: readonly string[];
}): ChecklistView {
  const slotPlansBySlot = new Map(
    plan.required_slots.map((slotPlan) => [slotPlan.slot, slotPlan])
  );
  const checkedSlotSet = new Set(checkedSlots);
  const checkedChecklistOnlySet = new Set(checkedChecklistOnlyIds);
  const categories = [
    ...baseCategories,
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
          checkedChecklistOnlySet
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
  checkedChecklistOnlySet
}: {
  definition: ChecklistItemDefinition;
  slotPlansBySlot: Map<RequirementSlot, PackRequirementSlotPlan>;
  checkedSlotSet: Set<RequirementSlot>;
  checkedChecklistOnlySet: Set<string>;
}): ChecklistItem {
  const slots = (definition.slots ?? []).filter((slot) => slotPlansBySlot.has(slot));
  const source: ChecklistItemSource = slots.length > 0 ? "GEAR_BACKED" : "CHECKLIST_ONLY";
  const toggleSlots = slots.filter((slot) => {
    const slotPlan = slotPlansBySlot.get(slot);

    return slotPlan?.coverage_status === "MISSING";
  });
  const matchingOwnedGear = uniqueOwnedGear(
    slots.flatMap((slot) => slotPlansBySlot.get(slot)?.matching_owned_gear ?? [])
  );
  const checked =
    source === "GEAR_BACKED"
      ? slots.every((slot) => {
          const slotPlan = slotPlansBySlot.get(slot);

          return (
            slotPlan?.coverage_status === "COVERED" ||
            (slotPlan?.coverage_status === "MISSING" && checkedSlotSet.has(slot))
          );
        })
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
      slots: ["TRACTION_DEVICE"]
    });
  }

  if (winterSnow) {
    items.push(
      {
        id: "special-crampons",
        label: "アイゼン",
        priority: mountain.snow_or_ice_risk === "WINTER_ALPINE" ? "ESSENTIAL" : "SUGGESTED"
      },
      {
        id: "special-ice-axe",
        label: "ピッケル",
        priority: mountain.snow_or_ice_risk === "WINTER_ALPINE" ? "SUGGESTED" : "OPTIONAL"
      }
    );
  }

  if (mountain.bear_or_wildlife_risk === "MODERATE" || mountain.bear_or_wildlife_risk === "HIGH") {
    items.push({
      id: "special-bear-protection",
      label: "熊対策装備",
      priority: mountain.bear_or_wildlife_risk === "HIGH" ? "ESSENTIAL" : "SUGGESTED"
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
        slots: ["TENT"]
      },
      {
        id: "overnight-sleeping-bag",
        label: "シュラフ",
        priority: "ESSENTIAL",
        slots: ["SLEEP_INSULATION"]
      },
      {
        id: "overnight-sleeping-pad",
        label: "マット",
        priority: "ESSENTIAL",
        slots: ["SLEEP_PAD"]
      },
      {
        id: "overnight-pegs",
        label: "ペグ",
        priority: "SUGGESTED"
      },
      {
        id: "overnight-groundsheet",
        label: "グランドシート",
        priority: "SUGGESTED"
      }
    ];
  }

  return [
    {
      id: "overnight-inner-sheet",
      label: "インナーシーツ",
      priority: "ESSENTIAL",
      slots: ["SLEEP_INSULATION"]
    },
    {
      id: "overnight-toiletries",
      label: "洗面用品",
      priority: "SUGGESTED"
    },
    {
      id: "overnight-earplugs",
      label: "耳栓",
      priority: "OPTIONAL"
    }
  ];
}

function usesTentStyle(style: MountainFoundationStyle, plan: PackRequirementPlan) {
  return style === "OVERNIGHT_TENT" || hasRequiredSlot(plan, "TENT");
}

function hasRequiredSlot(plan: PackRequirementPlan, slot: RequirementSlot) {
  return plan.required_slots.some((slotPlan) => slotPlan.slot === slot);
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
  checkedChecklistOnlyIds: readonly string[] = []
) {
  return buildPlanChecklist({
    plan,
    checkedSlots,
    checkedChecklistOnlyIds
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
