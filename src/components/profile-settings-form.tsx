"use client";

import { KeyRound, Loader2, LogOut, Mountain, UserRound, UsersRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";

import { AccountDeleteButton } from "@/components/account-delete-button";
import { ProfileAvatarEditor } from "@/components/profile-avatar-editor";
import { UnsavedChangesGuard } from "@/components/ui/unsaved-changes-guard";
import { signOut, updateProfile, type ProfileActionState } from "@/lib/actions/auth";
import { hapticError, hapticSuccess } from "@/lib/haptics";
import {
  AGE_RANGE_OPTIONS,
  FAVORITE_REGION_MAX,
  FAVORITE_REGION_OPTIONS,
  GENDER_OPTIONS,
  MOUNTAINEERING_EXPERIENCE_OPTIONS,
  MOUNTAINEERING_GENRE_MAX,
  MOUNTAINEERING_GENRE_OPTIONS,
  USUAL_TRIP_STYLE_OPTIONS,
  type ProfileOption
} from "@/lib/profile-options";

const initialProfileActionState: ProfileActionState = { ok: false, message: "" };

type ProfileFieldValues = {
  gender: string;
  ageRange: string;
  mountaineeringExperience: string;
  mountaineeringGenres: string[];
  usualTripStyles: string[];
  favoriteRegions: string[];
};

type ProfileSettingsFormProps = {
  email: string;
  gearCount: number;
  displayName: string;
  selfIntroduction: string;
  initialAvatarUrl: string;
  gender: string;
  ageRange: string;
  mountaineeringExperience: string;
  mountaineeringGenres: string[];
  usualTripStyles: string[];
  favoriteRegions: string[];
};

export function ProfileSettingsForm({
  email,
  gearCount,
  displayName,
  selfIntroduction,
  initialAvatarUrl,
  gender,
  ageRange,
  mountaineeringExperience,
  mountaineeringGenres,
  usualTripStyles,
  favoriteRegions
}: ProfileSettingsFormProps) {
  const [state, formAction, isPending] = useActionState(updateProfile, initialProfileActionState);
  const router = useRouter();
  const [profileValues, setProfileValues] = useState<ProfileFieldValues>(() => ({
    gender,
    ageRange,
    mountaineeringExperience,
    mountaineeringGenres,
    usualTripStyles,
    favoriteRegions
  }));

  useEffect(() => {
    if (!state.message) {
      return;
    }

    if (state.ok && state.profile) {
      // The Server Action returns the database row that actually committed.
      // Do not rebuild these values from stale props or legacy metadata.
      setProfileValues({
        gender: state.profile.gender ?? "",
        ageRange: state.profile.ageRange ?? "",
        mountaineeringExperience: state.profile.mountaineeringExperience ?? "",
        mountaineeringGenres: state.profile.mountaineeringGenres,
        usualTripStyles: state.profile.usualTripStyles,
        favoriteRegions: state.profile.favoriteRegions
      });
      hapticSuccess();
      router.refresh();
    } else {
      hapticError();
    }
  }, [router, state]);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <form action={formAction} className="space-y-4">
        <UnsavedChangesGuard />

        <ProfileSection
          title="基本情報"
          description="アプリ内で表示する名前とメモです。"
          icon={UserRound}
        >
          <ProfileAvatarEditor displayName={displayName} initialAvatarUrl={initialAvatarUrl} />
          <ProfileField
            label="表示名"
            name="display_name"
            defaultValue={displayName}
            placeholder="例：Fumi"
          />
          <ProfileTextArea
            label="メモ"
            name="self_introduction"
            defaultValue={selfIntroduction}
            placeholder="準備時に残しておきたいメモ"
          />
        </ProfileSection>

        <ProfileSection
          title="ユーザー情報（任意）"
          description="統計の参考にします。装備のおすすめには使用しません。"
          icon={UsersRound}
        >
          <ProfileSelect
            label="性別"
            name="profile_gender"
            value={profileValues.gender}
            onValueChange={(value) => setProfileValues((current) => ({ ...current, gender: value }))}
            options={GENDER_OPTIONS}
          />
          <ProfileSelect
            label="年齢層"
            name="profile_age_range"
            value={profileValues.ageRange}
            onValueChange={(value) => setProfileValues((current) => ({ ...current, ageRange: value }))}
            options={AGE_RANGE_OPTIONS}
          />
        </ProfileSection>

        <ProfileSection
          title="登山プロフィール（任意）"
          description="装備リストやおすすめ設定の参考にします。"
          icon={Mountain}
        >
          <ProfileSelect
            label="登山歴"
            name="mountaineering_experience"
            value={profileValues.mountaineeringExperience}
            onValueChange={(value) =>
              setProfileValues((current) => ({ ...current, mountaineeringExperience: value }))
            }
            options={MOUNTAINEERING_EXPERIENCE_OPTIONS}
          />
          <ProfileMultiSelect
            label="主な登山ジャンル"
            name="mountaineering_genres"
            options={MOUNTAINEERING_GENRE_OPTIONS}
            values={profileValues.mountaineeringGenres}
            onValuesChange={(values) =>
              setProfileValues((current) => ({ ...current, mountaineeringGenres: values }))
            }
            max={MOUNTAINEERING_GENRE_MAX}
          />
          <ProfileMultiSelect
            label="普段よくする山行"
            name="usual_trip_styles"
            options={USUAL_TRIP_STYLE_OPTIONS}
            values={profileValues.usualTripStyles}
            onValuesChange={(values) =>
              setProfileValues((current) => ({ ...current, usualTripStyles: values }))
            }
          />
          <ProfileMultiSelect
            label="よく行くエリア"
            name="favorite_regions"
            options={FAVORITE_REGION_OPTIONS}
            values={profileValues.favoriteRegions}
            onValuesChange={(values) =>
              setProfileValues((current) => ({ ...current, favoriteRegions: values }))
            }
            max={FAVORITE_REGION_MAX}
            exclusiveValue="no_preference"
          />
        </ProfileSection>

        {state.message ? (
          <p
            role="status"
            className={`rounded-xl px-4 py-3 text-sm font-semibold ${
              state.ok ? "bg-forest-50 text-[#14724e]" : "bg-red-50 text-red-700"
            }`}
          >
            {state.message}
          </p>
        ) : null}

        <button
          disabled={isPending}
          className="sticky bottom-24 z-20 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#14724e] text-base font-bold text-white shadow-lg shadow-forest-900/10 transition active:scale-[0.99] disabled:opacity-60 md:static"
        >
          {isPending ? <Loader2 aria-hidden className="h-5 w-5 animate-spin" /> : null}
          {isPending ? "保存中..." : "保存する"}
        </button>
      </form>

      <ProfileSection title="アカウント" description="ログインとアカウント管理" icon={KeyRound}>
        <ProfileStaticRow label="メールアドレス" value={email} />
        <Link
          href="/profile/password"
          className="mx-4 my-4 flex h-11 items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 text-sm font-bold text-stone-700 transition active:scale-[0.98]"
        >
          <KeyRound aria-hidden className="h-4 w-4" />
          パスワード変更
        </Link>
        <form action={signOut} className="mx-4 mb-4">
          <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 text-sm font-bold text-stone-700 transition active:scale-[0.98]">
            <LogOut aria-hidden className="h-4 w-4" />
            ログアウト
          </button>
        </form>
        <div className="mx-4 mb-4">
          <AccountDeleteButton gearCount={gearCount} />
        </div>
      </ProfileSection>
    </div>
  );
}

function ProfileSection({
  title,
  description,
  icon: Icon,
  children
}: {
  title: string;
  description: string;
  icon: typeof UserRound;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[22px] bg-white shadow-sm">
      <div className="flex gap-3 border-b border-stone-100 px-5 py-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-forest-50 text-[#14724e]">
          <Icon aria-hidden className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-bold tracking-normal text-ink">{title}</h2>
          <p className="mt-1 text-sm font-semibold leading-relaxed text-stone-500">{description}</p>
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
  placeholder
}: {
  label: string;
  name: string;
  defaultValue: string;
  placeholder?: string;
}) {
  return (
    <label className="block px-4 py-4 sm:grid sm:grid-cols-[160px_minmax(0,1fr)] sm:items-center sm:gap-4">
      <span className="text-sm font-bold text-ink">{label}</span>
      <input
        type="text"
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="mt-2 h-11 w-full min-w-0 rounded-xl border border-stone-200 bg-stone-50 px-3 text-base font-semibold text-stone-800 outline-none placeholder:text-stone-300 focus:border-[#14724e] focus:bg-white sm:mt-0 sm:text-sm"
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

function ProfileSelect({
  label,
  name,
  value,
  onValueChange,
  options
}: {
  label: string;
  name: string;
  value: string;
  onValueChange: (value: string) => void;
  options: readonly ProfileOption[];
}) {
  return (
    <label className="block px-4 py-4 sm:grid sm:grid-cols-[160px_minmax(0,1fr)] sm:items-center sm:gap-4">
      <span className="text-sm font-bold text-ink">{label}</span>
      <select
        name={name}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-base font-semibold text-stone-800 outline-none focus:border-[#14724e] focus:bg-white sm:mt-0 sm:text-sm"
      >
        <option value="">選択しない</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ProfileMultiSelect({
  label,
  name,
  options,
  values,
  onValuesChange,
  max,
  exclusiveValue
}: {
  label: string;
  name: string;
  options: readonly ProfileOption[];
  values: string[];
  onValuesChange: (values: string[]) => void;
  max?: number;
  exclusiveValue?: string;
}) {
  const isAtLimit = max !== undefined && values.length >= max;
  const hasExclusiveValue = exclusiveValue ? values.includes(exclusiveValue) : false;

  function toggle(value: string) {
    if (values.includes(value)) {
      onValuesChange(values.filter((entry) => entry !== value));
      return;
    }

    if (exclusiveValue && (value === exclusiveValue || values.includes(exclusiveValue))) {
      onValuesChange([value]);
      return;
    }

    if (max !== undefined && values.length >= max) {
      return;
    }

    onValuesChange([...values, value]);
  }

  return (
    <fieldset className="px-4 py-4 sm:grid sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-4">
      <legend className="text-sm font-bold text-ink sm:pt-2">{label}</legend>
      <div className="mt-3 sm:mt-0">
        {max !== undefined ? (
          <p className="mb-2 text-xs font-semibold text-stone-500">最大{max}件まで選択できます。</p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {options.map((option) => {
            const checked = values.includes(option.value);
            const disabled =
              (!checked && isAtLimit) ||
              (!checked && hasExclusiveValue && option.value !== exclusiveValue);

            return (
              <label
                key={option.value}
                className={`inline-flex min-h-10 cursor-pointer items-center rounded-full border px-3 py-2 text-sm font-bold transition ${
                  checked
                    ? "border-[#14724e] bg-forest-50 text-[#14724e]"
                    : "border-stone-200 bg-white text-stone-600"
                } ${disabled ? "cursor-not-allowed opacity-45" : "active:scale-[0.98]"}`}
              >
                <input
                  type="checkbox"
                  name={name}
                  value={option.value}
                  checked={checked}
                  disabled={disabled}
                  onChange={() => toggle(option.value)}
                  className="sr-only"
                />
                {option.label}
              </label>
            );
          })}
        </div>
      </div>
    </fieldset>
  );
}

function ProfileStaticRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="block px-4 py-4 sm:grid sm:grid-cols-[160px_minmax(0,1fr)] sm:items-center sm:gap-4">
      <span className="text-sm font-bold text-ink">{label}</span>
      <span className="mt-1 block truncate text-sm font-semibold text-stone-500 sm:mt-0">{value}</span>
    </div>
  );
}
