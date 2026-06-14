import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

const meizan200Migration = readFileSync(
  new URL("../supabase/migrations/023_mountain_foundation_meizan_200_profiles.sql", import.meta.url),
  "utf8"
);
const tripRequirementEngineSource = readFileSync(
  new URL("../src/lib/trip-requirements/engine.ts", import.meta.url),
  "utf8"
);
const packRequirementEngineSource = readFileSync(
  new URL("../src/lib/pack-requirements/engine.ts", import.meta.url),
  "utf8"
);
const gearMatchingSource = readFileSync(
  new URL("../src/lib/gear-matching/engine.ts", import.meta.url),
  "utf8"
);
const planChecklistSource = readFileSync(
  new URL("../src/lib/plan-checklist.ts", import.meta.url),
  "utf8"
);

const { getRequiredSystemsForTrip } = await importTranspiled(tripRequirementEngineSource);
const gearMatchingDataUrl = await toTranspiledDataUrl(gearMatchingSource);
const { generatePackRequirementPlan } = await importTranspiled(
  packRequirementEngineSource.replace(
    'from "@/lib/gear-matching/engine"',
    `from "${gearMatchingDataUrl}"`
  )
);
const { buildPlanChecklist } = await importTranspiled(planChecklistSource);

const officialMountains = applyReviewedStaticFixes(parseMeizan200Profiles(meizan200Migration))
  .filter((mountain) => {
    return (
      mountain.meizan_list === "JAPAN_HYAKUMEIZAN" ||
      mountain.meizan_list === "JAPAN_NIHYAKUMEIZAN_EXTRA"
    );
  });

function checklistItems(checklist) {
  return checklist.categories.flatMap((category) => category.items);
}

function itemByLabel(checklist, label) {
  return checklistItems(checklist).find((item) => item.label === label);
}

function slotNames(plan) {
  return plan.required_slots.map((slotPlan) => slotPlan.slot);
}

function hasCookingSlot(plan) {
  return slotNames(plan).some((slot) => {
    return ["STOVE", "FUEL", "COOK_POT", "TABLEWARE"].includes(slot);
  });
}

function hasCookingChecklistItem(checklist) {
  return ["バーナー", "クッカー", "ガス缶"].some((label) => itemByLabel(checklist, label));
}

function hasSpecialTechnicalChecklistItem(checklist) {
  return ["ヘルメット", "チェーンスパイク", "アイゼン", "ピッケル"].some((label) => {
    return itemByLabel(checklist, label);
  });
}

test("all 200 official mountain profiles flow through recommendation and checklist generation", () => {
  assert.equal(officialMountains.length, 200);

  let checkedContexts = 0;

  for (const mountain of officialMountains) {
    assert.ok(mountain.supported_seasons.length > 0, `${mountain.slug} has no seasons`);
    assert.ok(mountain.supported_styles.length > 0, `${mountain.slug} has no styles`);

    for (const season of mountain.supported_seasons) {
      for (const style of mountain.supported_styles) {
        const contextLabel = `${mountain.name_ja} (${mountain.slug}) ${season}/${style}`;
        const requiredSystems = getRequiredSystemsForTrip({ mountain, season, style });
        const plan = generatePackRequirementPlan({
          mountain,
          season,
          style,
          requiredSystems,
          ownedGear: []
        });
        const checklist = buildPlanChecklist({ plan });
        const items = checklistItems(checklist);

        checkedContexts += 1;
        assert.ok(requiredSystems.length > 0, `${contextLabel} produced no systems`);
        assert.ok(plan.required_slots.length > 0, `${contextLabel} produced no slots`);
        assert.ok(items.length > 0, `${contextLabel} produced no checklist items`);
        assert.ok(
          checklist.summary.percent >= 0 && checklist.summary.percent <= 100,
          `${contextLabel} has invalid progress`
        );
        assert.equal(
          checklist.summary.totalCount,
          items.length,
          `${contextLabel} summary count does not match checklist items`
        );
      }
    }
  }

  assert.ok(checkedContexts > 400);
});

test("all 200 official mountain profiles avoid major checklist contradictions", () => {
  const lowRiskMaintainedContexts = [];
  const helmetContexts = [];
  const tractionContexts = [];
  const highBearContexts = [];

  for (const mountain of officialMountains) {
    for (const season of mountain.supported_seasons) {
      for (const style of mountain.supported_styles) {
        const contextLabel = `${mountain.name_ja} (${mountain.slug}) ${season}/${style}`;
        const requiredSystems = getRequiredSystemsForTrip({ mountain, season, style });
        const plan = generatePackRequirementPlan({
          mountain,
          season,
          style,
          requiredSystems,
          ownedGear: []
        });
        const checklist = buildPlanChecklist({ plan });
        const slots = slotNames(plan);

        if (style === "DAY_HIKE" || style === "OVERNIGHT_HUT") {
          assert.equal(hasCookingSlot(plan), false, `${contextLabel} should not require cooking slots`);
          assert.equal(
            hasCookingChecklistItem(checklist),
            false,
            `${contextLabel} should not show cooking checklist items`
          );
        }

        if (style === "OVERNIGHT_TENT" || style === "MULTI_DAY_TREK") {
          assert.equal(itemByLabel(checklist, "テント")?.priority, "ESSENTIAL", contextLabel);
          assert.equal(itemByLabel(checklist, "シュラフ（寝袋）")?.priority, "ESSENTIAL", contextLabel);
          assert.equal(itemByLabel(checklist, "バーナー")?.priority, "SUGGESTED", contextLabel);
          assert.equal(itemByLabel(checklist, "クッカー")?.priority, "SUGGESTED", contextLabel);
          assert.equal(itemByLabel(checklist, "ガス缶")?.priority, "SUGGESTED", contextLabel);
        }

        if (
          season !== "WINTER" &&
          mountain.technical_terrain === "MAINTAINED_TRAIL" &&
          mountain.helmet_guidance === "NOT_NEEDED" &&
          ["NONE", "LOW"].includes(mountain.snow_or_ice_risk)
        ) {
          lowRiskMaintainedContexts.push(contextLabel);
          assert.equal(
            hasSpecialTechnicalChecklistItem(checklist),
            false,
            `${contextLabel} should not show technical safety equipment`
          );
        }

        if (
          mountain.helmet_guidance === "RECOMMENDED" ||
          mountain.helmet_guidance === "REQUIRED" ||
          ["CHAIN_LADDER", "EXPOSED_SCRAMBLE"].includes(mountain.technical_terrain)
        ) {
          helmetContexts.push(contextLabel);
          assert.ok(slots.includes("HELMET"), `${contextLabel} should require helmet slot`);
          assert.ok(itemByLabel(checklist, "ヘルメット"), `${contextLabel} should show helmet`);
        }

        if (
          ["LIKELY", "WINTER_ALPINE"].includes(mountain.snow_or_ice_risk) ||
          (mountain.snow_or_ice_risk === "SEASONAL_PATCHES" &&
            ["SPRING", "AUTUMN", "WINTER"].includes(season))
        ) {
          tractionContexts.push(contextLabel);
          assert.ok(
            slots.includes("TRACTION_DEVICE"),
            `${contextLabel} should require traction device slot`
          );
          assert.ok(
            itemByLabel(checklist, "チェーンスパイク"),
            `${contextLabel} should show chain spikes`
          );
        }

        if (mountain.bear_or_wildlife_risk === "HIGH") {
          highBearContexts.push(contextLabel);
          assert.equal(itemByLabel(checklist, "熊対策装備")?.priority, "ESSENTIAL", contextLabel);
        }

        if (mountain.bear_or_wildlife_risk === "LOW") {
          assert.equal(itemByLabel(checklist, "熊対策装備"), undefined, contextLabel);
        }
      }
    }
  }

  assert.ok(lowRiskMaintainedContexts.length > 50);
  assert.ok(helmetContexts.length > 20);
  assert.ok(tractionContexts.length > 100);
  assert.ok(highBearContexts.length > 10);
});

function parseMeizan200Profiles(source) {
  const columns = source
    .match(/insert into public\.mountain_foundation_profiles \(([\s\S]*?)\)\s*values/)?.[1]
    .split("\n")
    .map((line) => line.trim().replace(/,$/, ""))
    .filter(Boolean);
  const valuesSource = source.match(/\)\s*values\s*([\s\S]*?)\s*on conflict \(slug\)/)?.[1];

  assert.ok(columns, "Could not parse profile columns");
  assert.ok(valuesSource, "Could not parse profile values");

  return extractTuples(valuesSource).map((tuple) => {
    const values = splitTopLevel(tuple.slice(1, -1)).map(parseSqlValue);

    assert.equal(values.length, columns.length, `Invalid tuple width for ${tuple.slice(0, 80)}`);

    return Object.fromEntries(columns.map((column, index) => [column, values[index]]));
  });
}

function applyReviewedStaticFixes(mountains) {
  return mountains.map((mountain) => {
    if (mountain.slug === "rishiri-zan") {
      return { ...mountain, bear_or_wildlife_risk: "LOW" };
    }

    if (mountain.slug === "utsukushigahara" || mountain.slug === "kirigamine") {
      return {
        ...mountain,
        route_seriousness: "LOW",
        technical_terrain: "MAINTAINED_TRAIL"
      };
    }

    if (mountain.slug === "daibosatsu-rei" || mountain.slug === "tsurugi-san-shikoku") {
      return {
        ...mountain,
        route_seriousness: "MODERATE",
        technical_terrain: "MAINTAINED_TRAIL"
      };
    }

    return mountain;
  });
}

function extractTuples(source) {
  const tuples = [];
  let depth = 0;
  let start = -1;
  let inQuote = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (char === "'" && inQuote && next === "'") {
      index += 1;
      continue;
    }

    if (char === "'") {
      inQuote = !inQuote;
      continue;
    }

    if (inQuote) {
      continue;
    }

    if (char === "(") {
      if (depth === 0) {
        start = index;
      }
      depth += 1;
    }

    if (char === ")") {
      depth -= 1;

      if (depth === 0 && start >= 0) {
        tuples.push(source.slice(start, index + 1));
        start = -1;
      }
    }
  }

  return tuples;
}

function splitTopLevel(source) {
  const parts = [];
  let start = 0;
  let bracketDepth = 0;
  let inQuote = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (char === "'" && inQuote && next === "'") {
      index += 1;
      continue;
    }

    if (char === "'") {
      inQuote = !inQuote;
      continue;
    }

    if (inQuote) {
      continue;
    }

    if (char === "[") {
      bracketDepth += 1;
      continue;
    }

    if (char === "]") {
      bracketDepth -= 1;
      continue;
    }

    if (char === "," && bracketDepth === 0) {
      parts.push(source.slice(start, index).trim());
      start = index + 1;
    }
  }

  parts.push(source.slice(start).trim());
  return parts;
}

function parseSqlValue(value) {
  const arrayMatch = value.match(/^array\[(.*)\]::[a-z_]+\[\]$/s);

  if (arrayMatch) {
    const arrayContent = arrayMatch[1];

    return splitTopLevel(arrayContent).map(parseSqlValue);
  }

  if (value === "null") {
    return null;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  if (/^-?\d+$/.test(value)) {
    return Number(value);
  }

  if (value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1).replace(/''/g, "'");
  }

  return value;
}

async function importTranspiled(source) {
  return import(await toTranspiledDataUrl(source));
}

async function toTranspiledDataUrl(source) {
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022
    }
  });

  return `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`;
}
