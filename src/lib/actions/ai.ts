"use server";

import OpenAI from "openai";
import { redirect } from "next/navigation";

import { getUserGear, requireUser } from "@/lib/data/gear";
import { findMountainByName } from "@/lib/data/recommendations";
import type {
  AIRecommendationOutput,
  AIRecommendedItem,
  ExperienceLevel,
  GearAnalysis,
  MissingGearAnalysis,
  UserGear
} from "@/lib/types";
import { toNumber } from "@/lib/utils/format";

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

export async function createRecommendation(formData: FormData) {
  const { supabase, user } = await requireUser();

  const input = {
    mountain_name: String(formData.get("mountain_name") ?? "").trim(),
    month: toNumber(formData.get("month")) ?? new Date().getMonth() + 1,
    days: toNumber(formData.get("days")) ?? 1,
    is_camping: formData.get("is_camping") === "on",
    budget_jpy: toNumber(formData.get("budget_jpy")) ?? 0,
    experience_level: String(
      formData.get("experience_level") ?? "beginner"
    ) as ExperienceLevel
  };

  if (!input.mountain_name) {
    redirectWithError("山名を入力してください");
  }

  if (!process.env.OPENAI_API_KEY) {
    redirectWithError("OPENAI_API_KEY が設定されていません");
  }

  const [gear, mountain] = await Promise.all([
    getUserGear(),
    findMountainByName(input.mountain_name)
  ]);

  let output: AIRecommendationOutput;

  try {
    output = await requestAIRecommendation({
      input,
      mountain,
      gear
    });
  } catch {
    redirectWithError("AI推薦の作成に失敗しました。少し時間をおいて再度お試しください。");
  }

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
      model: MODEL
    })
    .select("id")
    .single();

  if (error) {
    redirectWithError(error.message);
  }

  redirect(`/ai/recommendations/${data.id}`);
}

function redirectWithError(message: string): never {
  redirect(`/ai?error=${encodeURIComponent(message)}`);
}

async function requestAIRecommendation({
  input,
  mountain,
  gear
}: {
  input: {
    mountain_name: string;
    month: number;
    days: number;
    is_camping: boolean;
    budget_jpy: number;
    experience_level: ExperienceLevel;
  };
  mountain: unknown;
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
          "あなたは日本の登山・キャンプ装備に詳しい安全重視のギアアドバイザーです。出力は必ず日本語にしてください。天気APIや現在の天気を使わず、季節・日数・宿泊方式・経験レベル・山域の基本情報だけで保守的に判断してください。道案内やGPS情報は提供しないでください。"
      },
      {
        role: "user",
        content: JSON.stringify({
          request: input,
          mountain,
          user_gear: gear.map((item) => ({
            name: item.name,
            brand: item.brand,
            category: item.gear_categories?.name_en,
            status: item.status,
            weight_g: item.weight_g,
            price_jpy: item.price_jpy
          })),
          instruction:
            "既存装備は参考情報です。必要装備、推奨装備、任意装備、リスク、重量、予算を日本語で返してください。category は指定 enum の英語値だけを使ってください。"
        })
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "gearai_recommendation",
        strict: true,
        schema: recommendationJsonSchema
      }
    }
  });

  const content = completion.choices[0]?.message.content;

  if (!content) {
    throw new Error("AI推薦の生成に失敗しました。");
  }

  return JSON.parse(content) as AIRecommendationOutput;
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
      const categoryMatch = item.gear_categories?.name_en === recommended.category;
      const nameMatch =
        normalize(item.name).includes(normalize(recommended.name)) ||
        normalize(recommended.name).includes(normalize(item.name));

      return categoryMatch || nameMatch;
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
      match_confidence: exact ? "high" : "medium"
    } as const;

    if (exact) {
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

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, "");
}

const itemSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: { type: "string" },
    category: {
      type: "string",
      enum: [
        "backpacking",
        "sleeping",
        "clothing",
        "cooking",
        "safety",
        "electronics",
        "other"
      ]
    },
    reason: { type: "string" },
    priority: { type: "string", enum: ["high", "medium", "low"] },
    estimated_weight_g: { type: "number" },
    estimated_price_jpy: { type: "number" }
  },
  required: [
    "name",
    "category",
    "reason",
    "priority",
    "estimated_weight_g",
    "estimated_price_jpy"
  ]
};

const recommendationJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    trip_summary: { type: "string" },
    required_items: { type: "array", items: itemSchema },
    recommended_items: { type: "array", items: itemSchema },
    optional_items: { type: "array", items: itemSchema },
    risk_warnings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          level: { type: "string", enum: ["high", "medium", "low"] },
          message: { type: "string" }
        },
        required: ["level", "message"]
      }
    },
    estimated_total_weight_g: { type: "number" },
    estimated_total_budget_jpy: { type: "number" },
    budget_comment: { type: "string" },
    safety_note: { type: "string" }
  },
  required: [
    "trip_summary",
    "required_items",
    "recommended_items",
    "optional_items",
    "risk_warnings",
    "estimated_total_weight_g",
    "estimated_total_budget_jpy",
    "budget_comment",
    "safety_note"
  ]
};
