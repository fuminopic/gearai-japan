import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

const planChecklistSource = readFileSync(
  new URL("../src/lib/plan-checklist.ts", import.meta.url),
  "utf8"
);
const checklistOwnedGearMatchersSource = readFileSync(
  new URL("../src/lib/checklist-owned-gear-matchers.ts", import.meta.url),
  "utf8"
);

const { outputText: checklistOwnedGearMatchersOutputText } = ts.transpileModule(
  checklistOwnedGearMatchersSource,
  {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022
    }
  }
);
const checklistOwnedGearMatchersDataUrl = `data:text/javascript;base64,${Buffer.from(
  checklistOwnedGearMatchersOutputText
).toString("base64")}`;

const { outputText } = ts.transpileModule(planChecklistSource, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022
  }
});
const planChecklistModule = await import(
  `data:text/javascript;base64,${Buffer.from(
    outputText.replace(
      'from "@/lib/checklist-owned-gear-matchers"',
      `from "${checklistOwnedGearMatchersDataUrl}"`
    )
  ).toString("base64")}`
);
const {
  buildPlanChecklist,
  buildPlanDecisionChips,
  buildPlanNotNeededItems
} = planChecklistModule;

const baseMountain = {
  slug: "sample-yama",
  name_ja: "サンプル山",
  region: "KANTO",
  primary_region: "KANTO",
  mountain_range: "サンプル山地",
  prefectures: ["東京都"],
  elevation_m: 1000,
  is_hyakumeizan: false,
  supported_seasons: ["SPRING", "SUMMER", "AUTUMN", "WINTER"],
  supported_styles: ["DAY_HIKE", "OVERNIGHT_HUT", "OVERNIGHT_TENT", "MULTI_DAY_TREK"],
  trip_profile: "BACKCOUNTRY_DAY_HIKE",
  typical_required_systems: [
    "WATER_SYSTEM",
    "RAIN_SYSTEM",
    "NAVIGATION_SYSTEM",
    "EMERGENCY_SYSTEM"
  ],
  route_seriousness: "MODERATE",
  technical_terrain: "MAINTAINED_TRAIL",
  helmet_guidance: "NOT_NEEDED",
  water_availability: "TREATED_RELIABLE",
  hut_support: "NONE",
  tent_site_availability: "NONE",
  alpine_environment: "LOWLAND_FOREST",
  snow_or_ice_risk: "LOW",
  route_duration_band: "FULL_DAY",
  escape_options: "MODERATE",
  cell_signal_reliability: "PARTIAL",
  bear_or_wildlife_risk: "LOW",
  volcanic_risk: "NONE",
  season_opening_window: "YEAR_ROUND",
  active_volcano_status: "NONE",
  jma_volcano_name: null,
  jma_alert_url: null,
  jma_constant_monitoring: null,
  restriction_status_note: null,
  snow_free_month_guide: null,
  mandatory_gear_note: null,
  supplementary_notes: null
};

function makePlan({
  mountain = {},
  season = "SUMMER",
  style = "DAY_HIKE",
  requiredSlots = []
} = {}) {
  const slotPlans = requiredSlots.map((slot) => ({
    slot,
    coverage_status: "MISSING",
    matching_owned_gear: []
  }));

  return {
    mountain: {
      ...baseMountain,
      ...mountain
    },
    season,
    style,
    required_systems: [],
    required_slots: slotPlans,
    covered_slots: [],
    missing_slots: slotPlans
  };
}

function checklistItems(checklist) {
  return checklist.categories.flatMap((category) => category.items);
}

function itemByLabel(checklist, label) {
  return checklistItems(checklist).find((item) => item.label === label);
}

function makeOwnedGear({
  id,
  name,
  brand = null,
  model = null,
  categoryName,
  categoryLabel = categoryName,
  subcategoryName,
  subcategoryLabel = subcategoryName,
  product = null
}) {
  return {
    id,
    name,
    brand,
    model,
    category_id: `${categoryName}-category-id`,
    subcategory_id: subcategoryName ? `${subcategoryName}-subcategory-id` : null,
    gear_categories: {
      id: `${categoryName}-category-id`,
      name_en: categoryName,
      name_ja: categoryLabel
    },
    gear_subcategories: subcategoryName
      ? {
          id: `${subcategoryName}-subcategory-id`,
          name_en: subcategoryName,
          name_ja: subcategoryLabel
        }
      : null,
    gear_products: product
  };
}

test("owned backpack category marks the action backpack checklist item as ready", () => {
  const checklist = buildPlanChecklist({
    plan: makePlan(),
    ownedGear: [
      makeOwnedGear({
        id: "owned-backpack",
        name: "サム 45",
        brand: "THE NORTH FACE",
        model: "サム 45",
        categoryName: "backpack",
        categoryLabel: "バックパック（Backpack）",
        subcategoryName: "backpack",
        subcategoryLabel: "バックパック"
      })
    ]
  });
  const backpack = itemByLabel(checklist, "ザック");

  assert.equal(backpack?.source, "GEAR_BACKED");
  assert.equal(backpack?.checked, true);
  assert.deepEqual(
    backpack?.matchingOwnedGear.map((item) => item.id),
    ["owned-backpack"]
  );
});

test("legacy carry backpack category also marks the action backpack checklist item as ready", () => {
  const checklist = buildPlanChecklist({
    plan: makePlan(),
    ownedGear: [
      makeOwnedGear({
        id: "legacy-carry-backpack",
        name: "Legacy Pack",
        categoryName: "carry",
        categoryLabel: "Carry",
        subcategoryName: "backpack",
        subcategoryLabel: "Backpack"
      })
    ]
  });
  const backpack = itemByLabel(checklist, "ザック");

  assert.equal(backpack?.source, "GEAR_BACKED");
  assert.equal(backpack?.checked, true);
  assert.deepEqual(
    backpack?.matchingOwnedGear.map((item) => item.id),
    ["legacy-carry-backpack"]
  );
});

test("owned trekking pole category marks the trekking poles checklist item as ready", () => {
  const checklist = buildPlanChecklist({
    plan: makePlan(),
    ownedGear: [
      makeOwnedGear({
        id: "owned-trekking-poles",
        name: "アルパイン カーボンポール",
        brand: "mont-bell",
        model: "アルパイン カーボンポール",
        categoryName: "other",
        categoryLabel: "その他（Other）",
        subcategoryName: "trekking_pole",
        subcategoryLabel: "トレッキングポール"
      })
    ]
  });
  const trekkingPoles = itemByLabel(checklist, "トレッキングポール");

  assert.equal(trekkingPoles?.source, "GEAR_BACKED");
  assert.equal(trekkingPoles?.checked, true);
  assert.deepEqual(
    trekkingPoles?.matchingOwnedGear.map((item) => item.id),
    ["owned-trekking-poles"]
  );
});

test("unrelated pack and pole text does not mark backpack or trekking poles as owned", () => {
  const checklist = buildPlanChecklist({
    plan: makePlan(),
    ownedGear: [
      makeOwnedGear({
        id: "battery-pack",
        name: "Battery Pack",
        categoryName: "electronics",
        categoryLabel: "電子機器（Electronics）",
        subcategoryName: "power_bank",
        subcategoryLabel: "モバイルバッテリー"
      }),
      makeOwnedGear({
        id: "tent-pole",
        name: "テントポールセット",
        categoryName: "shelter",
        categoryLabel: "テント・シェルター（Tent / Shelter）",
        subcategoryName: "tent",
        subcategoryLabel: "テント"
      })
    ]
  });

  assert.equal(itemByLabel(checklist, "ザック")?.source, "CHECKLIST_ONLY");
  assert.equal(itemByLabel(checklist, "ザック")?.checked, false);
  assert.equal(itemByLabel(checklist, "トレッキングポール")?.source, "CHECKLIST_ONLY");
  assert.equal(itemByLabel(checklist, "トレッキングポール")?.checked, false);
});

test("groundsheet checklist matcher still marks owned groundsheets as ready", () => {
  const checklist = buildPlanChecklist({
    plan: makePlan({
      style: "OVERNIGHT_TENT",
      requiredSlots: ["TENT", "SLEEP_INSULATION", "SLEEP_PAD"]
    }),
    ownedGear: [
      makeOwnedGear({
        id: "owned-groundsheet",
        name: "ステラリッジ グラウンドシート",
        categoryName: "shelter",
        categoryLabel: "テント・シェルター（Tent / Shelter）",
        subcategoryName: "groundsheet",
        subcategoryLabel: "グラウンドシート"
      })
    ]
  });
  const groundsheet = itemByLabel(checklist, "グランドシート");

  assert.equal(groundsheet?.source, "GEAR_BACKED");
  assert.equal(groundsheet?.checked, true);
  assert.deepEqual(
    groundsheet?.matchingOwnedGear.map((item) => item.id),
    ["owned-groundsheet"]
  );
});

test("owned whistle category and names mark the whistle checklist item as ready", () => {
  const checklist = buildPlanChecklist({
    plan: makePlan(),
    ownedGear: [
      makeOwnedGear({
        id: "owned-whistle-category",
        name: "Emergency whistle",
        categoryName: "first_aid",
        categoryLabel: "ファーストエイド",
        subcategoryName: "whistle",
        subcategoryLabel: "ホイッスル"
      }),
      makeOwnedGear({
        id: "owned-whistle-name",
        name: "山用の笛",
        categoryName: "other",
        categoryLabel: "その他（Other）",
        subcategoryName: "other",
        subcategoryLabel: "その他"
      })
    ]
  });
  const whistle = itemByLabel(checklist, "ホイッスル");

  assert.equal(whistle?.source, "GEAR_BACKED");
  assert.equal(whistle?.checked, true);
  assert.deepEqual(
    whistle?.matchingOwnedGear.map((item) => item.id),
    ["owned-whistle-category", "owned-whistle-name"]
  );
});

test("owned emergency sheet category marks the emergency sheet checklist item as ready", () => {
  const checklist = buildPlanChecklist({
    plan: makePlan(),
    ownedGear: [
      makeOwnedGear({
        id: "owned-emergency-sheet",
        name: "サバイバルシート",
        categoryName: "first_aid",
        categoryLabel: "ファーストエイド",
        subcategoryName: "emergency_sheet",
        subcategoryLabel: "エマージェンシーシート"
      })
    ]
  });
  const emergencySheet = itemByLabel(checklist, "エマージェンシーシート");

  assert.equal(emergencySheet?.source, "GEAR_BACKED");
  assert.equal(emergencySheet?.checked, true);
  assert.deepEqual(
    emergencySheet?.matchingOwnedGear.map((item) => item.id),
    ["owned-emergency-sheet"]
  );
});

test("owned bear bell and bear spray mark the bear protection checklist item as ready", () => {
  const checklist = buildPlanChecklist({
    plan: makePlan({
      mountain: {
        bear_or_wildlife_risk: "HIGH"
      }
    }),
    ownedGear: [
      makeOwnedGear({
        id: "owned-bear-bell",
        name: "熊鈴",
        categoryName: "bear_safety",
        categoryLabel: "熊対策",
        subcategoryName: "bear_bell",
        subcategoryLabel: "熊鈴"
      }),
      makeOwnedGear({
        id: "owned-bear-spray",
        name: "Bear spray",
        categoryName: "bear_safety",
        categoryLabel: "熊対策",
        subcategoryName: "bear_spray",
        subcategoryLabel: "熊スプレー"
      })
    ]
  });
  const bearProtection = itemByLabel(checklist, "熊対策装備");

  assert.equal(bearProtection?.source, "GEAR_BACKED");
  assert.equal(bearProtection?.checked, true);
  assert.deepEqual(
    bearProtection?.matchingOwnedGear.map((item) => item.id),
    ["owned-bear-bell", "owned-bear-spray"]
  );
});

test("owned portable toilet category marks the portable toilet checklist item as ready", () => {
  const checklist = buildPlanChecklist({
    plan: makePlan({
      mountain: {
        mandatory_gear_note: "携帯トイレ必携"
      }
    }),
    ownedGear: [
      makeOwnedGear({
        id: "owned-portable-toilet",
        name: "Portable toilet kit",
        categoryName: "first_aid",
        categoryLabel: "ファーストエイド",
        subcategoryName: "portable_toilet",
        subcategoryLabel: "携帯トイレ"
      })
    ]
  });
  const portableToilet = itemByLabel(checklist, "携帯トイレ");

  assert.equal(portableToilet?.source, "GEAR_BACKED");
  assert.equal(portableToilet?.checked, true);
  assert.deepEqual(
    portableToilet?.matchingOwnedGear.map((item) => item.id),
    ["owned-portable-toilet"]
  );
});

test("generic sheet, bell, spray, and toilet text does not match safety essentials", () => {
  const checklist = buildPlanChecklist({
    plan: makePlan({
      mountain: {
        bear_or_wildlife_risk: "HIGH",
        mandatory_gear_note: "携帯トイレ必携"
      }
    }),
    ownedGear: [
      makeOwnedGear({
        id: "generic-sheet",
        name: "Picnic sheet",
        categoryName: "other",
        subcategoryName: "other"
      }),
      makeOwnedGear({
        id: "generic-bell",
        name: "Bike bell",
        categoryName: "other",
        subcategoryName: "other"
      }),
      makeOwnedGear({
        id: "generic-spray",
        name: "Waterproof spray",
        categoryName: "other",
        subcategoryName: "other"
      }),
      makeOwnedGear({
        id: "generic-toilet",
        name: "Toilet pouch",
        categoryName: "other",
        subcategoryName: "other"
      })
    ]
  });

  assert.equal(itemByLabel(checklist, "エマージェンシーシート")?.source, "CHECKLIST_ONLY");
  assert.equal(itemByLabel(checklist, "エマージェンシーシート")?.checked, false);
  assert.equal(itemByLabel(checklist, "熊対策装備")?.source, "CHECKLIST_ONLY");
  assert.equal(itemByLabel(checklist, "熊対策装備")?.checked, false);
  assert.equal(itemByLabel(checklist, "携帯トイレ")?.source, "CHECKLIST_ONLY");
  assert.equal(itemByLabel(checklist, "携帯トイレ")?.checked, false);
});

test("owned hat category and names mark the hat checklist item as ready", () => {
  const checklist = buildPlanChecklist({
    plan: makePlan(),
    ownedGear: [
      makeOwnedGear({
        id: "owned-hat-category",
        name: "Trail Cap",
        categoryName: "clothing",
        categoryLabel: "ウェア",
        subcategoryName: "hat",
        subcategoryLabel: "帽子"
      }),
      makeOwnedGear({
        id: "owned-hat-name",
        name: "メリノ ニット帽",
        categoryName: "other",
        subcategoryName: "other"
      })
    ]
  });
  const hat = itemByLabel(checklist, "帽子");

  assert.equal(hat?.source, "GEAR_BACKED");
  assert.equal(hat?.checked, true);
  assert.deepEqual(
    hat?.matchingOwnedGear.map((item) => item.id),
    ["owned-hat-category", "owned-hat-name"]
  );
});

test("owned gloves category and names mark the gloves checklist item as ready", () => {
  const checklist = buildPlanChecklist({
    plan: makePlan(),
    ownedGear: [
      makeOwnedGear({
        id: "owned-gloves-category",
        name: "Winter Gloves",
        categoryName: "clothing",
        categoryLabel: "ウェア",
        subcategoryName: "gloves",
        subcategoryLabel: "手袋"
      }),
      makeOwnedGear({
        id: "owned-gloves-name",
        name: "防寒グローブ",
        categoryName: "other",
        subcategoryName: "other"
      })
    ]
  });
  const gloves = itemByLabel(checklist, "手袋");

  assert.equal(gloves?.source, "GEAR_BACKED");
  assert.equal(gloves?.checked, true);
  assert.deepEqual(
    gloves?.matchingOwnedGear.map((item) => item.id),
    ["owned-gloves-category", "owned-gloves-name"]
  );
});

test("owned gaiters category and names mark the gaiters checklist item as ready", () => {
  const checklist = buildPlanChecklist({
    plan: makePlan(),
    ownedGear: [
      makeOwnedGear({
        id: "owned-gaiters-category",
        name: "Trail Gaiters",
        categoryName: "clothing",
        categoryLabel: "ウェア",
        subcategoryName: "gaiters",
        subcategoryLabel: "ゲイター"
      }),
      makeOwnedGear({
        id: "owned-gaiters-name",
        name: "泥よけスパッツ",
        categoryName: "other",
        subcategoryName: "other"
      })
    ]
  });
  const gaiters = itemByLabel(checklist, "ゲイター");

  assert.equal(gaiters?.source, "GEAR_BACKED");
  assert.equal(gaiters?.checked, true);
  assert.deepEqual(
    gaiters?.matchingOwnedGear.map((item) => item.id),
    ["owned-gaiters-category", "owned-gaiters-name"]
  );
});

test("owned sunglasses category and names mark the sunglasses checklist item as ready", () => {
  const checklist = buildPlanChecklist({
    plan: makePlan(),
    ownedGear: [
      makeOwnedGear({
        id: "owned-sunglasses-category",
        name: "Mountain Sunglasses",
        categoryName: "clothing",
        categoryLabel: "ウェア",
        subcategoryName: "sunglasses",
        subcategoryLabel: "サングラス"
      }),
      makeOwnedGear({
        id: "owned-sunglasses-name",
        name: "偏光サングラス",
        categoryName: "other",
        subcategoryName: "other"
      })
    ]
  });
  const sunglasses = itemByLabel(checklist, "サングラス");

  assert.equal(sunglasses?.source, "GEAR_BACKED");
  assert.equal(sunglasses?.checked, true);
  assert.deepEqual(
    sunglasses?.matchingOwnedGear.map((item) => item.id),
    ["owned-sunglasses-category", "owned-sunglasses-name"]
  );
});

test("owned map or compass category and names mark backup navigation as ready", () => {
  const checklist = buildPlanChecklist({
    plan: makePlan(),
    ownedGear: [
      makeOwnedGear({
        id: "owned-map-category",
        name: "紙地図",
        categoryName: "navigation",
        categoryLabel: "ナビゲーション",
        subcategoryName: "map",
        subcategoryLabel: "地図"
      }),
      makeOwnedGear({
        id: "owned-compass-name",
        name: "シルバ コンパス",
        categoryName: "other",
        subcategoryName: "other"
      })
    ]
  });
  const mapCompass = itemByLabel(checklist, "紙地図・コンパス");

  assert.equal(mapCompass?.source, "GEAR_BACKED");
  assert.equal(mapCompass?.checked, true);
  assert.deepEqual(
    mapCompass?.matchingOwnedGear.map((item) => item.id),
    ["owned-map-category", "owned-compass-name"]
  );
});

test("owned crampons and ice axe categories mark alpine winter checklist items as ready", () => {
  const checklist = buildPlanChecklist({
    plan: makePlan({
      season: "WINTER",
      mountain: {
        elevation_m: 2500,
        route_seriousness: "HIGH",
        technical_terrain: "STEEP_ROCKY",
        alpine_environment: "HIGH_ALPINE_EXPOSED",
        snow_or_ice_risk: "WINTER_ALPINE"
      },
      requiredSlots: ["TRACTION_DEVICE"]
    }),
    ownedGear: [
      makeOwnedGear({
        id: "owned-crampons-category",
        name: "12本爪アイゼン",
        categoryName: "snow",
        categoryLabel: "雪山",
        subcategoryName: "crampons",
        subcategoryLabel: "アイゼン"
      }),
      makeOwnedGear({
        id: "owned-ice-axe-category",
        name: "Alpine Ice Axe",
        categoryName: "climbing",
        categoryLabel: "クライミング",
        subcategoryName: "ice_axe",
        subcategoryLabel: "ピッケル"
      }),
      makeOwnedGear({
        id: "owned-crampons-name",
        name: "10本爪 crampons",
        categoryName: "other",
        subcategoryName: "other"
      }),
      makeOwnedGear({
        id: "owned-ice-axe-name",
        name: "ピッケル",
        categoryName: "other",
        subcategoryName: "other"
      })
    ]
  });
  const crampons = itemByLabel(checklist, "アイゼン");
  const iceAxe = itemByLabel(checklist, "ピッケル");

  assert.equal(crampons?.source, "GEAR_BACKED");
  assert.equal(crampons?.checked, true);
  assert.deepEqual(
    crampons?.matchingOwnedGear.map((item) => item.id),
    ["owned-crampons-category", "owned-crampons-name"]
  );
  assert.equal(iceAxe?.source, "GEAR_BACKED");
  assert.equal(iceAxe?.checked, true);
  assert.deepEqual(
    iceAxe?.matchingOwnedGear.map((item) => item.id),
    ["owned-ice-axe-category", "owned-ice-axe-name"]
  );
});

test("owned river shoes category marks the river crossing checklist item as ready", () => {
  const checklist = buildPlanChecklist({
    plan: makePlan({
      mountain: {
        mandatory_gear_note: "渡渉用シューズ必携"
      }
    }),
    ownedGear: [
      makeOwnedGear({
        id: "owned-water-shoes-category",
        name: "沢靴",
        categoryName: "footwear",
        categoryLabel: "フットウェア",
        subcategoryName: "water_shoes",
        subcategoryLabel: "渡渉用シューズ"
      }),
      makeOwnedGear({
        id: "owned-water-shoes-name",
        name: "ウォーターシューズ",
        categoryName: "other",
        subcategoryName: "other"
      })
    ]
  });
  const riverShoes = itemByLabel(checklist, "渡渉用シューズ（沢靴・替え靴）");

  assert.equal(riverShoes?.source, "GEAR_BACKED");
  assert.equal(riverShoes?.checked, true);
  assert.deepEqual(
    riverShoes?.matchingOwnedGear.map((item) => item.id),
    ["owned-water-shoes-category", "owned-water-shoes-name"]
  );
});

test("owned pegs category and names mark the pegs checklist item as ready", () => {
  const checklist = buildPlanChecklist({
    plan: makePlan({
      style: "OVERNIGHT_TENT",
      requiredSlots: ["TENT", "SLEEP_INSULATION", "SLEEP_PAD"]
    }),
    ownedGear: [
      makeOwnedGear({
        id: "owned-pegs-category",
        name: "アルミペグ",
        categoryName: "shelter",
        categoryLabel: "テント・シェルター",
        subcategoryName: "pegs",
        subcategoryLabel: "ペグ"
      }),
      makeOwnedGear({
        id: "owned-pegs-name",
        name: "Tent stakes",
        categoryName: "other",
        subcategoryName: "other"
      })
    ]
  });
  const pegs = itemByLabel(checklist, "ペグ");

  assert.equal(pegs?.source, "GEAR_BACKED");
  assert.equal(pegs?.checked, true);
  assert.deepEqual(
    pegs?.matchingOwnedGear.map((item) => item.id),
    ["owned-pegs-category", "owned-pegs-name"]
  );
});

test("owned inner sheet category and explicit liner names mark the inner sheet item as ready", () => {
  const checklist = buildPlanChecklist({
    plan: makePlan({
      style: "OVERNIGHT_HUT",
      mountain: {
        hut_support: "FULL_SERVICE"
      }
    }),
    ownedGear: [
      makeOwnedGear({
        id: "owned-inner-sheet-category",
        name: "インナーシーツ",
        categoryName: "sleep",
        categoryLabel: "寝具",
        subcategoryName: "inner_sheet",
        subcategoryLabel: "インナーシーツ"
      }),
      makeOwnedGear({
        id: "owned-inner-sheet-name",
        name: "Sleeping bag liner",
        categoryName: "other",
        subcategoryName: "other"
      })
    ]
  });
  const innerSheet = itemByLabel(checklist, "インナーシーツ");

  assert.equal(innerSheet?.source, "GEAR_BACKED");
  assert.equal(innerSheet?.checked, true);
  assert.deepEqual(
    innerSheet?.matchingOwnedGear.map((item) => item.id),
    ["owned-inner-sheet-category", "owned-inner-sheet-name"]
  );
});

test("new checklist matchers do not match unrelated equipment", () => {
  const checklist = buildPlanChecklist({
    plan: makePlan({
      season: "WINTER",
      style: "OVERNIGHT_TENT",
      mountain: {
        elevation_m: 2500,
        route_seriousness: "HIGH",
        technical_terrain: "STEEP_ROCKY",
        alpine_environment: "HIGH_ALPINE_EXPOSED",
        snow_or_ice_risk: "WINTER_ALPINE",
        mandatory_gear_note: "渡渉用シューズ必携"
      },
      requiredSlots: ["TENT", "SLEEP_INSULATION", "SLEEP_PAD", "TRACTION_DEVICE"]
    }),
    ownedGear: [
      makeOwnedGear({
        id: "map-app",
        name: "登山地図アプリ YAMAP",
        categoryName: "electronics",
        subcategoryName: "map"
      }),
      makeOwnedGear({
        id: "chain-spikes",
        name: "チェーンスパイク",
        categoryName: "other",
        subcategoryName: "traction_device"
      }),
      makeOwnedGear({
        id: "hiking-shoes",
        name: "Hiking shoes",
        categoryName: "shoes",
        subcategoryName: "hiking_shoes"
      }),
      makeOwnedGear({
        id: "generic-peg",
        name: "PEG adapter",
        categoryName: "electronics",
        subcategoryName: "other"
      }),
      makeOwnedGear({
        id: "generic-liner",
        name: "Pack liner",
        categoryName: "other",
        subcategoryName: "other"
      })
    ]
  });

  assert.equal(itemByLabel(checklist, "紙地図・コンパス")?.source, "CHECKLIST_ONLY");
  assert.equal(itemByLabel(checklist, "アイゼン")?.source, "CHECKLIST_ONLY");
  assert.equal(
    itemByLabel(checklist, "渡渉用シューズ（沢靴・替え靴）")?.source,
    "CHECKLIST_ONLY"
  );
  assert.equal(itemByLabel(checklist, "ペグ")?.source, "CHECKLIST_ONLY");
});

test("generic liner text does not mark hut inner sheets as owned", () => {
  const checklist = buildPlanChecklist({
    plan: makePlan({
      style: "OVERNIGHT_HUT",
      mountain: {
        hut_support: "FULL_SERVICE"
      }
    }),
    ownedGear: [
      makeOwnedGear({
        id: "generic-liner",
        name: "Pack liner",
        categoryName: "other",
        subcategoryName: "other"
      })
    ]
  });

  assert.equal(itemByLabel(checklist, "インナーシーツ")?.source, "CHECKLIST_ONLY");
  assert.equal(itemByLabel(checklist, "インナーシーツ")?.checked, false);
});

test("fixed checklist items are covered by slots, owned matchers, or manual-only lists", () => {
  const manualOnlyItemIds = new Set([
    "food-trail-snacks",
    "food-meals",
    "safety-insurance-card",
    "nav-map-app",
    "clothing-mid-layer",
    "nav-spare-battery",
    "overnight-toiletries",
    "overnight-earplugs"
  ]);
  const explicitlyDeferredItemIds = new Set([]);
  const checklistScenarios = [
    makePlan({
      requiredSlots: [
        "WATER_STORAGE",
        "WATER_TREATMENT",
        "RAIN_JACKET",
        "RAIN_PANTS",
        "INSULATION_LAYER",
        "BASE_LAYER",
        "FIRST_AID_KIT",
        "HEADLAMP",
        "POWER_BANK",
        "STOVE",
        "COOK_POT",
        "FUEL"
      ]
    }),
    makePlan({
      season: "WINTER",
      mountain: {
        elevation_m: 2500,
        route_seriousness: "HIGH",
        technical_terrain: "STEEP_ROCKY",
        alpine_environment: "HIGH_ALPINE_EXPOSED",
        snow_or_ice_risk: "WINTER_ALPINE",
        helmet_guidance: "REQUIRED",
        bear_or_wildlife_risk: "HIGH",
        mandatory_gear_note: "渡渉用シューズと携帯トイレ必携"
      },
      requiredSlots: ["HELMET", "TRACTION_DEVICE"]
    }),
    makePlan({
      style: "OVERNIGHT_TENT",
      requiredSlots: ["TENT", "SLEEP_INSULATION", "SLEEP_PAD"]
    }),
    makePlan({
      style: "OVERNIGHT_HUT",
      mountain: {
        hut_support: "FULL_SERVICE"
      }
    })
  ];
  const coverageByItemId = new Map();

  for (const plan of checklistScenarios) {
    for (const item of checklistItems(buildPlanChecklist({ plan }))) {
      const current = coverageByItemId.get(item.id) ?? {
        label: item.label,
        covered: false
      };

      coverageByItemId.set(item.id, {
        label: item.label,
        covered: current.covered || item.slots.length > 0 || Boolean(item.ownedGearMatcher)
      });
    }
  }

  const uncoveredItems = [...coverageByItemId]
    .filter(([id, item]) => {
      return (
        !item.covered &&
        !manualOnlyItemIds.has(id) &&
        !explicitlyDeferredItemIds.has(id)
      );
    })
    .map(([id, item]) => `${id}:${item.label}`);

  assert.deepEqual([...new Set(uncoveredItems)].sort(), []);
});

test("low mountain winter trips show optional chain spikes without crampons or ice axe", () => {
  const checklist = buildPlanChecklist({
    plan: makePlan({
      season: "WINTER",
      mountain: {
        slug: "takao-san",
        name_ja: "高尾山",
        elevation_m: 599,
        route_seriousness: "LOW",
        technical_terrain: "MAINTAINED_TRAIL",
        alpine_environment: "LOWLAND_FOREST",
        snow_or_ice_risk: "LOW",
        route_duration_band: "HALF_DAY",
        escape_options: "EASY",
        cell_signal_reliability: "RELIABLE"
      },
      requiredSlots: [
        "WATER_STORAGE",
        "RAIN_JACKET",
        "RAIN_PANTS",
        "INSULATION_LAYER",
        "BASE_LAYER",
        "FIRST_AID_KIT",
        "HEADLAMP"
      ]
    })
  });

  assert.equal(itemByLabel(checklist, "チェーンスパイク")?.priority, "OPTIONAL");
  assert.equal(itemByLabel(checklist, "アイゼン"), undefined);
  assert.equal(itemByLabel(checklist, "ピッケル"), undefined);
});

test("alpine winter contexts still keep crampons and ice axe visible", () => {
  const checklist = buildPlanChecklist({
    plan: makePlan({
      season: "WINTER",
      mountain: {
        elevation_m: 2500,
        route_seriousness: "HIGH",
        technical_terrain: "STEEP_ROCKY",
        alpine_environment: "HIGH_ALPINE_EXPOSED",
        snow_or_ice_risk: "WINTER_ALPINE"
      },
      requiredSlots: ["TRACTION_DEVICE"]
    })
  });

  assert.equal(itemByLabel(checklist, "チェーンスパイク")?.priority, "ESSENTIAL");
  assert.equal(itemByLabel(checklist, "アイゼン")?.priority, "ESSENTIAL");
  assert.equal(itemByLabel(checklist, "ピッケル")?.priority, "SUGGESTED");
});

test("long remote day hikes promote forced-bivouac emergency items", () => {
  const checklist = buildPlanChecklist({
    plan: makePlan({
      season: "AUTUMN",
      mountain: {
        slug: "sukai-san",
        name_ja: "皇海山",
        route_seriousness: "HIGH",
        route_duration_band: "LONG_DAY",
        escape_options: "REMOTE",
        cell_signal_reliability: "POOR"
      },
      requiredSlots: ["FIRST_AID_KIT", "HEADLAMP", "POWER_BANK"]
    })
  });

  assert.equal(itemByLabel(checklist, "ヘッドランプ予備電池")?.priority, "ESSENTIAL");
  assert.equal(itemByLabel(checklist, "エマージェンシーシート")?.priority, "ESSENTIAL");
  assert.match(itemByLabel(checklist, "ヘッドランプ")?.reason ?? "", /長時間行動/);
  assert.match(
    itemByLabel(checklist, "エマージェンシーシート")?.reason ?? "",
    /停滞/
  );
});

test("river-crossing and portable-toilet notes create special checklist items", () => {
  const checklist = buildPlanChecklist({
    plan: makePlan({
      season: "SUMMER",
      style: "OVERNIGHT_HUT",
      mountain: {
        slug: "poroshiri-dake",
        name_ja: "幌尻岳",
        mandatory_gear_note: "額平川の渡渉装備（沢靴/替え靴）・携帯トイレ必携",
        supplementary_notes: "渡渉が核心。増水時は中止判断が必要。"
      },
      requiredSlots: ["SLEEP_INSULATION"]
    })
  });

  assert.equal(
    itemByLabel(checklist, "渡渉用シューズ（沢靴・替え靴）")?.priority,
    "ESSENTIAL"
  );
  assert.equal(itemByLabel(checklist, "携帯トイレ")?.priority, "ESSENTIAL");
});

test("hut stays without bedding ask for a sleeping bag instead of an inner sheet", () => {
  const checklist = buildPlanChecklist({
    plan: makePlan({
      season: "SUMMER",
      style: "OVERNIGHT_HUT",
      mountain: {
        hut_support: "BASIC_NO_BEDDING"
      },
      requiredSlots: ["SLEEP_INSULATION", "SLEEP_PAD"]
    })
  });

  assert.equal(itemByLabel(checklist, "シュラフ（寝袋）")?.priority, "ESSENTIAL");
  assert.equal(itemByLabel(checklist, "スリーピングマット")?.priority, "ESSENTIAL");
  assert.equal(itemByLabel(checklist, "インナーシーツ"), undefined);
});

test("full-service hut stays keep the inner sheet checklist item", () => {
  const checklist = buildPlanChecklist({
    plan: makePlan({
      season: "SUMMER",
      style: "OVERNIGHT_HUT",
      mountain: {
        hut_support: "FULL_SERVICE"
      }
    })
  });

  assert.equal(itemByLabel(checklist, "インナーシーツ")?.priority, "ESSENTIAL");
  assert.equal(itemByLabel(checklist, "シュラフ（寝袋）"), undefined);
  assert.equal(itemByLabel(checklist, "スリーピングマット"), undefined);
});

test("checklist exposes user-facing reasons and M0.8 trust hints", () => {
  const lowRiskDayPlan = makePlan({
    season: "SUMMER",
    style: "DAY_HIKE",
    mountain: {
      route_seriousness: "LOW",
      technical_terrain: "MAINTAINED_TRAIL",
      helmet_guidance: "NOT_NEEDED",
      water_availability: "TREATED_RELIABLE",
      alpine_environment: "LOWLAND_FOREST",
      snow_or_ice_risk: "LOW",
      route_duration_band: "HALF_DAY",
      escape_options: "EASY",
      cell_signal_reliability: "RELIABLE"
    },
    requiredSlots: ["RAIN_JACKET", "RAIN_PANTS", "INSULATION_LAYER"]
  });
  const lowRiskChecklist = buildPlanChecklist({ plan: lowRiskDayPlan });

  assert.match(itemByLabel(lowRiskChecklist, "レインウェア")?.reason ?? "", /天候/);
  assert.deepEqual(
    buildPlanNotNeededItems(lowRiskDayPlan).map((item) => item.label),
    ["テント", "シュラフ", "キャンプ装備", "ヘルメット"]
  );

  const alpinePlan = makePlan({
    season: "AUTUMN",
    mountain: {
      route_seriousness: "HIGH",
      technical_terrain: "CHAIN_LADDER",
      helmet_guidance: "RECOMMENDED",
      water_availability: "LIMITED_OR_SEASONAL",
      alpine_environment: "HIGH_ALPINE_EXPOSED",
      snow_or_ice_risk: "SEASONAL_PATCHES",
      route_duration_band: "LONG_DAY",
      cell_signal_reliability: "POOR"
    },
    requiredSlots: ["HELMET", "TRACTION_DEVICE", "POWER_BANK"]
  });

  assert.deepEqual(
    buildPlanDecisionChips(alpinePlan).map((chip) => chip.label),
    [
      "高所稜線",
      "残雪・凍結",
      "鎖場・岩稜",
      "水場限定",
      "電波不安定",
      "長時間行動"
    ]
  );
});

test("reviewed static mountain fixes flow through the checklist without stale risk gear", () => {
  const rishiriChecklist = buildPlanChecklist({
    plan: makePlan({
      mountain: {
        slug: "rishiri-zan",
        name_ja: "利尻山",
        route_seriousness: "HIGH",
        technical_terrain: "STEEP_ROCKY",
        helmet_guidance: "NOT_NEEDED",
        alpine_environment: "ABOVE_TREELINE",
        bear_or_wildlife_risk: "LOW"
      }
    })
  });

  assert.equal(itemByLabel(rishiriChecklist, "熊対策装備"), undefined);

  for (const mountain of [
    {
      slug: "utsukushigahara",
      name_ja: "美ヶ原",
      route_seriousness: "LOW"
    },
    {
      slug: "kirigamine",
      name_ja: "霧ヶ峰",
      route_seriousness: "LOW"
    },
    {
      slug: "daibosatsu-rei",
      name_ja: "大菩薩嶺",
      route_seriousness: "MODERATE"
    },
    {
      slug: "tsurugi-san-shikoku",
      name_ja: "剣山",
      route_seriousness: "MODERATE"
    }
  ]) {
    const checklist = buildPlanChecklist({
      plan: makePlan({
        mountain: {
          ...mountain,
          technical_terrain: "MAINTAINED_TRAIL",
          helmet_guidance: "NOT_NEEDED",
          snow_or_ice_risk: "LOW"
        }
      })
    });

    assert.equal(itemByLabel(checklist, "ヘルメット"), undefined);
    assert.equal(itemByLabel(checklist, "チェーンスパイク"), undefined);
    assert.equal(itemByLabel(checklist, "アイゼン"), undefined);
    assert.equal(itemByLabel(checklist, "ピッケル"), undefined);
  }
});
