import { ChevronRight, Edit3, ShieldCheck, UserRound } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { requireUser } from "@/lib/data/gear";

export default async function ProfilePage() {
  const { user } = await requireUser();
  const metadata = user.user_metadata;
  const displayName = getDisplayName(user.email, metadata);
  const handle = getUserHandle(user.email, metadata);
  const selfIntroduction = getMetadataString(metadata, "self_introduction");
  const hasEmergencyPhone = Boolean(getMetadataString(metadata, "emergency_phone"));

  return (
    <div className="space-y-5 pb-24">
      <section className="overflow-hidden rounded-[24px] bg-white shadow-soft">
        <div className="relative h-32 bg-stone-200">
          <div className="absolute inset-0 bg-[url('/generic-hills.jpg')] bg-cover bg-center opacity-45 grayscale" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-stone-900/10" />
        </div>

        <div className="px-5 pb-5">
          <div className="-mt-10 flex items-start justify-between gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-[22px] border-4 border-white bg-stone-100 text-stone-400 shadow-sm">
              <UserRound aria-hidden className="h-10 w-10" />
            </div>
            <Link
              href={"/profile/edit" as Route}
              className="mt-3 inline-flex h-10 items-center gap-2 rounded-full border border-stone-200 bg-white px-4 text-sm font-bold text-stone-800 shadow-sm transition active:scale-95"
            >
              <Edit3 aria-hidden className="h-4 w-4" />
              プロフィール編集
            </Link>
          </div>

          <h1 className="mt-4 text-[34px] font-bold leading-tight tracking-normal text-ink">
            {displayName}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm font-semibold text-stone-500">
            <span>{handle}</span>
            <span className="rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5 text-xs text-stone-500">
              Standard
            </span>
          </div>
          <p className="mt-4 text-sm font-semibold leading-relaxed text-stone-600">
            {selfIntroduction || "プロフィールを編集して、山行時に必要な連絡先や基本情報を登録できます。"}
          </p>
        </div>
      </section>

      <Link
        href={"/profile/edit#emergency" as Route}
        className="block rounded-[22px] bg-stone-100 p-5 transition active:scale-[0.99]"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck aria-hidden className="h-5 w-5 text-[#14724e]" />
              <h2 className="text-lg font-bold tracking-normal text-ink">保険・遭難時の対策</h2>
            </div>
            <p className="mt-2 text-sm font-semibold text-stone-700">
              緊急時の連絡先と山岳保険の確認
            </p>
          </div>
          <ChevronRight aria-hidden className="mt-1 h-5 w-5 text-stone-500" />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm font-semibold">
          <span
            className={`rounded-lg px-3 py-1.5 ${
              hasEmergencyPhone
                ? "bg-[#14724e] text-white"
                : "bg-amber-300 text-stone-900"
            }`}
          >
            {hasEmergencyPhone ? "登録済み" : "未登録"}
          </span>
          <span className="text-stone-600">
            {hasEmergencyPhone
              ? "遭難時の連絡先が登録されています"
              : "遭難時に備えて連絡先を登録してください"}
          </span>
        </div>
      </Link>
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
    "YAMAJITAKU USER"
  );
}

function getUserHandle(
  email: string | undefined,
  metadata: Record<string, unknown> | null | undefined
) {
  const base =
    getMetadataString(metadata, "handle") ||
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
