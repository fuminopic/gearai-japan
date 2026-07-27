import {
  ChevronRight,
  KeyRound,
  LogOut,
  ShieldCheck,
  UserRound
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { AccountDeleteButton } from "@/components/account-delete-button";
import { AppMenuDrawer } from "@/components/app-menu-drawer";
import { ProfileEditLauncher } from "@/components/profile-edit-launcher";
import { Notice } from "@/components/ui/notice";
import { signOut } from "@/lib/actions/auth";
import {
  getProfileAvatarSignedUrl,
  getProfileDetails,
  getStoredProfileAvatarPath
} from "@/lib/data/profile";
import { requireUser } from "@/lib/data/gear";
import {
  AGE_RANGE_OPTIONS,
  FAVORITE_REGION_OPTIONS,
  GENDER_OPTIONS,
  MOUNTAINEERING_EXPERIENCE_OPTIONS,
  MOUNTAINEERING_GENRE_OPTIONS,
  USUAL_TRIP_STYLE_OPTIONS,
  getMetadataString,
  getProfileOptionValue,
  getProfileOptionValueFromArray
} from "@/lib/profile-options";

type ProfilePageProps = {
  searchParams: Promise<{
    error?: string;
    saved?: string;
  }>;
};

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const [{ error, saved }, { supabase, user }] = await Promise.all([
    searchParams,
    requireUser()
  ]);
  const savedMessage = getSavedMessage(saved);
  const metadata = user.user_metadata;
  const displayName = getDisplayName(user.email, metadata);
  const insuranceStatus = getMetadataString(metadata, "mountain_insurance_status");
  const insuranceProvider = getMetadataString(metadata, "mountain_insurance_provider");
  const insuranceExpiresOn = getMetadataString(metadata, "mountain_insurance_expires_on");
  const hasInsurance = insuranceStatus === "active";
  const profile = await getProfileDetails(supabase, user.id);
  const avatarUrl = await getProfileAvatarSignedUrl(supabase, user.id, metadata, profile);

  // ホーム/ギアと同じ骨格。バンド safe+150 / カード -51 → カード上端 safe+99 で
  // 他タブと一致する。eyebrow と 34px の見出しは、カード内 16px の見出しに置き換え。
  return (
    <main className="profile-redesign brand-shell min-h-screen bg-[#E5EBE9] pb-32 text-ink">
      <header
        className="relative z-10 flex w-full items-start justify-between bg-gradient-to-br from-[#1F7950] to-[#81AB44] px-4 pt-[max(env(safe-area-inset-top),20px)]"
        style={{ minHeight: "calc(max(env(safe-area-inset-top), 20px) + 150px)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/yamajitaku-wordmark-white.png"
          alt="山支度 YAMAJITAKU"
          className="mt-[42px] h-10 w-auto select-none object-contain"
        />
        <AppMenuDrawer buttonClassName="-mr-2 mt-[42px] inline-flex h-10 w-10 items-center justify-center rounded-xl text-white transition-transform active:scale-95" />
      </header>

      <div className="relative z-20 mx-auto -mt-[51px] max-w-2xl space-y-[11px] px-4">
      {savedMessage && !error ? (
        <Notice tone="success" className="border border-forest-100">
          {savedMessage}
        </Notice>
      ) : null}
      <section className="rounded-[20px] bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between border-b border-[#EEEDE6] pb-3">
          <h1 className="text-base font-bold">マイページ</h1>
        </div>
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-forest-50 text-xl font-bold text-[#14724e]">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="プロフィール画像" className="h-full w-full object-cover" />
            ) : (
              <UserRound aria-hidden className="h-8 w-8" />
            )}
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

        <ProfileEditLauncher
          email={user.email ?? ""}
          displayName={displayName}
          hasAvatar={Boolean(getStoredProfileAvatarPath(profile, user.id, metadata))}
          gender={getProfileOptionValue(profile?.gender, metadata, "profile_gender", GENDER_OPTIONS)}
          ageRange={getProfileOptionValue(profile?.ageRange, metadata, "profile_age_range", AGE_RANGE_OPTIONS)}
          mountaineeringExperience={getProfileOptionValue(
            profile?.mountaineeringExperience,
            metadata,
            "mountaineering_experience",
            MOUNTAINEERING_EXPERIENCE_OPTIONS
          )}
          mountaineeringGenre={getProfileOptionValueFromArray(
            profile?.mountaineeringGenres,
            metadata,
            "mountaineering_genres",
            MOUNTAINEERING_GENRE_OPTIONS
          )}
          usualTripStyle={getProfileOptionValueFromArray(
            profile?.usualTripStyles,
            metadata,
            "usual_trip_styles",
            USUAL_TRIP_STYLE_OPTIONS
          )}
          favoriteRegion={getProfileOptionValueFromArray(
            profile?.favoriteRegions,
            metadata,
            "favorite_regions",
            FAVORITE_REGION_OPTIONS
          )}
        />
      </section>

      <Link
        href={"/profile/insurance" as Route}
        className="block rounded-[20px] bg-white p-5 shadow-sm transition active:scale-[0.99]"
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

      <section className="rounded-[20px] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold tracking-normal text-ink">アカウント</h2>
        {error ? (
          <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold leading-relaxed text-red-700">
            {error}
          </p>
        ) : null}
        <div className="mt-4 rounded-2xl bg-stone-50 px-4 py-3">
          <p className="text-xs font-bold text-stone-500">メールアドレス</p>
          <p className="mt-1 truncate text-sm font-semibold text-stone-800">
            {user.email}
          </p>
        </div>
        <Link
          href={"/profile/password" as Route}
          className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 text-sm font-bold text-stone-700 transition active:scale-[0.98]"
        >
          <KeyRound aria-hidden className="h-4 w-4" />
          パスワード管理
        </Link>
        <form action={signOut} className="mt-3">
          <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 text-sm font-bold text-stone-700 transition active:scale-[0.98]">
            <LogOut aria-hidden className="h-4 w-4" />
            ログアウト
          </button>
        </form>
        <AccountDeleteButton />
      </section>
      </div>
    </main>
  );
}

function getSavedMessage(value?: string) {
  if (value === "profile") {
    return "プロフィールを更新しました";
  }

  if (value === "insurance") {
    return "保険情報を更新しました";
  }

  return "";
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
