import { KeyRound, ShieldCheck } from "lucide-react";

import { SubmitButton } from "@/components/submit-button";
import { Notice } from "@/components/ui/notice";
import { PageShell } from "@/components/ui/page-shell";
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
    <PageShell
      backHref="/profile"
      backLabel="マイページへ戻る"
      eyebrow="マイページ"
      title="パスワード管理"
    >
      <form action={updatePassword} className="mx-auto max-w-2xl space-y-4">

      {params.error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {params.error}
        </p>
      ) : null}

      {params.saved === "1" ? (
        <Notice tone="success" className="border border-forest-100">
          パスワードを更新しました。次回からメールアドレスとパスワードでもログインできます。
        </Notice>
      ) : null}

      <section className="overflow-hidden rounded-[20px] bg-white p-4 shadow-sm sm:p-5">
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

      <section className="rounded-[20px] bg-white p-4 shadow-sm sm:p-5">
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
    </PageShell>
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
