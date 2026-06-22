import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Backpack,
  CheckSquare,
  LockKeyhole,
  Mountain,
  ShieldCheck
} from "lucide-react";

import { SubmitButton } from "@/components/submit-button";

type AuthFormProps = {
  mode: "login" | "signup";
  action: (formData: FormData) => void | Promise<void>;
  error?: string;
  isIosApp?: boolean;
  notice?: string;
  showEmailForm?: boolean;
};

export function AuthForm({
  mode,
  action,
  error,
  isIosApp,
  notice,
  showEmailForm
}: AuthFormProps) {
  const isSignup = mode === "signup";
  const shouldShowEmailForm = Boolean(showEmailForm || error);
  const emailLoginHref = isIosApp ? "/login?email=1&app=ios" : "/login?email=1";
  const emailSignupHref = isIosApp ? "/signup?email=1&app=ios" : "/signup?email=1";
  const landingLoginHref = isIosApp ? "/login?app=ios" : "/login";
  const landingSignupHref = isIosApp ? "/signup?app=ios" : "/signup";
  const appleAuthHref = isIosApp ? "/auth/oauth/apple?app=ios" : "/auth/oauth/apple";
  const googleAuthHref = isIosApp ? "/auth/oauth/google?app=ios" : "/auth/oauth/google";
  const termsHref = isIosApp ? "/terms?from=auth&app=ios" : "/terms?from=auth";
  const privacyHref = isIosApp ? "/privacy?from=auth&app=ios" : "/privacy?from=auth";

  if (shouldShowEmailForm) {
    return (
      <main className="min-h-[100dvh] bg-[#f7f6f1] px-6 pb-[calc(env(safe-area-inset-bottom)+28px)] pt-[calc(env(safe-area-inset-top)+28px)] text-ink">
        <div className="mx-auto flex min-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-56px)] w-full max-w-[390px] flex-col">
          <div className="flex items-center justify-between">
            <Link
              href={isSignup ? landingSignupHref : landingLoginHref}
              className="grid h-12 w-12 place-items-center rounded-[14px] bg-white text-stone-700 shadow-sm ring-1 ring-stone-100"
              aria-label="戻る"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </Link>
            <img
              src="/yamajitaku-logo.png"
              alt="山支度 YAMAJITAKU"
              className="h-11 w-auto object-contain"
            />
          </div>

          <section className="mt-10 rounded-[22px] bg-white px-6 py-7 shadow-[0_22px_60px_rgba(26,31,28,0.10)] ring-1 ring-stone-100">
            <div className="mb-6 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-[14px] bg-forest-50 text-forest-700">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-[19px] font-semibold leading-tight text-ink">
                  {isSignup ? "メールで新規登録" : "メールでログイン"}
                </p>
                <p className="mt-1 text-xs font-medium text-stone-500">
                  {isSignup ? "準備を始めるためのアカウントを作成します。" : "登録済みのアカウントで続けます。"}
                </p>
              </div>
            </div>

            {!isSignup ? (
              <p className="mb-5 rounded-[12px] bg-forest-50 px-4 py-3 text-xs font-semibold leading-5 text-forest-800">
                Google / Appleで登録した方は、この画面の下にある同じボタンからログインしてください。
                Googleアカウントのパスワードはここでは使用できません。
              </p>
            ) : null}

            <form action={action} className="space-y-4">
              {isIosApp ? <input type="hidden" name="app" value="ios" /> : null}
              {error ? (
                <p className="rounded-[12px] bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </p>
              ) : null}

              {notice ? (
                <p className="rounded-[12px] bg-forest-50 px-4 py-3 text-sm font-medium text-forest-800">
                  {notice}
                </p>
              ) : null}

              {isSignup ? (
                <label className="block">
                  <span className="text-sm font-semibold text-stone-700">表示名</span>
                  <input
                    name="display_name"
                    type="text"
                    autoComplete="name"
                    className="mt-2 h-13 w-full rounded-[14px] border border-stone-200 bg-stone-50 px-4 text-base outline-none transition focus:border-forest-500 focus:bg-white"
                    placeholder="例: Yuki"
                  />
                </label>
              ) : null}

              <label className="block">
                <span className="text-sm font-semibold text-stone-700">メールアドレス</span>
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="mt-2 h-13 w-full rounded-[14px] border border-stone-200 bg-stone-50 px-4 text-base outline-none transition focus:border-forest-500 focus:bg-white"
                  placeholder="you@example.com"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-stone-700">パスワード</span>
                <input
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  className="mt-2 h-13 w-full rounded-[14px] border border-stone-200 bg-stone-50 px-4 text-base outline-none transition focus:border-forest-500 focus:bg-white"
                  placeholder="6文字以上"
                />
              </label>

              <SubmitButton
                pendingLabel={isSignup ? "作成中..." : "ログイン中..."}
                className="h-13 w-full rounded-[14px] bg-[#14724e] px-5 text-base font-semibold text-white transition hover:bg-forest-900 disabled:opacity-60"
              >
                {isSignup ? "アカウントを作成" : "ログイン"}
              </SubmitButton>
            </form>

            <p className="mt-6 text-center text-sm text-stone-600">
              {isSignup ? "すでにアカウントがありますか？" : "はじめて利用しますか？"}{" "}
              <Link
                href={isSignup ? emailLoginHref : emailSignupHref}
                className="font-semibold text-[#14724e]"
              >
                {isSignup ? "ログイン" : "新規登録"}
              </Link>
            </p>

            <div className="my-5 flex items-center gap-4 text-[11px] font-semibold text-stone-400">
              <span className="h-px flex-1 bg-stone-200" />
              <span>または</span>
              <span className="h-px flex-1 bg-stone-200" />
            </div>

            <SocialAuthButtons
              appleHref={appleAuthHref}
              googleHref={googleAuthHref}
              variant="light"
            />
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-ink text-white">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/auth-mountain-bg.png')" }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.12)_0%,rgba(0,0,0,0.18)_38%,rgba(0,0,0,0.72)_76%,rgba(0,0,0,0.94)_100%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-[390px] flex-col px-[31px] pb-[calc(env(safe-area-inset-bottom)+20px)] pt-[calc(env(safe-area-inset-top)+64px)] max-[380px]:px-6 max-[380px]:pt-[calc(env(safe-area-inset-top)+42px)]">
        <div className="flex justify-center">
          <img
            src="/auth-logo-white-cropped.png"
            alt="山支度 YAMAJITAKU"
            className="h-[72px] w-auto object-contain max-[380px]:h-[60px]"
          />
        </div>

        <section className="mt-auto">
          {notice ? (
            <p className="mb-4 rounded-[12px] border border-white/20 bg-white/15 px-4 py-3 text-sm font-semibold text-white backdrop-blur">
              {notice}
            </p>
          ) : null}

          <h1 className="text-[29px] font-semibold leading-[1.36] tracking-normal text-white max-[380px]:text-[26px]">
            山へ行く前の
            <br />
            不安をなくす。
          </h1>
          <div className="mt-[18px] h-0.5 w-[26px] rounded-full bg-[#43b86a]" />
          <p className="mt-[14px] text-[14px] font-medium leading-[1.7] text-white/90">
            登山準備を、
            <br />
            もっとシンプルに。
          </p>

          <div className="mt-10 grid grid-cols-3 divide-x divide-white/18 max-[380px]:mt-7">
            <AuthValue icon={Backpack} label="必要な装備がわかる" caption="EQUIPMENT" />
            <AuthValue icon={CheckSquare} label="忘れ物を防げる" caption="CHECKLIST" />
            <AuthValue icon={Mountain} label="安心して山へ向かえる" caption="PREPARE" />
          </div>

          <div className="mt-[30px] space-y-[14px] max-[380px]:mt-6 max-[380px]:space-y-3">
            <Link
              href={emailSignupHref}
              className="flex h-12 w-full items-center justify-center gap-3 rounded-[14px] bg-gradient-to-r from-[#42b760] to-[#4fc96f] px-5 text-[15px] font-semibold text-white shadow-[0_18px_42px_rgba(0,0,0,0.28)] transition hover:brightness-105"
            >
              無料で新規登録
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href={emailLoginHref}
              className="flex h-12 w-full items-center justify-center rounded-[14px] border border-white/75 bg-black/12 px-5 text-[15px] font-semibold text-white backdrop-blur-sm transition hover:bg-white/10"
            >
              ログイン
            </Link>
          </div>

          <div className="my-5 flex items-center gap-4 text-[11px] text-white/72 max-[380px]:my-4">
            <span className="h-px flex-1 bg-white/28" />
            <span>または</span>
            <span className="h-px flex-1 bg-white/28" />
          </div>

          <SocialAuthButtons
            appleHref={appleAuthHref}
            googleHref={googleAuthHref}
            variant="dark"
          />

          <p className="mt-4 flex items-start gap-2 text-[9px] leading-4 text-white/58 max-[380px]:mt-3">
            <LockKeyhole className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
            <span>
              登録することで
              <Link href={termsHref} className="text-[#48c579]">利用規約</Link>
              と
              <Link href={privacyHref} className="text-[#48c579]">プライバシーポリシー</Link>
              に同意したことになります。
            </span>
          </p>
        </section>
      </div>
    </main>
  );
}

function SocialAuthButtons({
  appleHref,
  googleHref,
  variant
}: {
  appleHref: string;
  googleHref: string;
  variant: "dark" | "light";
}) {
  const buttonClass =
    variant === "dark"
      ? "flex h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-white/55 bg-black/20 px-3 text-[12px] font-semibold text-white backdrop-blur-sm transition hover:bg-white/10"
      : "flex h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-stone-200 bg-white px-3 text-[12px] font-semibold text-stone-800 shadow-sm transition hover:bg-stone-50";

  return (
    <div className="grid grid-cols-2 gap-3">
      <a href={appleHref} className={buttonClass}>
        <span className="text-base" aria-hidden="true">
          
        </span>
        Appleで続ける
      </a>
      <a href={googleHref} className={buttonClass}>
        <span
          className="grid h-4 w-4 place-items-center rounded-full bg-white text-[11px] font-bold text-[#4285f4]"
          aria-hidden="true"
        >
          G
        </span>
        Googleで続ける
      </a>
    </div>
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
