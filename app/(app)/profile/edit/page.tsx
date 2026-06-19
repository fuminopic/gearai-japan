import {
  ArrowLeft,
  ChevronDown,
  ShieldCheck,
  UserRound
} from "lucide-react";
import Link from "next/link";

import { updateProfile } from "@/lib/actions/auth";
import { requireUser } from "@/lib/data/gear";

type ProfileEditPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

const insuranceStatusOptions = [
  { value: "unknown", label: "未登録" },
  { value: "active", label: "加入済み" },
  { value: "none", label: "未加入" }
];

export default async function ProfileEditPage({
  searchParams
}: ProfileEditPageProps) {
  const [{ user }, params] = await Promise.all([requireUser(), searchParams]);
  const metadata = user.user_metadata;
  const displayName = getDisplayName(user.email, metadata);

  return (
    <form action={updateProfile} className="mx-auto max-w-2xl space-y-5 pb-24">
      <section className="flex items-center gap-3">
        <Link
          href="/profile"
          aria-label="マイページへ戻る"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-stone-800 shadow-sm transition active:scale-95"
        >
          <ArrowLeft aria-hidden className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[#14724e]">マイページ</p>
          <h1 className="text-[30px] font-bold leading-tight tracking-normal text-ink">
            プロフィール設定
          </h1>
        </div>
        <button className="h-11 shrink-0 rounded-xl bg-[#14724e] px-4 text-sm font-bold text-white shadow-sm transition active:scale-95">
          保存
        </button>
      </section>

      {params.error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {params.error}
        </p>
      ) : null}

      <ProfileSection
        title="基本情報"
        description="アプリ内で表示する名前とメモです。"
        icon={UserRound}
      >
        <ProfileField
          label="表示名"
          name="display_name"
          defaultValue={displayName}
          placeholder="例：Fumi"
        />
        <ProfileTextArea
          label="メモ"
          name="self_introduction"
          defaultValue={getMetadataString(metadata, "self_introduction")}
          placeholder="準備時に残しておきたいメモ"
        />
        <ProfileStaticRow label="メールアドレス" value={user.email ?? ""} />
      </ProfileSection>

      <ProfileSection
        id="insurance"
        title="山岳保険"
        description="出発前に確認する保険情報を登録します。"
        icon={ShieldCheck}
      >
        <ProfileSelect
          label="加入状況"
          name="mountain_insurance_status"
          defaultValue={getMetadataString(metadata, "mountain_insurance_status") || "unknown"}
          options={insuranceStatusOptions}
        />
        <ProfileField
          label="保険名"
          name="mountain_insurance_provider"
          defaultValue={getMetadataString(metadata, "mountain_insurance_provider")}
          placeholder="例：やまきふ共済会 山岳保険"
        />
        <ProfileField
          label="有効期限"
          name="mountain_insurance_expires_on"
          type="date"
          defaultValue={getMetadataString(metadata, "mountain_insurance_expires_on")}
        />
      </ProfileSection>

      <button className="sticky bottom-24 z-20 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#14724e] text-base font-bold text-white shadow-lg shadow-forest-900/10 transition active:scale-[0.99] md:static">
        保存する
      </button>
    </form>
  );
}

function ProfileSection({
  id,
  title,
  description,
  icon: Icon,
  children
}: {
  id?: string;
  title: string;
  description: string;
  icon: typeof UserRound;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="overflow-hidden rounded-[22px] bg-white shadow-soft">
      <div className="flex gap-3 border-b border-stone-100 px-5 py-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-forest-50 text-[#14724e]">
          <Icon aria-hidden className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-bold tracking-normal text-ink">{title}</h2>
          <p className="mt-1 text-sm font-semibold leading-relaxed text-stone-500">
            {description}
          </p>
        </div>
      </div>
      <div className="divide-y divide-stone-100">{children}</div>
    </section>
  );
}

function ProfileField({
  label,
  name,
  defaultValue,
  placeholder,
  type = "text"
}: {
  label: string;
  name: string;
  defaultValue: string;
  placeholder?: string;
  type?: "text" | "date";
}) {
  return (
    <label className="block px-4 py-4 sm:grid sm:grid-cols-[160px_minmax(0,1fr)] sm:items-center sm:gap-4">
      <span className="text-sm font-bold text-ink">{label}</span>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="mt-2 h-11 w-full min-w-0 rounded-xl border border-stone-200 bg-stone-50 px-3 text-base font-semibold text-stone-800 outline-none placeholder:text-stone-300 focus:border-[#14724e] focus:bg-white sm:mt-0 sm:text-sm"
      />
    </label>
  );
}

function ProfileSelect({
  label,
  name,
  defaultValue,
  options
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="block px-4 py-4 sm:grid sm:grid-cols-[160px_minmax(0,1fr)] sm:items-center sm:gap-4">
      <span className="text-sm font-bold text-ink">{label}</span>
      <span className="relative mt-2 block sm:mt-0">
        <select
          name={name}
          defaultValue={defaultValue}
          className="h-11 w-full appearance-none rounded-xl border border-stone-200 bg-stone-50 px-3 pr-10 text-base font-semibold text-stone-800 outline-none focus:border-[#14724e] focus:bg-white sm:text-sm"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500"
        />
      </span>
    </label>
  );
}

function ProfileTextArea({
  label,
  name,
  defaultValue,
  placeholder
}: {
  label: string;
  name: string;
  defaultValue: string;
  placeholder?: string;
}) {
  return (
    <label className="block px-4 py-4">
      <span className="text-sm font-bold text-ink">{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        rows={3}
        className="mt-2 w-full resize-none rounded-xl border border-stone-200 bg-stone-50 px-3 py-3 text-base font-semibold text-stone-800 outline-none placeholder:text-stone-300 focus:border-[#14724e] focus:bg-white sm:text-sm"
      />
    </label>
  );
}

function ProfileStaticRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="block px-4 py-4 sm:grid sm:grid-cols-[160px_minmax(0,1fr)] sm:items-center sm:gap-4">
      <span className="text-sm font-bold text-ink">{label}</span>
      <span className="mt-1 block truncate text-sm font-semibold text-stone-500 sm:mt-0">
        {value}
      </span>
    </div>
  );
}

function getDisplayName(
  email: string | undefined,
  metadata: Record<string, unknown> | null | undefined
) {
  return (
    getMetadataString(metadata, "display_name") ||
    email?.split("@")[0] ||
    ""
  );
}

function getMetadataString(
  metadata: Record<string, unknown> | null | undefined,
  key: string
) {
  const value = metadata?.[key];
  return typeof value === "string" ? value : "";
}
