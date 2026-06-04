"use server";

import OpenAI from "openai";
import { redirect } from "next/navigation";

import { getUserGear, requireUser } from "@/lib/data/gear";
import { findMountainByName } from "@/lib/data/recommendations";
import {
  createRuleBasedRecommendation,
  type RuleEngineInput
} from "@/lib/recommendations/rule-engine";
import type {
  AIRecommendationOutput,
  GearAnalysis,
  MissingGearAnalysis,
  UserGear
} from "@/lib/types";
import { toNumber } from "@/lib/utils/format";

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

export async function createRecommendation(formData: FormData) {
  const { supabase, user } = await requireUser();
  const input: RuleEngineInput = {
    mountain_region: String(formData.get("mountain_region") ?? "").trim(),
    season: parseSeason(formData.get("season")),
    weather_risk: parseWeatherRisk(formData.get("weather_risk")),
    days: toNumber(formData.get("days")) ?? 1,
    accommodation_style: parseAccommodationStyle(
      formData.get("accommodation_style")
    ),
    budget_jpy: toNumber(formData.get("budget_jpy")) ?? 0,
    experience_level: parseExperienceLevel(formData.get("experience_level"))
  };

  if (!input.mountain_region) {
    redirectWithError("山域を入力してください");
  }

  const [gear, mountain] = await Promise.all([
    getUserGear(),
    findMountainByName(input.mountain_region)
  ]);

  const ruleOutput = createRuleBasedRecommendation(input);
  const output = await addAIExplanations(ruleOutput, input, gear);
  const ownedAnalysis = analyzeOwnedGear(output, gear);
  const missingAnalysis = analyzeMissingGear(output, ownedAnalysis);

  const { data, error } = await supabase
    .from("ai_recommendations")
    .insert({
      user_id: user.id,
      mountain_id: mountain?.id ?? null,
      input,
      output,
      owned_analysis: ownedAnalysis,
      missing_analysis: missingAnalysis,
      model: process.env.OPENAI_API_KEY ? `rules+${MODEL}` : "rules"
    })
    .select("id")
    .single();

  if (error) {
    redirectWithError(error.message);
  }

  redirect(`/ai/recommendations/${data.id}`);
}

async function addAIExplanations(
  output: AIRecommendationOutput,
  input: RuleEngineInput,
  gear: UserGear[]
) {
  if (!process.env.OPENAI_API_KEY) {
    return output;
  }

  try {
    return mergeExplanation(
      output,
      await requestAIExplanation({ output, input, gear })
    );
  } catch (error) {
    logAIRecommendationError(error);
    return output;
  }
}

async function requestAIExplanation({
  output,
  input,
  gear
}: {
  output: AIRecommendationOutput;
  input: RuleEngineInput;
  gear: UserGear[];
}) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  const completion = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content:
          "あなたは日本の登山装備に詳しい編集者です。装備の追加・削除・カテゴリ変更は絶対にせず、渡されたルールエンジン結果の説明文だけを自然な日本語に整えてください。"
      },
      {
        role: "user",
        content: JSON.stringify({
          trip_input: input,
          user_owned_gear: gear
            .filter((item) => item.status === "owned")
            .map((item) => ({
              name: item.name,
              brand: item.brand,
              category: item.gear_categories?.name_en,
              subcategory: item.gear_subcategories?.name_en,
              weight_grams: item.weight_grams
            })),
          rule_output: output
        })
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "gearai_rule_explanation",
        strict: true,
        schema: explanationJsonSchema
      }
    }
  });

  const content = completion.choices[0]?.message.content;

  if (!content) {
    throw new Error("AI説明の生成に失敗しました。");
  }

  return JSON.parse(content) as ExplanationPatch;
}

function mergeExplanation(
  output: AIRecommendationOutput,
  explanation: ExplanationPatch
): AIRecommendationOutput {
  return {
    ...output,
    trip_summary: explanation.trip_summary || output.trip_summary,
    budget_comment: explanation.budget_comment || output.budget_comment,
    safety_note: explanation.safety_note || output.safety_note,
    required_items: mergeItemReasons(output.required_items, explanation.item_reasons),
    recommended_items: mergeItemReasons(
      output.recommended_items,
      explanation.item_reasons
    ),
    optional_items: mergeItemReasons(output.optional_items, explanation.item_reasons)
  };
}

function mergeItemReasons(
  items: AIRecommendationOutput["required_items"],
  reasons: ExplanationPatch["item_reasons"]
) {
  return items.map((item) => {
    const reason = reasons.find((entry) => entry.name === item.name)?.reason;
    return reason ? { ...item, reason } : item;
  });
}

function analyzeOwnedGear(
  output: AIRecommendationOutput,
  gear: UserGear[]
): GearAnalysis {
  const ownedGear = gear.filter((item) => item.status === "owned");
  const allRecommended = flattenRecommendedItems(output);
  const ownedItems: GearAnalysis["owned_items"] = [];
  const maybeOwnedItems: GearAnalysis["maybe_owned_items"] = [];

  for (const recommended of allRecommended) {
    const matches = ownedGear.filter((item) => {
      const categoryMatch =
        item.gear_categories?.name_en === recommended.category;
      const subcategoryMatch =
        item.gear_subcategories?.name_en === recommended.subcategory;
      const nameMatch =
        normalize(item.name).includes(normalize(recommended.name)) ||
        normalize(recommended.name).includes(normalize(item.name));

      return subcategoryMatch || categoryMatch || nameMatch;
    });

    const exact = matches.find((item) =>
      normalize(item.name).includes(normalize(recommended.name))
    );
    const match = exact ?? matches[0];

    if (!match) {
      continue;
    }

    const analysisItem = {
      recommended_name: recommended.name,
      matched_user_gear_id: match.id,
      matched_user_gear_name: match.name,
      match_confidence: exact || itemHasSubcategory(match, recommended.subcategory)
        ? "high"
        : "medium"
    } as const;

    if (analysisItem.match_confidence === "high") {
      ownedItems.push(analysisItem);
    } else {
      maybeOwnedItems.push(analysisItem);
    }
  }

  return {
    owned_items: dedupeOwnedAnalysis(ownedItems),
    maybe_owned_items: dedupeOwnedAnalysis(maybeOwnedItems)
  };
}

function analyzeMissingGear(
  output: AIRecommendationOutput,
  ownedAnalysis: GearAnalysis
): MissingGearAnalysis {
  const ownedNames = new Set(
    ownedAnalysis.owned_items.map((item) => item.recommended_name)
  );

  const missingRequired = output.required_items
    .filter((item) => !ownedNames.has(item.name))
    .map((item) => ({ ...item, group: "required" as const }));
  const missingRecommended = output.recommended_items
    .filter((item) => !ownedNames.has(item.name))
    .map((item) => ({ ...item, group: "recommended" as const }));
  const missingOptional = output.optional_items
    .filter((item) => !ownedNames.has(item.name))
    .map((item) => ({ ...item, group: "optional" as const }));

  const allMissing = [...missingRequired, ...missingRecommended, ...missingOptional];

  return {
    missing_required_items: missingRequired,
    missing_recommended_items: missingRecommended,
    missing_optional_items: missingOptional,
    estimated_missing_weight_g: allMissing.reduce(
      (total, item) => total + Number(item.estimated_weight_g ?? 0),
      0
    ),
    estimated_missing_budget_jpy: allMissing.reduce(
      (total, item) => total + Number(item.estimated_price_jpy ?? 0),
      0
    )
  };
}

function flattenRecommendedItems(output: AIRecommendationOutput) {
  return [
    ...output.required_items,
    ...output.recommended_items,
    ...output.optional_items
  ];
}

function itemHasSubcategory(item: UserGear, subcategory: string) {
  return item.gear_subcategories?.name_en === subcategory;
}

function dedupeOwnedAnalysis(items: GearAnalysis["owned_items"]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.recommended_name}:${item.matched_user_gear_id}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function parseSeason(value: FormDataEntryValue | null) {
  return value === "spring" ||
    value === "summer" ||
    value === "autumn" ||
    value === "winter"
    ? value
    : "summer";
}

function parseWeatherRisk(value: FormDataEntryValue | null) {
  return value === "stable" ||
    value === "rain" ||
    value === "cold" ||
    value === "wind" ||
    value === "snow"
    ? value
    : "stable";
}

function parseAccommodationStyle(value: FormDataEntryValue | null) {
  return value === "day_hike" || value === "hut" || value === "tent"
    ? value
    : "day_hike";
}

function parseExperienceLevel(value: FormDataEntryValue | null) {
  return value === "beginner" ||
    value === "intermediate" ||
    value === "advanced" ||
    value === "expert"
    ? value
    : "beginner";
}

function redirectWithError(message: string): never {
  redirect(`/ai?error=${encodeURIComponent(message)}`);
}

function logAIRecommendationError(error: unknown) {
  if (!isErrorLike(error)) {
    console.error("[AI recommendation] Unknown explanation error", error);
    return;
  }

  console.error("[AI recommendation] OpenAI explanation failed", {
    name: error.name,
    status: error.status,
    code: error.code,
    type: error.type,
    message: error.message,
    stack: error.stack
  });
}

function isErrorLike(error: unknown): error is Error & {
  status?: number;
  code?: string;
  type?: string;
} {
  return typeof error === "object" && error !== null && "message" in error;
}

function normalize(value: string) {
  return value.toLocaleLowerCase().replace(/\s+/g, "");
}

type ExplanationPatch = {
  trip_summary: string;
  budget_comment: string;
  safety_note: string;
  item_reasons: Array<{
    name: string;
    reason: string;
  }>;
};

const explanationJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    trip_summary: { type: "string" },
    budget_comment: { type: "string" },
    safety_note: { type: "string" },
    item_reasons: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          reason: { type: "string" }
        },
        required: ["name", "reason"]
      }
    }
  },
  required: ["trip_summary", "budget_comment", "safety_note", "item_reasons"]
};
