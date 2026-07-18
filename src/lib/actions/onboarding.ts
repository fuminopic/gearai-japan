"use server";

import { redirect } from "next/navigation";

import {
  ONBOARDING_FINISHED_AT_METADATA_KEY,
  ONBOARDING_STATE_METADATA_KEY,
  type OnboardingState
} from "@/lib/onboarding";
import { createClient } from "@/lib/supabase/server";

// プロフィール編集（updateProfile / updateInsurance）と同じ user_metadata 更新のみ。
// テーブル書き込み・schema 変更・Auth フロー変更は行わない。

async function persistOnboardingState(state: OnboardingState) {
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    data: {
      [ONBOARDING_STATE_METADATA_KEY]: state,
      [ONBOARDING_FINISHED_AT_METADATA_KEY]: new Date().toISOString()
    }
  });

  if (error) {
    // 保存に失敗してもユーザーをオンボーディングに閉じ込めない。
    // フラグ未保存のままなら次回入場時にもう一度表示されるだけで、実害は小さい。
    console.error("Onboarding state update failed:", error.message);
  }
}

/** 最終ページの「山行計画をつくる」。以後は自動表示せず、計画作成へ進む。 */
export async function completeOnboarding() {
  await persistOnboardingState("completed");
  redirect("/plan");
}

/** 右上の「スキップ」。以後は自動表示せず、ホームへ進む。 */
export async function skipOnboarding() {
  await persistOnboardingState("skipped");
  redirect("/dashboard");
}
