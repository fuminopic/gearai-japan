import {
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  Edit3,
  LogOut,
  MapPin,
  Mountain,
  Phone,
  ShieldCheck,
  SlidersHorizontal,
  UserRound
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { signOut } from "@/lib/actions/auth";
import { requireUser } from "@/lib/data/gear";

const PROFILE_GREEN = "#14724e";

export default async function ProfilePage() {
  const { user } = await requireUser();
  const metadata = user.user_metadata;
  const displayName = getDisplayName(user.email, metadata);
  const mobilePhone = getFirstMetadataString(metadata, ["mobile_phone", "emergency_phone"]);
  const emergencyContactName = getMetadataString(metadata, "emergency_contact_name");
  const emergencyContactPhone = getMetadataString(metadata, "emergency_contact_phone");
  const insuranceStatus = getMetadataString(metadata, "mountain_insurance_status");
  const insuranceProvider = getMetadataString(metadata, "mountain_insurance_provider");
  const insuranceExpiresOn = getMetadataString(metadata, "mountain_insurance_expires_on");
  const rescueServiceName = getMetadataString(metadata, "rescue_service_name");
  const homeArea = getMetadataString(metadata, "home_area");
  const defaultTripStyle = getMetadataString(metadata, "default_trip_style");
  const hikingExperience = getMetadataString(metadata, "hiking_experience");
  const hikingPace = getMetadataString(metadata, "hiking_pace");
  const isBasicReady = Boolean(displayName && (homeArea || hikingExperience));
  const isEmergencyReady = Boolean(mobilePhone && emergencyContactPhone);
  const isInsuranceReady = insuranceStatus === "active";
  const readyCount = [isBasicReady, isEmergencyReady, isInsuranceReady].filter(Boolean).length;

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

        <Link
          href="/profile/edit"
          className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#14724e] px-4 text-sm font-bold text-white transition active:scale-[0.98]"
        >
          <Edit3 aria-hidden className="h-4 w-4" />
          プロフィール設定を編集
        </Link>
      </section>

      <section className="rounded-[22px] bg-white p-5 shadow-soft">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-stone-500">山行前の登録状況</p>
            <h2 className="mt-1 text-2xl font-bold tracking-normal text-ink">
              {readyCount}/3 完了
            </h2>
          </div>
          <span
            className={`rounded-xl px-3 py-1.5 text-sm font-bold ${
              readyCount === 3
                ? "bg-forest-50 text-[#14724e]"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {readyCount === 3 ? "準備OK" : `${3 - readyCount}件 未登録`}
          </span>
        </div>

        <div className="mt-4 space-y-2">
          <ReadinessRow
            ready={isBasicReady}
            label="基本情報"
            value={homeArea || hikingExperience || "主な山域・経験を登録"}
          />
          <ReadinessRow
            ready={isEmergencyReady}
            label="緊急連絡"
            value={isEmergencyReady ? "連絡先登録済み" : "本人電話・緊急連絡先を登録"}
          />
          <ReadinessRow
            ready={isInsuranceReady}
            label="山岳保険"
            value={
              isInsuranceReady
                ? insuranceProvider || "加入済み"
                : "加入状況を登録"
            }
          />
        </div>
      </section>

      <ProfileLinkCard
        href={"/profile/edit#safety" as Route}
        icon={ShieldCheck}
        title="保険・遭難時の対策"
        description="緊急時に必要な連絡先と保険情報をまとめます。"
      >
        <InfoLine
          icon={Phone}
          label="緊急連絡"
          value={isEmergencyReady ? "登録済み" : "未登録"}
          active={isEmergencyReady}
        />
        <InfoLine
          icon={ShieldCheck}
          label="山岳保険"
          value={formatInsuranceSummary(
            insuranceStatus,
            insuranceProvider,
            insuranceExpiresOn
          )}
          active={isInsuranceReady}
        />
        {rescueServiceName ? (
          <InfoLine
            icon={CircleAlert}
            label="遭難対策サービス"
            value={rescueServiceName}
            active
          />
        ) : null}
      </ProfileLinkCard>

      <ProfileLinkCard
        href="/profile/edit#preferences"
        icon={SlidersHorizontal}
        title="登山の初期設定"
        description="よく行く山域や山行スタイルを登録しておけます。"
      >
        <InfoLine
          icon={MapPin}
          label="主な山域"
          value={homeArea || "未設定"}
          active={Boolean(homeArea)}
        />
        <InfoLine
          icon={Mountain}
          label="山行スタイル"
          value={defaultTripStyle || "未設定"}
          active={Boolean(defaultTripStyle)}
        />
        <InfoLine
          icon={ClipboardCheck}
          label="経験・ペース"
          value={[hikingExperience, hikingPace].filter(Boolean).join(" / ") || "未設定"}
          active={Boolean(hikingExperience || hikingPace)}
        />
      </ProfileLinkCard>

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

function ReadinessRow({
  ready,
  label,
  value
}: {
  ready: boolean;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-stone-50 px-3 py-3">
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
          ready ? "bg-[#14724e] text-white" : "bg-stone-200 text-stone-500"
        }`}
      >
        {ready ? <CheckMark /> : <span className="h-2 w-2 rounded-full bg-current" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-ink">{label}</p>
        <p className="mt-0.5 truncate text-xs font-semibold text-stone-500">{value}</p>
      </div>
    </div>
  );
}

function ProfileLinkCard({
  href,
  icon: Icon,
  title,
  description,
  children
}: {
  href: Route;
  icon: typeof ShieldCheck;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="block rounded-[22px] bg-white p-5 shadow-soft transition active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-forest-50 text-[#14724e]">
            <Icon aria-hidden className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-bold tracking-normal text-ink">{title}</h2>
            <p className="mt-1 text-sm font-semibold leading-relaxed text-stone-500">
              {description}
            </p>
          </div>
        </div>
        <ChevronRight aria-hidden className="mt-2 h-5 w-5 shrink-0 text-stone-400" />
      </div>
      <div className="mt-4 space-y-2">{children}</div>
    </Link>
  );
}

function InfoLine({
  icon: Icon,
  label,
  value,
  active
}: {
  icon: typeof Phone;
  label: string;
  value: string;
  active: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-stone-50 px-3 py-2.5">
      <Icon
        aria-hidden
        className={`h-4 w-4 shrink-0 ${active ? "text-[#14724e]" : "text-stone-400"}`}
      />
      <span className="min-w-0 flex-1 text-sm font-bold text-stone-700">{label}</span>
      <span
        className={`max-w-[48%] truncate text-right text-sm font-bold ${
          active ? "text-[#14724e]" : "text-stone-400"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function CheckMark() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="h-3.5 w-3.5">
      <path
        d="M3.2 8.1 6.5 11.2 12.8 4.8"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.2"
      />
    </svg>
  );
}

function formatInsuranceSummary(
  status: string,
  provider: string,
  expiresOn: string
) {
  if (status !== "active") {
    return "未登録";
  }

  if (provider && expiresOn) {
    return `${provider} / ${expiresOn}`;
  }

  return provider || "加入済み";
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

function getFirstMetadataString(
  metadata: Record<string, unknown> | null | undefined,
  keys: string[]
) {
  for (const key of keys) {
    const value = getMetadataString(metadata, key);
    if (value) {
      return value;
    }
  }

  return "";
}

function getMetadataString(
  metadata: Record<string, unknown> | null | undefined,
  key: string
) {
  const value = metadata?.[key];
  return typeof value === "string" ? value : "";
}
