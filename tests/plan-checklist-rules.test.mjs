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

test("hokkaido high bear risk highlights brown bear spray and food management", () => {
  const checklist = buildPlanChecklist({
    plan: makePlan({
      mountain: {
        primary_region: "HOKKAIDO",
        prefectures: ["北海道"],
        bear_or_wildlife_risk: "HIGH"
      }
    }),
    ownedGear: []
  });
  const bearProtection = itemByLabel(checklist, "熊対策装備");

  assert.equal(bearProtection?.priority, "ESSENTIAL");
  assert.match(bearProtection?.reason ?? "", /ヒグマ/);
  assert.match(bearProtection?.reason ?? "", /熊スプレー/);
  assert.match(bearProtection?.reason ?? "", /食料管理/);
  assert.match(bearProtection?.reason ?? "", /出没情報確認/);
});

test("hokkaido moderate bear risk keeps suggested priority with brown bear guidance", () => {
  const checklist = buildPlanChecklist({
    plan: makePlan({
      mountain: {
        region: "HOKKAIDO",
        prefectures: ["北海道"],
        bear_or_wildlife_risk: "MODERATE"
      }
    }),
    ownedGear: []
  });
  const bearProtection = itemByLabel(checklist, "熊対策装備");

  assert.equal(bearProtection?.priority, "SUGGESTED");
  assert.match(bearProtection?.reason ?? "", /ヒグマ/);
  assert.match(bearProtection?.reason ?? "", /熊スプレー/);
  assert.match(bearProtection?.reason ?? "", /食料管理/);
});

test("honshu high bear risk highlights bear bell and active caution", () => {
  const checklist = buildPlanChecklist({
    plan: makePlan({
      mountain: {
        primary_region: "CHUBU",
        region: "CHUBU",
        prefectures: ["長野県"],
        bear_or_wildlife_risk: "HIGH"
      }
    }),
    ownedGear: []
  });
  const bearProtection = itemByLabel(checklist, "熊対策装備");

  assert.equal(bearProtection?.priority, "ESSENTIAL");
  assert.match(bearProtection?.reason ?? "", /ツキノワグマ/);
  assert.match(bearProtection?.reason ?? "", /熊鈴/);
  assert.match(bearProtection?.reason ?? "", /出没情報確認/);
  assert.match(bearProtection?.reason ?? "", /行動中の注意/);
});

test("low bear risk does not add bear protection guidance", () => {
  const checklist = buildPlanChecklist({
    plan: makePlan({
      mountain: {
        primary_region: "HOKKAIDO",
        prefectures: ["北海道"],
        bear_or_wildlife_risk: "LOW"
      }
    }),
    ownedGear: []
  });

  assert.equal(itemByLabel(checklist, "熊対策装備"), undefined);
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
    "special-volcano-information",
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
      mountain: {
        volcanic_risk: "ACTIVE_MONITORED",
        active_volcano_status: "ACTIVE"
      }
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
  assert.match(
    itemByLabel(checklist, "チェーンスパイク")?.reason ?? "",
    /チェーンスパイク等の滑り止めを確認/
  );
  assert.match(
    itemByLabel(checklist, "チェーンスパイク")?.reason ?? "",
    /積雪・凍結状況により必要装備が変わります/
  );
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
  assert.match(
    itemByLabel(checklist, "チェーンスパイク")?.reason ?? "",
    /アイゼン等の要否は直前の山行記録・現地情報で確認/
  );
  assert.match(
    itemByLabel(checklist, "アイゼン")?.reason ?? "",
    /アイゼン等の要否は直前の山行記録・現地情報で確認/
  );
  assert.match(
    itemByLabel(checklist, "ピッケル")?.reason ?? "",
    /ピッケル等が必要な本格的な雪山は経験者判断が必要/
  );
});

test("active monitored volcanoes show official volcano information guidance", () => {
  const checklist = buildPlanChecklist({
    plan: makePlan({
      mountain: {
        volcanic_risk: "ACTIVE_MONITORED",
        active_volcano_status: "NONE"
      }
    })
  });
  const volcanoInfo = itemByLabel(checklist, "火山情報の確認");

  assert.equal(volcanoInfo?.priority, "ESSENTIAL");
  assert.match(volcanoInfo?.reason ?? "", /噴火警戒レベル/);
  assert.match(volcanoInfo?.reason ?? "", /入山規制/);
  assert.match(volcanoInfo?.reason ?? "", /気象庁/);
  assert.match(volcanoInfo?.reason ?? "", /自治体/);
  assert.match(volcanoInfo?.reason ?? "", /公式情報/);
});

test("active volcano status shows volcano information guidance even without monitored risk", () => {
  const checklist = buildPlanChecklist({
    plan: makePlan({
      mountain: {
        volcanic_risk: "NONE",
        active_volcano_status: "ACTIVE"
      }
    })
  });

  assert.equal(itemByLabel(checklist, "火山情報の確認")?.priority, "ESSENTIAL");
});

test("active restricted volcanoes do not add checklist guidance because planning is blocked", () => {
  const checklist = buildPlanChecklist({
    plan: makePlan({
      mountain: {
        volcanic_risk: "ACTIVE_RESTRICTED",
        active_volcano_status: "ACTIVE"
      }
    })
  });

  assert.equal(itemByLabel(checklist, "火山情報の確認"), undefined);
});

test("ordinary non-volcanic mountains do not show volcano information guidance", () => {
  const checklist = buildPlanChecklist({
    plan: makePlan({
      mountain: {
        volcanic_risk: "NONE",
        active_volcano_status: "NONE"
      }
    })
  });

  assert.equal(itemByLabel(checklist, "火山情報の確認"), undefined);
});

test("summer popular mountain note cleanup scenarios keep checklist signals stable", () => {
  const rausuChecklist = buildPlanChecklist({
    plan: makePlan({
      season: "SUMMER",
      style: "DAY_HIKE",
      mountain: {
        slug: "rausu-dake",
        name_ja: "羅臼岳",
        primary_region: "HOKKAIDO",
        region: "HOKKAIDO",
        prefectures: ["北海道"],
        bear_or_wildlife_risk: "HIGH",
        mandatory_gear_note: "ヒグマ対策と食料管理を徹底。",
        supplementary_notes: "知床国立公園。活火山。ヒグマ対策と公式情報を確認。",
        restriction_status_note: null
      }
    })
  });
  const rausuBearProtection = itemByLabel(rausuChecklist, "熊対策装備");

  assert.equal(rausuBearProtection?.priority, "ESSENTIAL");
  assert.match(rausuBearProtection?.reason ?? "", /ヒグマ/);
  assert.match(rausuBearProtection?.reason ?? "", /食料管理/);

  const asahidakeChecklist = buildPlanChecklist({
    plan: makePlan({
      season: "SUMMER",
      style: "DAY_HIKE",
      mountain: {
        slug: "daisetsuzan-asahi-dake",
        name_ja: "大雪山（旭岳）",
        primary_region: "HOKKAIDO",
        region: "HOKKAIDO",
        prefectures: ["北海道"],
        volcanic_risk: "ACTIVE_MONITORED",
        active_volcano_status: "ACTIVE",
        supplementary_notes:
          "旭岳ロープウェイ利用の夏山ルート。活火山・火山ガス・天候急変に注意。",
        restriction_status_note: null
      }
    })
  });

  assert.equal(itemByLabel(asahidakeChecklist, "火山情報の確認")?.priority, "ESSENTIAL");

  const tanigawaChecklist = buildPlanChecklist({
    plan: makePlan({
      season: "SUMMER",
      style: "DAY_HIKE",
      mountain: {
        slug: "tanigawa-dake",
        name_ja: "谷川岳",
        route_seriousness: "HIGH",
        technical_terrain: "STEEP_ROCKY",
        water_availability: "LIMITED_OR_SEASONAL",
        supplementary_notes: "ロープウェイ利用の天神尾根ルートあり。西黒尾根は岩場あり。",
        mandatory_gear_note: "気象急変・撤退判断を確認。"
      }
    })
  });

  assert.ok(itemByLabel(tanigawaChecklist, "飲み水"));
  assert.ok(itemByLabel(tanigawaChecklist, "レインウェア"));
  assert.equal(itemByLabel(tanigawaChecklist, "火山情報の確認"), undefined);

  const gassanChecklist = buildPlanChecklist({
    plan: makePlan({
      season: "SUMMER",
      style: "DAY_HIKE",
      mountain: {
        slug: "gassan",
        name_ja: "月山",
        primary_region: "TOHOKU",
        region: "TOHOKU",
        prefectures: ["山形県"],
        snow_or_ice_risk: "SEASONAL_PATCHES",
        bear_or_wildlife_risk: "MODERATE",
        supplementary_notes:
          "豪雪地帯。春は残雪・山スキー利用が多く、夏も残雪状況と登山道情報を確認。"
      }
    })
  });

  assert.ok(itemByLabel(gassanChecklist, "飲み水"));
  assert.equal(itemByLabel(gassanChecklist, "熊対策装備")?.priority, "SUGGESTED");
});

test("second summer popular mountain note cleanup scenarios keep checklist signals stable", () => {
  const yariChecklist = buildPlanChecklist({
    plan: makePlan({
      season: "SUMMER",
      style: "OVERNIGHT_HUT",
      mountain: {
        slug: "yarigatake",
        name_ja: "槍ヶ岳",
        route_seriousness: "EXTREME",
        technical_terrain: "EXPOSED_SCRAMBLE",
        supplementary_notes: "標準は小屋泊・テント泊。穂先は岩場・落石に注意。"
      }
    })
  });

  assert.equal(itemByLabel(yariChecklist, "ヘルメット")?.priority, "SUGGESTED");
  assert.match(itemByLabel(yariChecklist, "ヘルメット")?.reason ?? "", /岩稜|落石|ヘルメット/);

  const okuhotakaChecklist = buildPlanChecklist({
    plan: makePlan({
      season: "SUMMER",
      style: "OVERNIGHT_HUT",
      mountain: {
        slug: "okuhotakadake",
        name_ja: "奥穂高岳",
        route_seriousness: "EXTREME",
        technical_terrain: "EXPOSED_SCRAMBLE",
        supplementary_notes: "標準は小屋泊・テント泊。岩稜・落石に注意。"
      }
    })
  });

  assert.equal(itemByLabel(okuhotakaChecklist, "ヘルメット")?.priority, "SUGGESTED");
  assert.match(
    itemByLabel(okuhotakaChecklist, "ヘルメット")?.reason ?? "",
    /岩稜|落石|ヘルメット/
  );

  const akadakeChecklist = buildPlanChecklist({
    plan: makePlan({
      season: "SUMMER",
      style: "DAY_HIKE",
      requiredSlots: ["DRINKING_WATER"],
      mountain: {
        slug: "aka-dake",
        name_ja: "八ヶ岳（赤岳）",
        route_seriousness: "HIGH",
        technical_terrain: "STEEP_ROCKY",
        hut_support: "FULL_SERVICE",
        mandatory_gear_note: "岩場・鎖場あり。ヘルメット要否を確認。",
        supplementary_notes: "八ヶ岳主峰。山小屋・指定テント場を利用した縦走可。"
      }
    })
  });

  assert.ok(checklistItems(akadakeChecklist).length > 0);
  assert.ok(itemByLabel(akadakeChecklist, "飲み水"));
  assert.equal(itemByLabel(akadakeChecklist, "シュラフ"), undefined);

  const ishizuchiPlan = makePlan({
    season: "SUMMER",
    style: "DAY_HIKE",
    mountain: {
      slug: "ishizuchi-san",
      name_ja: "石鎚山",
      route_seriousness: "HIGH",
      technical_terrain: "CHAIN_LADDER",
      mandatory_gear_note: "鎖場（自信なければ迂回路）",
      supplementary_notes: "西日本最高峰。鎖場は迂回路あり。"
    }
  });
  const ishizuchiChecklist = buildPlanChecklist({ plan: ishizuchiPlan });

  assert.ok(buildPlanDecisionChips(ishizuchiPlan).some((chip) => chip.label === "鎖場・岩稜"));
  assert.equal(itemByLabel(ishizuchiChecklist, "ヘルメット")?.priority, "SUGGESTED");

  const kujuChecklist = buildPlanChecklist({
    plan: makePlan({
      season: "SUMMER",
      style: "DAY_HIKE",
      mountain: {
        slug: "kuju-san",
        name_ja: "九重山",
        volcanic_risk: "ACTIVE_MONITORED",
        active_volcano_status: "ACTIVE",
        supplementary_notes:
          "坊ガツルでテント泊・くじゅう連山縦走可。硫黄山周辺は火山ガスに注意。",
        restriction_status_note: null
      }
    })
  });

  assert.equal(itemByLabel(kujuChecklist, "火山情報の確認")?.priority, "ESSENTIAL");
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

test("okue-yama river-crossing notes create river shoes without portable toilet", () => {
  const checklist = buildPlanChecklist({
    plan: makePlan({
      season: "SUMMER",
      mountain: {
        slug: "okue-yama",
        name_ja: "大崩山",
        mandatory_gear_note: "岩場・渡渉・梯子区間に対応できる装備確認",
        supplementary_notes: "岩場・渡渉・梯子区間が続くため装備確認が必要。"
      }
    })
  });

  assert.equal(
    itemByLabel(checklist, "渡渉用シューズ（沢靴・替え靴）")?.priority,
    "ESSENTIAL"
  );
  assert.equal(itemByLabel(checklist, "携帯トイレ"), undefined);
});

test("rishiri-zan portable-toilet notes create portable toilet without river shoes", () => {
  const checklist = buildPlanChecklist({
    plan: makePlan({
      season: "SUMMER",
      mountain: {
        slug: "rishiri-zan",
        name_ja: "利尻山",
        mandatory_gear_note: "携帯トイレ必携（山中トイレ無）",
        supplementary_notes: "離島・長時間。公式情報を確認。"
      }
    })
  });

  assert.equal(itemByLabel(checklist, "携帯トイレ")?.priority, "ESSENTIAL");
  assert.equal(itemByLabel(checklist, "渡渉用シューズ（沢靴・替え靴）"), undefined);
});

test("mountain notes without explicit river-crossing or portable-toilet keywords do not create those items", () => {
  const cases = [
    {
      slug: "miyanoura-dake",
      name_ja: "宮之浦岳",
      mandatory_gear_note: "雨具必須（多雨）",
      supplementary_notes: "荒川登山口は時期によりマイカー規制（バス）。屋久島・非火山"
    },
    {
      slug: "tomuraushi-yama",
      name_ja: "トムラウシ山",
      mandatory_gear_note: "防寒・気象急変対策（長丁場）",
      supplementary_notes: "2009年遭難の地。短縮路でも長時間"
    },
    {
      slug: "iide-san",
      name_ja: "飯豊山",
      mandatory_gear_note: null,
      supplementary_notes: null
    },
    {
      slug: "sukai-san",
      name_ja: "皇海山",
      mandatory_gear_note: "（現状）長大ルート・読図・熊対策",
      supplementary_notes:
        "栗原川林道が恒久閉鎖。短絡路(不動沢)廃道。庚申山経由の長大ルートのみ。日帰り前提は危険"
    }
  ];

  for (const mountain of cases) {
    const checklist = buildPlanChecklist({
      plan: makePlan({
        season: "SUMMER",
        mountain
      })
    });

    assert.equal(
      itemByLabel(checklist, "渡渉用シューズ（沢靴・替え靴）"),
      undefined,
      `${mountain.name_ja} should not require river-crossing shoes`
    );
    assert.equal(
      itemByLabel(checklist, "携帯トイレ"),
      undefined,
      `${mountain.name_ja} should not require portable toilet`
    );
  }
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
  assert.doesNotMatch(
    itemByLabel(lowRiskChecklist, "飲み水")?.reason ?? "",
    /水場が涸れる可能性|水を多めに携行/
  );
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

  const unreliableWaterPlan = makePlan({
    season: "SUMMER",
    mountain: {
      water_availability: "UNRELIABLE"
    },
    requiredSlots: ["WATER_STORAGE", "WATER_TREATMENT"]
  });
  const unreliableWaterChecklist = buildPlanChecklist({ plan: unreliableWaterPlan });
  const unreliableWaterReason = itemByLabel(unreliableWaterChecklist, "飲み水")?.reason ?? "";

  assert.match(unreliableWaterReason, /水場が涸れる可能性/);
  assert.match(unreliableWaterReason, /水を多めに携行/);
  assert.match(
    buildPlanDecisionChips(unreliableWaterPlan).find((chip) => chip.label === "水場限定")
      ?.reason ?? "",
    /水場が涸れる可能性.*水を多めに携行/
  );

  const hutWaterPlan = makePlan({
    season: "SUMMER",
    mountain: {
      water_availability: "HUT_OR_SHOP_RELIABLE"
    },
    requiredSlots: ["WATER_STORAGE"]
  });
  const hutWaterReason = itemByLabel(
    buildPlanChecklist({ plan: hutWaterPlan }),
    "飲み水"
  )?.reason ?? "";

  assert.doesNotMatch(hutWaterReason, /水場が涸れる可能性|水を多めに携行/);
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
