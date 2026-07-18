// 新規ユーザー向けオンボーディングの表示判定。
//
// 保存先は Supabase auth の user_metadata（`auth.updateUser`）。プロフィール編集や
// 山岳保険と同じ既存機構であり、DB スキーマ変更・migration・Auth 構成変更は不要。
// サーバー側に保存されるため、再ログイン・別端末・Web / iOS WebView で状態が一致する。
//
// 既存ユーザー保護:
// この機能より前に作成されたアカウントには metadata フラグが存在しない。そのため
// 「フラグ無し = 未見」とだけ判定すると既存ユーザー全員に強制表示されてしまう。
// これを避けるため、機能導入基線（ONBOARDING_LAUNCH_ISO）以降に作成された
// アカウントのみを自動表示の対象にする。判定不能な場合は表示しない（fail-safe）。

export const ONBOARDING_STATE_METADATA_KEY = "onboarding_state";
export const ONBOARDING_FINISHED_AT_METADATA_KEY = "onboarding_finished_at";

/** オンボーディング機能の導入基線。これより前に作成されたアカウントには表示しない。 */
export const ONBOARDING_LAUNCH_ISO = "2026-07-18T00:00:00.000Z";

/** 完了（最後まで見た）/ スキップ。どちらの場合も以後は自動表示しない。 */
export type OnboardingState = "completed" | "skipped";

export function isOnboardingState(value: unknown): value is OnboardingState {
  return value === "completed" || value === "skipped";
}

/** metadata にオンボーディング終了記録（完了またはスキップ）があるか。 */
export function hasFinishedOnboarding(
  metadata: Record<string, unknown> | null | undefined
): boolean {
  return isOnboardingState(metadata?.[ONBOARDING_STATE_METADATA_KEY]);
}

/**
 * ダッシュボード入場時にオンボーディングへ自動リダイレクトすべきか。
 *
 * true になるのは「導入基線以降に作成されたアカウント」かつ「終了記録が無い」
 * 場合のみ。created_at が欠落・不正でアカウントの新旧を判定できないときは、
 * 既存ユーザーへの誤表示を避けるため false を返す。
 */
export function shouldAutoShowOnboarding(input: {
  createdAt: string | null | undefined;
  metadata: Record<string, unknown> | null | undefined;
}): boolean {
  if (hasFinishedOnboarding(input.metadata)) {
    return false;
  }

  if (typeof input.createdAt !== "string" || input.createdAt.length === 0) {
    return false;
  }

  const createdAtMs = Date.parse(input.createdAt);
  if (Number.isNaN(createdAtMs)) {
    return false;
  }

  return createdAtMs >= Date.parse(ONBOARDING_LAUNCH_ISO);
}
