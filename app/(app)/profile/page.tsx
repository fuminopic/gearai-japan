import {
  BarChart3,
  ChevronRight,
  Edit3,
  Map,
  MessageSquare,
  QrCode,
  Settings,
  ShieldCheck,
  UserRound,
  type LucideIcon
} from "lucide-react";

import { getDashboardSummary } from "@/lib/data/dashboard";
import { requireUser } from "@/lib/data/gear";
import { getTripPlans } from "@/lib/data/trip-plans";

export default async function ProfilePage() {
  const [{ user }, plans, summary] = await Promise.all([
    requireUser(),
    getTripPlans(),
    getDashboardSummary()
  ]);
  const displayName = getDisplayName(user.email, user.user_metadata);
  const userHandle = getUserHandle(user.email);
  const insurancePlan = plans.find((plan) => plan.has_mountain_insurance);

  return (
    <div className="space-y-5 pb-24">
      <section className="overflow-hidden rounded-[24px] bg-white shadow-soft">
        <div className="relative h-36 bg-stone-200">
          <div className="absolute inset-0 bg-[url('/generic-hills.jpg')] bg-cover bg-center opacity-45 grayscale" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-stone-900/15" />
          <button
            type="button"
            aria-label="設定"
            className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/75 text-white shadow-sm"
          >
            <Settings aria-hidden className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 pb-5">
          <div className="-mt-10 flex items-start justify-between gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-[22px] border-4 border-white bg-stone-100 text-stone-400 shadow-sm">
              <UserRound aria-hidden className="h-10 w-10" />
            </div>
            <button
              type="button"
              className="mt-3 inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-bold text-stone-800 shadow-sm"
            >
              <Edit3 aria-hidden className="h-4 w-4" />
              プロフィール編集
            </button>
          </div>

          <h1 className="mt-4 text-[34px] font-bold leading-tight tracking-normal text-ink">
            {displayName}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm font-semibold text-stone-500">
            <span>{userHandle}</span>
            <span className="rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5 text-xs text-stone-500">
              Standard
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <ProfileAction icon={QrCode} label="QRコード" />
            <ProfileAction icon={MessageSquare} label="メッセージ" />
          </div>
        </div>
      </section>

      <section className="rounded-[22px] bg-stone-100 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck aria-hidden className="h-5 w-5 text-[#14724e]" />
              <h2 className="text-lg font-bold tracking-normal text-ink">保険</h2>
            </div>
            <p className="mt-2 text-sm font-semibold text-stone-700">
              山岳保険・遭難対策サービス
            </p>
          </div>
          <ChevronRight aria-hidden className="mt-1 h-5 w-5 text-stone-500" />
        </div>

        {insurancePlan ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm font-semibold">
            <span className="rounded-lg bg-[#14724e] px-3 py-1.5 text-white">
              登録済み
            </span>
            <span className="text-stone-600">{insurancePlan.mountain_name} の計画で確認済み</span>
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm font-semibold">
            <span className="rounded-lg bg-amber-300 px-3 py-1.5 text-stone-900">
              未登録
            </span>
            <span className="text-stone-600">保険情報を確認しておくと安心です</span>
          </div>
        )}
      </section>

      <section className="rounded-[22px] border border-stone-200 bg-white p-5 shadow-soft">
        <div className="flex items-center gap-2">
          <BarChart3 aria-hidden className="h-5 w-5 text-ink" />
          <h2 className="text-lg font-bold tracking-normal text-ink">ダッシュボード</h2>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          <ProfileMetric value={plans.length.toLocaleString("ja-JP")} label="保存した計画" />
          <ProfileMetric value={summary.ownedCount.toLocaleString("ja-JP")} label="登録装備" />
          <ProfileMetric
            value={`${summary.majorCategoryCoverageCount}/${summary.majorCategoryTotalCount}`}
            label="主要カテゴリー"
          />
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-normal text-ink">山行記録</h2>
          <button
            type="button"
            className="rounded-full bg-stone-100 px-4 py-2 text-sm font-bold text-[#14724e]"
          >
            もっと見る
          </button>
        </div>
        <div className="mt-4 rounded-[18px] bg-[#6ad2b4] px-5 py-8 text-center text-white shadow-sm">
          <Map aria-hidden className="mx-auto h-7 w-7" />
          <p className="mt-3 text-sm font-bold">まだ山行記録がありません</p>
          <p className="mt-1 text-2xl font-bold tracking-normal">
            山行記録の作り方を見る
          </p>
        </div>
      </section>
    </div>
  );
}

function ProfileAction({
  icon: Icon,
  label
}: {
  icon: LucideIcon;
  label: string;
}) {
  return (
    <button
      type="button"
      className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2.5 text-sm font-bold text-stone-800"
    >
      <Icon aria-hidden className="h-4 w-4" />
      {label}
    </button>
  );
}

function ProfileMetric({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-[28px] font-bold leading-none tracking-normal text-ink">
        {value}
      </p>
      <p className="mt-2 text-xs font-semibold text-stone-500">{label}</p>
    </div>
  );
}

function getDisplayName(
  email: string | undefined,
  metadata: Record<string, unknown> | null | undefined
) {
  const metadataName =
    typeof metadata?.name === "string"
      ? metadata.name
      : typeof metadata?.display_name === "string"
        ? metadata.display_name
        : null;

  if (metadataName) {
    return metadataName;
  }

  return email?.split("@")[0] || "YAMAJITAKU USER";
}

function getUserHandle(email: string | undefined) {
  const base = email?.split("@")[0] || "yamajitaku";
  return `@${base.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 18) || "yamajitaku"}`;
}
