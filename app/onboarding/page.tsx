import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { OnboardingCarousel } from "@/components/onboarding-carousel";
import { AuthValidationError, requireUser } from "@/lib/data/gear";

// 新規ユーザー向けオンボーディング。
// (app) グループの外に置くことで AppNav / 下部ナビ無しの全画面表示にする。
// 自動表示の判定は /dashboard 側(shouldAutoShowOnboarding)が担当し、
// このページ自体はログイン済みであれば表示できる(再閲覧しても状態は壊れない)。

export const metadata: Metadata = {
  title: "はじめに"
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OnboardingPage() {
  try {
    await requireUser();
  } catch (caught) {
    if (caught instanceof AuthValidationError) {
      // 一時的な認証確認エラー: リトライUIを持つ /dashboard に委ねる
      // (オンボーディングはここで無理に表示しない)。
      redirect("/dashboard");
    }
    throw caught;
  }

  return <OnboardingCarousel />;
}
