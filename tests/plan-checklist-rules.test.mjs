import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

const planChecklistSource = readFileSync(
  new URL("../src/lib/plan-checklist.ts", import.meta.url),
  "utf8"
);

const { outputText } = ts.transpileModule(planChecklistSource, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022
  }
});
const planChecklistModule = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);
const { buildPlanChecklist } = planChecklistModule;

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
      requiredSlots: ["SLEEP_INSULATION"]
    })
  });

  assert.equal(itemByLabel(checklist, "シュラフ（寝袋）")?.priority, "ESSENTIAL");
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
