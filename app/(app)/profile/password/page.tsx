import { ArrowLeft, KeyRound, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { SubmitButton } from "@/components/submit-button";
import { updatePassword } from "@/lib/actions/auth";
import { requireUser } from "@/lib/data/gear";

type PasswordPageProps = {
  searchParams: Promise<{
    error?: string;
    saved?: string;
  }>;
};

export default async function PasswordPage({ searchParams }: PasswordPageProps) {
  const [{ user }, params] = await Promise.all([requireUser(), searchParams]);

  return (
    <form action={updatePassword} className="mx-auto max-w-2xl space-y-4 pb-24">
      <section className="flex items-center gap-3">
        <Link
          href="/profile"
          aria-label="マイページへ戻る"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-stone-800 shadow-sm transition active:scale-95"
        >
          <ArrowLeft aria-hidden className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold leading-none text-[#14724e]">マイページ</p>
          <h1 className="mt-1 text-[26px] font-bold leading-tight tracking-normal text-ink">
            パスワード管理
          </h1>
        </div>
      </section>

      {params.error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {params.error}
        </p>
      ) : null}

      {params.saved === "1" ? (
        <p className="rounded-lg bg-forest-50 px-4 py-3 text-sm font-semibold text-forest-800">
          パスワードを更新しました。次回からメールアドレスとパスワードでもログインできます。
        </p>
      ) : null}

      <section className="overflow-hidden rounded-[20px] bg-white p-4 shadow-soft sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-forest-50 text-[#14724e]">
            <KeyRound aria-hidden className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold tracking-normal text-ink">
              パスワードを追加・変更
            </h2>
            <p className="mt-1 text-sm font-semibold leading-relaxed text-stone-500">
              Google / Appleで登録した方も、パスワードを設定するとメールアドレスとパスワードでログインできます。
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-stone-50 px-4 py-3">
          <p className="text-xs font-bold text-stone-500">メールアドレス</p>
          <p className="mt-1 truncate text-sm font-semibold text-stone-800">
            {user.email}
          </p>
        </div>

        <div className="mt-5 space-y-4">
          <PasswordField
            label="新しいパスワード"
            name="password"
            autoComplete="new-password"
          />
          <PasswordField
            label="新しいパスワード（確認）"
            name="confirm_password"
            autoComplete="new-password"
          />
        </div>
      </section>

      <section className="rounded-[20px] bg-white p-4 shadow-soft sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-forest-50 text-[#14724e]">
            <ShieldCheck aria-hidden className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-bold tracking-normal text-ink">ご注意</h2>
            <p className="mt-1 text-sm font-semibold leading-relaxed text-stone-500">
              Google / Appleアカウント自体のパスワードは変更されません。山支度でメールログインするためのパスワードだけを設定します。
            </p>
          </div>
        </div>
      </section>

      <SubmitButton
        pendingLabel="更新中..."
        className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#14724e] text-sm font-bold text-white shadow-sm transition active:scale-[0.99] disabled:opacity-60"
      >
        パスワードを更新する
      </SubmitButton>
    </form>
  );
}

function PasswordField({
  label,
  name,
  autoComplete
}: {
  label: string;
  name: string;
  autoComplete: string;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-bold text-ink">{label}</span>
      <input
        type="password"
        name={name}
        required
        minLength={6}
        autoComplete={autoComplete}
        className="mt-2 block h-11 w-full min-w-0 max-w-full rounded-xl border border-stone-200 bg-white px-3 text-sm font-semibold text-ink outline-none placeholder:text-stone-300 focus:border-[#14724e]"
        placeholder="6文字以上"
      />
    </label>
  );
}
