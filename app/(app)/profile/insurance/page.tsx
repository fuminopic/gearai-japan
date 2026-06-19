import { ArrowLeft, CalendarDays, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { updateInsurance } from "@/lib/actions/auth";
import { requireUser } from "@/lib/data/gear";

type InsurancePageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function InsurancePage({ searchParams }: InsurancePageProps) {
  const [{ user }, params] = await Promise.all([requireUser(), searchParams]);
  const metadata = user.user_metadata;
  const insuranceStatus =
    getMetadataString(metadata, "mountain_insurance_status") || "none";

  return (
    <form action={updateInsurance} className="mx-auto max-w-2xl space-y-5 pb-24">
      <section className="flex items-center gap-3">
        <Link
          href="/profile"
          aria-label="マイページへ戻る"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-stone-800 shadow-sm transition active:scale-95"
        >
          <ArrowLeft aria-hidden className="h-5 w-5" />
        </Link>
        <h1 className="min-w-0 flex-1 text-[30px] font-bold leading-tight tracking-normal text-ink">
          保険のご加入
        </h1>
        <button className="h-11 shrink-0 rounded-xl bg-[#14724e] px-4 text-sm font-bold text-white shadow-sm transition active:scale-95">
          保存
        </button>
      </section>

      {params.error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {params.error}
        </p>
      ) : null}

      <section className="rounded-[22px] bg-white p-5 shadow-soft">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-50 text-[#14724e]">
            <ShieldCheck aria-hidden className="h-5 w-5" />
          </span>
          <h2 className="text-2xl font-bold tracking-normal text-ink">保険</h2>
        </div>

        <fieldset className="mt-6 space-y-4">
          <legend className="sr-only">保険の加入状況</legend>
          <InsuranceRadio
            label="未加入"
            value="none"
            defaultChecked={insuranceStatus !== "active"}
          />
          <InsuranceRadio
            label="契約済み"
            value="active"
            defaultChecked={insuranceStatus === "active"}
          />
        </fieldset>

        <div className="mt-8 space-y-5">
          <InsuranceField
            label="保険名"
            name="mountain_insurance_provider"
            defaultValue={getMetadataString(metadata, "mountain_insurance_provider")}
            placeholder="やまきふ共済会 山岳保険"
          />
          <InsuranceDateField
            label="保険開始日"
            name="mountain_insurance_starts_on"
            defaultValue={getMetadataString(metadata, "mountain_insurance_starts_on")}
          />
          <InsuranceDateField
            label="保険終了日"
            name="mountain_insurance_expires_on"
            defaultValue={getMetadataString(metadata, "mountain_insurance_expires_on")}
          />
          <label className="block">
            <span className="block text-sm font-bold text-stone-500">
              証券番号などを入力してください
            </span>
            <input
              name="mountain_insurance_policy_number"
              defaultValue={getMetadataString(
                metadata,
                "mountain_insurance_policy_number"
              )}
              inputMode="text"
              className="mt-2 h-12 w-full rounded-xl border border-stone-200 bg-white px-3 text-base font-semibold text-ink outline-none focus:border-[#14724e]"
            />
          </label>
        </div>
      </section>

      <button className="sticky bottom-24 z-20 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#14724e] text-base font-bold text-white shadow-lg shadow-forest-900/10 transition active:scale-[0.99] md:static">
        保存する
      </button>
    </form>
  );
}

function InsuranceRadio({
  label,
  value,
  defaultChecked
}: {
  label: string;
  value: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex items-center gap-4 text-xl font-bold text-ink">
      <input
        type="radio"
        name="mountain_insurance_status"
        value={value}
        defaultChecked={defaultChecked}
        className="h-8 w-8 accent-black"
      />
      {label}
    </label>
  );
}

function InsuranceField({
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
    <label className="grid gap-2 sm:grid-cols-[140px_minmax(0,1fr)] sm:items-center">
      <span className="text-lg font-bold text-ink">{label}</span>
      <input
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="h-12 w-full rounded-xl border border-stone-200 bg-white px-3 text-base font-semibold text-ink outline-none placeholder:text-stone-300 focus:border-[#14724e]"
      />
    </label>
  );
}

function InsuranceDateField({
  label,
  name,
  defaultValue
}: {
  label: string;
  name: string;
  defaultValue: string;
}) {
  return (
    <label className="grid gap-2 sm:grid-cols-[140px_minmax(0,1fr)] sm:items-center">
      <span className="text-lg font-bold text-ink">{label}</span>
      <span className="relative block">
        <input
          type="date"
          name={name}
          defaultValue={defaultValue}
          className="h-12 w-full rounded-xl border border-stone-200 bg-white px-3 pr-10 text-base font-semibold text-ink outline-none focus:border-[#14724e]"
        />
        <CalendarDays
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
        />
      </span>
    </label>
  );
}

function getMetadataString(
  metadata: Record<string, unknown> | null | undefined,
  key: string
) {
  const value = metadata?.[key];
  return typeof value === "string" ? value : "";
}
