import { ArrowLeft, HelpCircle, UserRound } from "lucide-react";
import Link from "next/link";

import { updateProfile } from "@/lib/actions/auth";
import { requireUser } from "@/lib/data/gear";

type ProfileEditPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function ProfileEditPage({
  searchParams
}: ProfileEditPageProps) {
  const [{ user }, params] = await Promise.all([requireUser(), searchParams]);
  const metadata = user.user_metadata;

  return (
    <form action={updateProfile} className="space-y-5 pb-24">
      <section className="flex items-center justify-between gap-3">
        <Link
          href="/profile"
          aria-label="マイページへ戻る"
          className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-stone-800 shadow-sm transition active:scale-95"
        >
          <ArrowLeft aria-hidden className="h-5 w-5" />
        </Link>
        <h1 className="flex-1 text-[26px] font-bold tracking-normal text-ink">
          プロフィール設定
        </h1>
        <button
          type="button"
          aria-label="ヘルプ"
          className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-stone-800 shadow-sm"
        >
          <HelpCircle aria-hidden className="h-5 w-5" />
        </button>
        <button className="h-12 rounded-full bg-stone-800 px-5 text-base font-bold text-white shadow-sm transition active:scale-95">
          保存
        </button>
      </section>

      {params.error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {params.error}
        </p>
      ) : null}

      <section className="overflow-hidden rounded-[24px] bg-white shadow-soft">
        <div className="relative h-40 bg-stone-200">
          <div className="absolute inset-0 bg-[url('/generic-hills.jpg')] bg-cover bg-center opacity-45 grayscale" />
          <div className="absolute inset-0 flex items-center justify-center text-white">
            <span className="rounded-full bg-white/30 px-4 py-2 text-sm font-bold backdrop-blur">
              カバー画像
            </span>
          </div>
        </div>
        <div className="px-5 pb-5">
          <div className="-mt-10 flex h-20 w-20 items-center justify-center rounded-[22px] border-4 border-white bg-stone-100 text-stone-400 shadow-sm">
            <UserRound aria-hidden className="h-10 w-10" />
          </div>
          <p className="mt-3 text-sm font-bold text-stone-600">
            {getUserHandle(user.email, metadata)}
          </p>
          <ProfileField
            label="ニックネーム"
            name="display_name"
            defaultValue={getDisplayName(user.email, metadata)}
          />
          <ProfileTextArea
            label="自己紹介"
            name="self_introduction"
            defaultValue={getMetadataString(metadata, "self_introduction")}
            placeholder="登山歴、好きな山、山行スタイルなど"
          />
        </div>
      </section>

      <ProfileSection id="emergency" title="遭難時の対策">
        <ProfileField
          label="携帯電話番号（非公開）"
          name="emergency_phone"
          defaultValue={getMetadataString(metadata, "emergency_phone")}
          placeholder="090-0000-0000"
        />
        <p className="px-4 pb-4 text-xs font-semibold leading-relaxed text-stone-500">
          遭難時にあなたを見つける手掛かりになります。アプリ内では公開されません。
        </p>
      </ProfileSection>

      <ProfileSection title="メールアドレス">
        <ProfileStaticRow label="メールアドレス" value={user.email ?? ""} />
      </ProfileSection>

      <ProfileSection title="プロフィール">
        <ProfileField
          label="現住所（都道府県）"
          name="residence_prefecture"
          defaultValue={getMetadataString(metadata, "residence_prefecture")}
        />
        <ProfileField
          label="現住所（市郡）"
          name="residence_city"
          defaultValue={getMetadataString(metadata, "residence_city")}
        />
        <ProfileField
          label="性別"
          name="gender"
          defaultValue={getMetadataString(metadata, "gender")}
        />
        <ProfileField
          label="生年月日（非公開）"
          name="birth_date"
          type="date"
          defaultValue={getMetadataString(metadata, "birth_date")}
        />
        <ProfileField
          label="山以外の趣味"
          name="outdoor_interests"
          defaultValue={getMetadataString(metadata, "outdoor_interests")}
        />
        <ProfileField
          label="職業"
          name="occupation"
          defaultValue={getMetadataString(metadata, "occupation")}
        />
        <ProfileField
          label="ホームページ"
          name="homepage"
          defaultValue={getMetadataString(metadata, "homepage")}
          placeholder="https://"
        />
      </ProfileSection>
    </form>
  );
}

function ProfileSection({
  id,
  title,
  children
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="overflow-hidden rounded-[18px] bg-white shadow-sm">
      <h2 className="bg-stone-100 px-4 py-3 text-sm font-bold text-stone-500">
        {title}
      </h2>
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
    <label className="grid grid-cols-[minmax(116px,0.9fr)_minmax(0,1.1fr)] items-center gap-3 px-4 py-4">
      <span className="text-sm font-bold text-ink">{label}</span>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="min-w-0 bg-transparent text-right text-sm font-semibold text-stone-600 outline-none placeholder:text-stone-300"
      />
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
    <label className="block border-t border-stone-100 px-4 py-4">
      <span className="text-sm font-bold text-ink">{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        rows={3}
        className="mt-2 w-full resize-none rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-semibold text-stone-700 outline-none placeholder:text-stone-300 focus:border-[#14724e] focus:bg-white"
      />
    </label>
  );
}

function ProfileStaticRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[minmax(116px,0.9fr)_minmax(0,1.1fr)] items-center gap-3 px-4 py-4">
      <span className="text-sm font-bold text-ink">{label}</span>
      <span className="truncate text-right text-sm font-semibold text-stone-500">
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
    getMetadataString(metadata, "name") ||
    email?.split("@")[0] ||
    ""
  );
}

function getUserHandle(
  email: string | undefined,
  metadata: Record<string, unknown> | null | undefined
) {
  const base =
    getMetadataString(metadata, "display_name") ||
    email?.split("@")[0] ||
    "yamajitaku";

  return `@${base.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 18) || "yamajitaku"}`;
}

function getMetadataString(
  metadata: Record<string, unknown> | null | undefined,
  key: string
) {
  const value = metadata?.[key];
  return typeof value === "string" ? value : "";
}
