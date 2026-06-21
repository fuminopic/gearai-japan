import Link from "next/link";
import {
  ArrowRight,
  Backpack,
  CheckSquare,
  LockKeyhole,
  Mountain,
  ShieldCheck
} from "lucide-react";

import { AppLogo } from "@/components/app-logo";
import { SubmitButton } from "@/components/submit-button";

type AuthFormProps = {
  mode: "login" | "signup";
  action: (formData: FormData) => void | Promise<void>;
  error?: string;
  notice?: string;
};

export function AuthForm({ mode, action, error, notice }: AuthFormProps) {
  const isSignup = mode === "signup";

  return (
    <main className="relative min-h-[100dvh] overflow-x-hidden bg-ink text-white">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/auth-mountain-bg.jpg')" }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08)_0%,rgba(0,0,0,0.18)_34%,rgba(0,0,0,0.68)_70%,rgba(0,0,0,0.94)_100%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-[390px] flex-col px-7 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-[calc(env(safe-area-inset-top)+54px)]">
        <div className="flex justify-center">
          <AppLogo className="h-[62px] brightness-0 invert" />
          <span className="sr-only">山支度 YAMAJITAKU</span>
        </div>

        <section className="mt-auto">
          {notice ? (
            <p className="mb-4 rounded-[12px] border border-white/20 bg-white/15 px-4 py-3 text-sm font-semibold text-white backdrop-blur">
              {notice}
            </p>
          ) : null}

          <p className="text-[29px] font-semibold leading-[1.36] tracking-normal text-white">
            山へ行く前の
            <br />
            不安をなくす。
          </p>
          <div className="mt-4 h-0.5 w-7 rounded-full bg-[#43b86a]" />
          <p className="mt-4 text-[14px] font-medium leading-7 text-white/90">
            登山準備を、
            <br />
            もっとシンプルに。
          </p>

          <div className="mt-9 grid grid-cols-3 divide-x divide-white/18">
            <AuthValue icon={Backpack} label="必要な装備がわかる" caption="EQUIPMENT" />
            <AuthValue icon={CheckSquare} label="忘れ物を防げる" caption="CHECKLIST" />
            <AuthValue icon={Mountain} label="安心して山へ向かえる" caption="PREPARE" />
          </div>

          <div className="mt-8 space-y-3">
            <Link
              href="/signup#email"
              className="flex h-12 w-full items-center justify-center gap-3 rounded-[14px] bg-gradient-to-r from-[#42b760] to-[#4fc96f] px-5 text-[15px] font-semibold text-white shadow-[0_18px_42px_rgba(0,0,0,0.28)] transition hover:brightness-105"
            >
              無料で新規登録
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/login#email"
              className="flex h-12 w-full items-center justify-center rounded-[14px] border border-white/75 bg-black/12 px-5 text-[15px] font-semibold text-white backdrop-blur-sm transition hover:bg-white/10"
            >
              ログイン
            </Link>
          </div>

          <div className="my-5 flex items-center gap-4 text-[11px] text-white/72">
            <span className="h-px flex-1 bg-white/28" />
            <span>または</span>
            <span className="h-px flex-1 bg-white/28" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="flex h-11 items-center justify-center gap-2 rounded-[10px] border border-white/55 bg-black/20 px-3 text-[12px] font-semibold text-white backdrop-blur-sm"
            >
              <span className="text-base" aria-hidden="true"></span>
              Appleで続ける
            </button>
            <button
              type="button"
              className="flex h-11 items-center justify-center gap-2 rounded-[10px] border border-white/55 bg-black/20 px-3 text-[12px] font-semibold text-white backdrop-blur-sm"
            >
              <span className="grid h-4 w-4 place-items-center rounded-full bg-white text-[11px] font-bold text-[#4285f4]" aria-hidden="true">G</span>
              Googleで続ける
            </button>
          </div>

          <p className="mt-4 flex items-start gap-2 text-[9px] leading-4 text-white/58">
            <LockKeyhole className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
            <span>
              登録することで
              <Link href="/terms" className="text-[#48c579]">利用規約</Link>
              と
              <Link href="/privacy" className="text-[#48c579]">プライバシーポリシー</Link>
              に同意したことになります。
            </span>
          </p>
        </section>

        <section
          id="email"
          className="mt-7 scroll-mt-6 rounded-[16px] border border-white/14 bg-white/94 p-5 text-ink shadow-[0_24px_60px_rgba(0,0,0,0.34)] backdrop-blur"
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-[12px] bg-forest-50 text-forest-700">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-base font-semibold">
                {isSignup ? "メールで新規登録" : "メールでログイン"}
              </p>
              <p className="mt-1 text-xs text-stone-500">
                {isSignup ? "必要事項を入力して開始します。" : "登録済みのアカウントで続けます。"}
              </p>
            </div>
          </div>

          <form action={action} className="space-y-4">
            {error ? (
              <p className="rounded-[12px] bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            {isSignup ? (
              <label className="block">
                <span className="text-sm font-medium text-stone-700">表示名</span>
                <input
                  name="display_name"
                  type="text"
                  autoComplete="name"
                  className="mt-2 w-full rounded-[12px] border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none transition focus:border-forest-500 focus:bg-white"
                  placeholder="例: Yuki"
                />
              </label>
            ) : null}

            <label className="block">
              <span className="text-sm font-medium text-stone-700">メールアドレス</span>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                className="mt-2 w-full rounded-[12px] border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none transition focus:border-forest-500 focus:bg-white"
                placeholder="you@example.com"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-stone-700">パスワード</span>
              <input
                name="password"
                type="password"
                required
                minLength={6}
                autoComplete={isSignup ? "new-password" : "current-password"}
                className="mt-2 w-full rounded-[12px] border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none transition focus:border-forest-500 focus:bg-white"
                placeholder="6文字以上"
              />
            </label>

            <SubmitButton
              pendingLabel={isSignup ? "作成中..." : "ログイン中..."}
              className="w-full rounded-[12px] bg-forest-700 px-5 py-3 text-base font-semibold text-white transition hover:bg-forest-900 disabled:opacity-60"
            >
              {isSignup ? "アカウント作成" : "ログイン"}
            </SubmitButton>
          </form>

          <p className="mt-5 text-center text-sm text-stone-600">
            {isSignup ? "すでにアカウントがありますか？" : "はじめて利用しますか？"}{" "}
            <Link
              href={isSignup ? "/login#email" : "/signup#email"}
              className="font-semibold text-forest-700"
            >
              {isSignup ? "ログイン" : "新規登録"}
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}

function AuthValue({
  icon: Icon,
  label,
  caption
}: {
  icon: typeof Backpack;
  label: string;
  caption: string;
}) {
  return (
    <div className="px-2 text-center">
      <Icon className="mx-auto h-6 w-6 text-[#7ee06f]" strokeWidth={1.8} aria-hidden="true" />
      <p className="mt-3 whitespace-nowrap text-[10px] font-semibold text-white">{label}</p>
      <p className="mt-1 text-[8px] font-medium tracking-[0.12em] text-white/42">{caption}</p>
    </div>
  );
}
