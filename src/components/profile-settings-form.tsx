"use client";

import { ChevronRight, KeyRound, Loader2, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";

import { AccountDeleteButton } from "@/components/account-delete-button";
import { ProfileAvatarEditor } from "@/components/profile-avatar-editor";
import { UnsavedChangesGuard } from "@/components/ui/unsaved-changes-guard";
import { signOut, updateProfile, type ProfileActionState } from "@/lib/actions/auth";
import { hapticError, hapticSuccess } from "@/lib/haptics";
import {
  AGE_RANGE_OPTIONS,
  FAVORITE_REGION_OPTIONS,
  GENDER_OPTIONS,
  MOUNTAINEERING_EXPERIENCE_OPTIONS,
  MOUNTAINEERING_GENRE_OPTIONS,
  USUAL_TRIP_STYLE_OPTIONS,
  type ProfileOption
} from "@/lib/profile-options";

const initialProfileActionState: ProfileActionState = { ok: false, message: "" };

type ProfileFieldValues = {
  nickname: string;
  gender: string;
  ageRange: string;
  mountaineeringExperience: string;
  mountaineeringGenre: string;
  usualTripStyle: string;
  favoriteRegion: string;
};

type ProfileSettingsFormProps = {
  email: string;
  gearCount: number;
  displayName: string;
  initialAvatarUrl: string;
  gender: string;
  ageRange: string;
  mountaineeringExperience: string;
  mountaineeringGenre: string;
  usualTripStyle: string;
  favoriteRegion: string;
};

export function ProfileSettingsForm({
  email,
  gearCount,
  displayName,
  initialAvatarUrl,
  gender,
  ageRange,
  mountaineeringExperience,
  mountaineeringGenre,
  usualTripStyle,
  favoriteRegion
}: ProfileSettingsFormProps) {
  const [state, formAction, isPending] = useActionState(updateProfile, initialProfileActionState);
  const router = useRouter();
  const [profileValues, setProfileValues] = useState<ProfileFieldValues>(() => ({
    nickname: displayName,
    gender,
    ageRange,
    mountaineeringExperience,
    mountaineeringGenre,
    usualTripStyle,
    favoriteRegion
  }));

  useEffect(() => {
    if (!state.message) {
      return;
    }

    if (state.ok && state.profile) {
      // Keep the controls on the canonical values returned by the action, not
      // by a potentially stale server render or legacy user metadata.
      setProfileValues({
        nickname: state.displayName ?? "",
        gender: state.profile.gender ?? "",
        ageRange: state.profile.ageRange ?? "",
        mountaineeringExperience: state.profile.mountaineeringExperience ?? "",
        mountaineeringGenre: state.profile.mountaineeringGenres[0] ?? "",
        usualTripStyle: state.profile.usualTripStyles[0] ?? "",
        favoriteRegion: state.profile.favoriteRegions[0] ?? ""
      });
      hapticSuccess();
      router.refresh();
    } else {
      hapticError();
    }
  }, [router, state]);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <form id="profile-settings-form" action={formAction} className="space-y-4">
        <UnsavedChangesGuard />

        <ProfileSection title="基本情報" icon={UserRound}>
          <ProfileAvatarEditor displayName={profileValues.nickname} initialAvatarUrl={initialAvatarUrl} />
          <ProfileTextRow
            label="ニックネーム"
            name="display_name"
            value={profileValues.nickname}
            onValueChange={(nickname) => setProfileValues((current) => ({ ...current, nickname }))}
          />
          <ProfileOptionRow
            label="性別"
            name="profile_gender"
            value={profileValues.gender}
            options={GENDER_OPTIONS}
            onValueChange={(value) => setProfileValues((current) => ({ ...current, gender: value }))}
          />
          <ProfileOptionRow
            label="年齢層"
            name="profile_age_range"
            value={profileValues.ageRange}
            options={AGE_RANGE_OPTIONS}
            onValueChange={(value) => setProfileValues((current) => ({ ...current, ageRange: value }))}
          />
          <ProfileOptionRow
            label="登山歴"
            name="mountaineering_experience"
            value={profileValues.mountaineeringExperience}
            options={MOUNTAINEERING_EXPERIENCE_OPTIONS}
            onValueChange={(value) =>
              setProfileValues((current) => ({ ...current, mountaineeringExperience: value }))
            }
          />
          <ProfileOptionRow
            label="主な登山ジャンル"
            name="mountaineering_genres"
            value={profileValues.mountaineeringGenre}
            options={MOUNTAINEERING_GENRE_OPTIONS}
            onValueChange={(value) =>
              setProfileValues((current) => ({ ...current, mountaineeringGenre: value }))
            }
          />
          <ProfileOptionRow
            label="普段よくする山行"
            name="usual_trip_styles"
            value={profileValues.usualTripStyle}
            options={USUAL_TRIP_STYLE_OPTIONS}
            onValueChange={(value) =>
              setProfileValues((current) => ({ ...current, usualTripStyle: value }))
            }
          />
          <ProfileOptionRow
            label="よく行くエリア"
            name="favorite_regions"
            value={profileValues.favoriteRegion}
            options={FAVORITE_REGION_OPTIONS}
            onValueChange={(value) =>
              setProfileValues((current) => ({ ...current, favoriteRegion: value }))
            }
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

      </form>

      <ProfileSection title="アカウント" icon={KeyRound}>
        <ProfileStaticRow label="メールアドレス" value={email} />
        <ProfileLinkRow href="/profile/password" label="パスワード変更" />
        <form action={signOut}>
          <button className="flex h-14 w-full items-center justify-between px-5 text-left text-sm font-bold text-ink transition active:bg-stone-50">
            <span>ログアウト</span>
            <ChevronRight aria-hidden className="h-5 w-5 text-stone-400" />
          </button>
        </form>
        <AccountDeleteButton gearCount={gearCount} variant="row" />
      </ProfileSection>

      <button
        form="profile-settings-form"
        disabled={isPending}
        className="sticky bottom-24 z-20 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#14724e] text-base font-bold text-white shadow-lg shadow-forest-900/10 transition active:scale-[0.99] disabled:opacity-60 md:static"
      >
        {isPending ? <Loader2 aria-hidden className="h-5 w-5 animate-spin" /> : null}
        {isPending ? "保存中..." : "保存する"}
      </button>
    </div>
  );
}

function ProfileSection({
  title,
  icon: Icon,
  children
}: {
  title: string;
  icon: typeof UserRound;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[22px] bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-stone-100 px-5 py-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-forest-50 text-[#14724e]">
          <Icon aria-hidden className="h-5 w-5" />
        </span>
        <h2 className="text-lg font-bold tracking-normal text-ink">{title}</h2>
      </div>
      <div className="divide-y divide-stone-100">{children}</div>
    </section>
  );
}

function ProfileTextRow({
  label,
  name,
  value,
  onValueChange
}: {
  label: string;
  name: string;
  value: string;
  onValueChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [draftValue, setDraftValue] = useState(value);

  useEffect(() => {
    if (!isOpen) {
      setDraftValue(value);
    }
  }, [isOpen, value]);

  return (
    <>
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex h-14 w-full items-center justify-between gap-4 px-5 text-left transition active:bg-stone-50"
      >
        <span className="text-sm font-bold text-ink">{label}</span>
        <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-stone-500">
          <span className="truncate">{value || "未設定"}</span>
          <ChevronRight aria-hidden className="h-5 w-5 shrink-0 text-stone-400" />
        </span>
      </button>
      {isOpen ? (
        <ProfileDialog title={label} onClose={() => setIsOpen(false)}>
          <label className="block">
            <span className="sr-only">{label}</span>
            <input
              autoFocus
              value={draftValue}
              onChange={(event) => setDraftValue(event.target.value.slice(0, 40))}
              placeholder="ニックネームを入力"
              className="h-12 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-base font-semibold text-ink outline-none focus:border-[#14724e] focus:bg-white"
            />
          </label>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="h-11 rounded-xl border border-stone-200 bg-white text-sm font-bold text-stone-700"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={() => {
                onValueChange(draftValue.trim());
                setIsOpen(false);
              }}
              className="h-11 rounded-xl bg-[#14724e] text-sm font-bold text-white"
            >
              決定
            </button>
          </div>
        </ProfileDialog>
      ) : null}
    </>
  );
}

function ProfileOptionRow({
  label,
  name,
  value,
  options,
  onValueChange
}: {
  label: string;
  name: string;
  value: string;
  options: readonly ProfileOption[];
  onValueChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedOption = options.find((option) => option.value === value);

  function selectValue(nextValue: string) {
    onValueChange(nextValue);
    inputRef.current?.dispatchEvent(new Event("change", { bubbles: true }));
    setIsOpen(false);
  }

  return (
    <>
      <input ref={inputRef} type="hidden" name={name} value={value} />
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex h-14 w-full items-center justify-between gap-4 px-5 text-left transition active:bg-stone-50"
      >
        <span className="text-sm font-bold text-ink">{label}</span>
        <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-stone-500">
          <span className="truncate">{selectedOption?.label ?? "未設定"}</span>
          <ChevronRight aria-hidden className="h-5 w-5 shrink-0 text-stone-400" />
        </span>
      </button>
      {isOpen ? (
        <ProfileDialog title={label} onClose={() => setIsOpen(false)}>
          <div
            role="radiogroup"
            aria-label={label}
            className="overflow-hidden rounded-xl border border-stone-100"
          >
            <ProfileChoice
              label="選択しない"
              value=""
              checked={value === ""}
              onSelect={() => selectValue("")}
            />
            {options.map((option) => (
              <ProfileChoice
                key={option.value}
                label={option.label}
                value={option.value}
                checked={option.value === value}
                onSelect={() => selectValue(option.value)}
              />
            ))}
          </div>
        </ProfileDialog>
      ) : null}
    </>
  );
}

function ProfileChoice({
  label,
  value,
  checked,
  onSelect
}: {
  label: string;
  value: string;
  checked: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      value={value}
      onClick={onSelect}
      className={`flex min-h-12 w-full items-center justify-between border-b border-stone-100 px-4 text-left text-sm font-bold transition last:border-b-0 ${
        checked ? "bg-forest-50 text-[#14724e]" : "bg-white text-stone-700 active:bg-stone-50"
      }`}
    >
      <span>{label}</span>
      <span
        aria-hidden
        className={`h-5 w-5 rounded-full border-2 ${
          checked ? "border-[#14724e] bg-[#14724e] shadow-[inset_0_0_0_4px_#eef8f1]" : "border-stone-300"
        }`}
      />
    </button>
  );
}

function ProfileDialog({
  title,
  onClose,
  children
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-4 sm:items-center sm:justify-center">
      <section
        role="dialog"
        aria-modal="true"
        aria-label={`${title}を選択`}
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-ink">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-xl px-3 text-sm font-bold text-stone-500 transition active:bg-stone-50"
          >
            閉じる
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

function ProfileStaticRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-14 items-center justify-between gap-4 px-5">
      <span className="shrink-0 text-sm font-bold text-ink">{label}</span>
      <span className="min-w-0 truncate text-right text-sm font-semibold text-stone-500">{value}</span>
    </div>
  );
}

function ProfileLinkRow({ href, label }: { href: "/profile/password"; label: string }) {
  return (
    <Link
      href={href}
      className="flex h-14 items-center justify-between px-5 text-sm font-bold text-ink transition active:bg-stone-50"
    >
      <span>{label}</span>
      <ChevronRight aria-hidden className="h-5 w-5 text-stone-400" />
    </Link>
  );
}
