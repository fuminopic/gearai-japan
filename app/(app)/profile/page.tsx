import {
  ChevronRight,
  Edit3,
  LogOut,
  ShieldCheck,
  UserRound
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { signOut } from "@/lib/actions/auth";
import { requireUser } from "@/lib/data/gear";

export default async function ProfilePage() {
  const { user } = await requireUser();
  const metadata = user.user_metadata;
  const displayName = getDisplayName(user.email, metadata);
  const profileMemo = getMetadataString(metadata, "self_introduction");
  const insuranceStatus = getMetadataString(metadata, "mountain_insurance_status");
  const insuranceProvider = getMetadataString(metadata, "mountain_insurance_provider");
  const insuranceExpiresOn = getMetadataString(metadata, "mountain_insurance_expires_on");
  const hasInsurance = insuranceStatus === "active";

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <section>
        <p className="text-sm font-bold text-[#14724e]">アカウント</p>
        <h1 className="mt-1 text-[34px] font-bold leading-tight tracking-normal text-ink">
          マイページ
        </h1>
      </section>

      <section className="rounded-[22px] bg-white p-5 shadow-soft">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-forest-50 text-[#14724e]">
            <UserRound aria-hidden className="h-8 w-8" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-2xl font-bold leading-tight tracking-normal text-ink">
              {displayName}
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-stone-500">
              {user.email}
            </p>
          </div>
        </div>

        {profileMemo ? (
          <p className="mt-4 rounded-2xl bg-stone-50 px-4 py-3 text-sm font-semibold leading-relaxed text-stone-600">
            {profileMemo}
          </p>
        ) : null}

        <Link
          href="/profile/edit"
          className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#14724e] px-4 text-sm font-bold text-white transition active:scale-[0.98]"
        >
          <Edit3 aria-hidden className="h-4 w-4" />
          プロフィールを編集
        </Link>
      </section>

      <Link
        href={"/profile/insurance" as Route}
        className="block rounded-[22px] bg-white p-5 shadow-soft transition active:scale-[0.99]"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-forest-50 text-[#14724e]">
              <ShieldCheck aria-hidden className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-bold tracking-normal text-ink">保険</h2>
              <p className="mt-1 text-sm font-semibold leading-relaxed text-stone-500">
                山岳保険のご案内、保険情報の入力
              </p>
            </div>
          </div>
          <ChevronRight aria-hidden className="mt-2 h-5 w-5 shrink-0 text-stone-400" />
        </div>

        <div className="mt-4 rounded-2xl bg-stone-50 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-bold text-stone-700">登録状況</span>
            <span
              className={`rounded-lg px-3 py-1 text-sm font-bold ${
                hasInsurance
                  ? "bg-forest-50 text-[#14724e]"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {hasInsurance ? "契約済み" : "未加入"}
            </span>
          </div>
          {hasInsurance ? (
            <p className="mt-2 text-sm font-semibold text-stone-600">
              {formatInsuranceSummary(insuranceProvider, insuranceExpiresOn)}
            </p>
          ) : null}
        </div>
      </Link>

      <section className="rounded-[22px] bg-white p-5 shadow-soft">
        <h2 className="text-lg font-bold tracking-normal text-ink">アカウント</h2>
        <div className="mt-4 rounded-2xl bg-stone-50 px-4 py-3">
          <p className="text-xs font-bold text-stone-500">メールアドレス</p>
          <p className="mt-1 truncate text-sm font-semibold text-stone-800">
            {user.email}
          </p>
        </div>
        <form action={signOut} className="mt-3">
          <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 text-sm font-bold text-stone-700 transition active:scale-[0.98]">
            <LogOut aria-hidden className="h-4 w-4" />
            ログアウト
          </button>
        </form>
      </section>
    </div>
  );
}

function formatInsuranceSummary(provider: string, expiresOn: string) {
  if (provider && expiresOn) {
    return `${provider} / ${expiresOn}`;
  }

  return provider || "保険情報を登録済み";
}

function getDisplayName(
  email: string | undefined,
  metadata: Record<string, unknown> | null | undefined
) {
  return (
    getMetadataString(metadata, "display_name") ||
    email?.split("@")[0] ||
    "YAMAJITAKU USER"
  );
}

function getMetadataString(
  metadata: Record<string, unknown> | null | undefined,
  key: string
) {
  const value = metadata?.[key];
  return typeof value === "string" ? value : "";
}
