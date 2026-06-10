import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

const engineSource = readFileSync(
  new URL("../src/lib/gear-matching/engine.ts", import.meta.url),
  "utf8"
);
const repositorySource = readFileSync(
  new URL("../src/lib/data/gear-matching.ts", import.meta.url),
  "utf8"
);
const packEngineSource = readFileSync(
  new URL("../src/lib/pack-requirements/engine.ts", import.meta.url),
  "utf8"
);
const typesSource = readFileSync(new URL("../src/lib/types.ts", import.meta.url), "utf8");

const { outputText } = ts.transpileModule(engineSource, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022
  }
});
const engineModule = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);
const { getGearCompatibilityRule, matchGearForRequirementSlot } = engineModule;

function category(name_en) {
  return {
    id: `${name_en}-category`,
    name_ja: name_en,
    name_en
  };
}

function subcategory(name_en) {
  return {
    id: `${name_en}-subcategory`,
    name_ja: name_en,
    name_en
  };
}

function ownedGear({
  id,
  name,
  brand = null,
  model = null,
  categoryName,
  subcategoryName = null,
  productCategoryName = null,
  productSubcategoryName = null
}) {
  return {
    id,
    user_id: "user-1",
    product_id: productCategoryName ? `${id}-product` : null,
    category_id: `${categoryName}-category`,
    subcategory_id: subcategoryName ? `${subcategoryName}-subcategory` : null,
    name,
    brand,
    model,
    weight_grams: 1,
    official_weight_grams: null,
    measured_weight_grams: null,
    msrp_jpy: null,
    purchase_price_jpy: null,
    size: null,
    volume: null,
    color: null,
    material: null,
    capacity: null,
    official_url: null,
    image_url: null,
    purchase_date: null,
    status: "owned",
    weight_type: "base",
    memo: null,
    created_at: "2026-06-06T00:00:00.000Z",
    updated_at: "2026-06-06T00:00:00.000Z",
    gear_categories: category(categoryName),
    gear_subcategories: subcategoryName ? subcategory(subcategoryName) : null,
    gear_products: productCategoryName
      ? {
          id: `${id}-product`,
          brand,
          model,
          name_ja: name,
          category_id: `${productCategoryName}-category`,
          subcategory_id: productSubcategoryName
            ? `${productSubcategoryName}-subcategory`
            : null,
          official_url: null,
          msrp_source_url: null,
          last_verified_at: null,
          verification_status: "verified",
          gear_categories: category(productCategoryName),
          gear_subcategories: productSubcategoryName
            ? subcategory(productSubcategoryName)
            : null
        }
      : null
  };
}

function databaseGear({
  id,
  brand,
  model,
  categoryName,
  subcategoryName
}) {
  return {
    id,
    brand,
    model,
    name_ja: model,
    category_id: `${categoryName}-category`,
    subcategory_id: `${subcategoryName}-subcategory`,
    weight_grams: 1,
    official_weight_grams: 1,
    measured_weight_grams: null,
    msrp_jpy: null,
    size: null,
    volume: null,
    color: null,
    material: null,
    capacity: null,
    official_url: null,
    image_url: null,
    released_at: null,
    discontinued: false,
    msrp_source_url: null,
    last_verified_at: null,
    verification_status: "verified",
    created_at: "2026-06-06T00:00:00.000Z",
    gear_categories: category(categoryName),
    gear_subcategories: subcategory(subcategoryName),
    gear_product_aliases: []
  };
}

test("gear matching exposes deterministic compatibility rules for each slot", () => {
  assert.deepEqual(getGearCompatibilityRule("FUEL").compatible_targets, [
    { category: "cooking", subcategory: "fuel" },
    { category: "cooking", subcategory: "gas_canister" }
  ]);

  assert.deepEqual(getGearCompatibilityRule("INSULATION_LAYER").compatible_targets, [
    { category: "clothing", subcategory: "insulation" },
    { category: "clothing", subcategory: "down_jacket" }
  ]);

  assert.equal(getGearCompatibilityRule("WATER_STORAGE").confidence, "MEDIUM");
  assert.match(
    getGearCompatibilityRule("WATER_STORAGE").ambiguous_cases.join(" "),
    /Hydration bladder/
  );
});

test("gear matching returns compatible categories and exact owned gear matches", () => {
  const result = matchGearForRequirementSlot({
    slot: "FUEL",
    ownedGear: [
      ownedGear({
        id: "fuel-1",
        name: "Owned Fuel",
        categoryName: "cooking",
        subcategoryName: "fuel"
      }),
      ownedGear({
        id: "canister-1",
        name: "Owned Gas Canister",
        categoryName: "cooking",
        subcategoryName: "gas_canister"
      }),
      ownedGear({
        id: "stove-1",
        name: "Owned Stove",
        categoryName: "cooking",
        subcategoryName: "stove"
      })
    ]
  });

  assert.deepEqual(result.compatible_categories, ["cooking"]);
  assert.deepEqual(result.compatible_subcategories, ["fuel", "gas_canister"]);
  assert.deepEqual(
    result.matching_owned_gear.map((item) => item.id),
    ["fuel-1", "canister-1"]
  );
  assert.deepEqual(result.matching_database_gear, []);
});

test("gear matching returns exact database gear matches without ranking", () => {
  const result = matchGearForRequirementSlot({
    slot: "INSULATION_LAYER",
    databaseGear: [
      databaseGear({
        id: "down-1",
        brand: "Brand",
        model: "Down Jacket",
        categoryName: "clothing",
        subcategoryName: "down_jacket"
      }),
      databaseGear({
        id: "base-1",
        brand: "Brand",
        model: "Base Layer",
        categoryName: "clothing",
        subcategoryName: "base_layer"
      })
    ]
  });

  assert.equal(result.confidence, "MEDIUM");
  assert.deepEqual(result.matching_database_gear.map((item) => item.id), ["down-1"]);
  assert.equal(result.matching_database_gear[0].model, "Down Jacket");
});

test("gear matching excludes tent footprint accessories from tent coverage", () => {
  const result = matchGearForRequirementSlot({
    slot: "TENT",
    ownedGear: [
      ownedGear({
        id: "tent-footprint",
        name: "Stella Ridge Tent Footprint",
        categoryName: "shelter",
        subcategoryName: "tent"
      }),
      ownedGear({
        id: "real-tent",
        name: "Stella Ridge Tent",
        categoryName: "shelter",
        subcategoryName: "tent"
      }),
      ownedGear({
        id: "jp-footprint",
        name: "テント フットプリント",
        categoryName: "shelter",
        subcategoryName: "tent"
      }),
      ownedGear({
        id: "ground-sheet",
        name: "テント 地布",
        categoryName: "shelter",
        subcategoryName: "tent"
      })
    ],
    databaseGear: [
      databaseGear({
        id: "db-footprint",
        brand: "Brand",
        model: "テント フットプリント",
        categoryName: "shelter",
        subcategoryName: "tent"
      }),
      databaseGear({
        id: "db-tent",
        brand: "Brand",
        model: "Mountain Tent",
        categoryName: "shelter",
        subcategoryName: "tent"
      })
    ]
  });

  assert.deepEqual(result.matching_owned_gear.map((item) => item.id), ["real-tent"]);
  assert.deepEqual(result.matching_database_gear.map((item) => item.id), ["db-tent"]);
});

test("gear matching resolves category-only user gear with stable slot hints", () => {
  const ownedGearItems = [
    ownedGear({
      id: "tent-category-only",
      name: "Mountain Shot 2",
      brand: "finetrack",
      model: "Mountain Shot 2",
      categoryName: "shelter"
    }),
    ownedGear({
      id: "sleep-category-only",
      name: "Seamless Down Hugger 800 #2",
      brand: "mont-bell",
      model: "Seamless Down Hugger 800 #2",
      categoryName: "sleep"
    }),
    ownedGear({
      id: "headlamp-category-only",
      name: "Spot 400",
      brand: "Black Diamond",
      model: "Spot 400",
      categoryName: "electronics"
    })
  ];

  assert.deepEqual(
    matchGearForRequirementSlot({
      slot: "TENT",
      ownedGear: ownedGearItems
    }).matching_owned_gear.map((item) => item.id),
    ["tent-category-only"]
  );
  assert.deepEqual(
    matchGearForRequirementSlot({
      slot: "SLEEP_INSULATION",
      ownedGear: ownedGearItems
    }).matching_owned_gear.map((item) => item.id),
    ["sleep-category-only"]
  );
  assert.deepEqual(
    matchGearForRequirementSlot({
      slot: "HEADLAMP",
      ownedGear: ownedGearItems
    }).matching_owned_gear.map((item) => item.id),
    ["headlamp-category-only"]
  );
});

test("gear matching falls back to linked product classification when user subcategory is missing", () => {
  const result = matchGearForRequirementSlot({
    slot: "TENT",
    ownedGear: [
      ownedGear({
        id: "linked-product-tent",
        name: "My alpine shelter",
        categoryName: "shelter",
        productCategoryName: "shelter",
        productSubcategoryName: "tent"
      })
    ]
  });

  assert.deepEqual(result.matching_owned_gear.map((item) => item.id), [
    "linked-product-tent"
  ]);
});

test("gear matching normalizes display labels but does not override explicit incompatible subcategories", () => {
  const result = matchGearForRequirementSlot({
    slot: "TENT",
    ownedGear: [
      ownedGear({
        id: "display-label-tent",
        name: "Mountain Shot 2",
        categoryName: "Tent / Shelter",
        subcategoryName: "テント"
      }),
      ownedGear({
        id: "explicit-groundsheet",
        name: "Mountain Shot 2",
        categoryName: "shelter",
        subcategoryName: "groundsheet",
        productCategoryName: "shelter",
        productSubcategoryName: "tent"
      })
    ]
  });

  assert.deepEqual(result.matching_owned_gear.map((item) => item.id), [
    "display-label-tent"
  ]);
});

test("gear matching does not fuzzy-match names or legacy broad categories", () => {
  const result = matchGearForRequirementSlot({
    slot: "RAIN_JACKET",
    ownedGear: [
      ownedGear({
        id: "name-only",
        name: "Rain Jacket In Name Only",
        categoryName: "clothing",
        subcategoryName: "insulation"
      }),
      ownedGear({
        id: "broad-rainwear",
        name: "Generic Rainwear",
        categoryName: "clothing",
        subcategoryName: "rainwear"
      })
    ]
  });

  assert.deepEqual(result.matching_owned_gear, []);
  assert.match(result.ambiguous_cases.join(" "), /Generic rainwear/);
});

test("gear matching repository and pack generator use the compatibility engine boundary", () => {
  assert.match(repositorySource, /getOwnedGearForPlanning\(\)/);
  assert.doesNotMatch(repositorySource, /getUserGear\(\{ status: "owned" \}\)/);
  assert.match(repositorySource, /getGearProducts/);
  assert.match(repositorySource, /matchGearForRequirementSlot/);
  assert.match(packEngineSource, /matchGearForRequirementSlot/);
  assert.match(typesSource, /GearMatchingResult/);
  assert.match(typesSource, /GearCompatibilityRule/);

  for (const source of [engineSource, repositorySource, packEngineSource]) {
    assert.doesNotMatch(source, /\b(openai|ai recommendation|weather|route|risk)\b/i);
    assert.doesNotMatch(source, /\b(recommend|shopping|wishlist|upgrade|best gear)\b/i);
    assert.doesNotMatch(source, /\b(score|rank|priority|fuzzy|similarity)\b/i);
  }
});
