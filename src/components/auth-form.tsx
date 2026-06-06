import Link from "next/link";

import { SubmitButton } from "@/components/submit-button";

type AuthFormProps = {
  mode: "login" | "signup";
  action: (formData: FormData) => void | Promise<void>;
  error?: string;
};

export function AuthForm({ mode, action, error }: AuthFormProps) {
  const isSignup = mode === "signup";

  return (
    <main className="min-h-screen bg-trail-50 px-5 py-8 text-ink">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold text-forest-700">YAMAJITAKU</p>
          <h1 className="text-4xl font-semibold tracking-normal text-ink">山支度</h1>
          <p className="mt-4 text-xl font-semibold tracking-normal text-ink">
            {isSignup ? "装備管理をはじめる" : "おかえりなさい"}
          </p>
          <p className="mt-3 text-base leading-7 text-stone-600">
            登山前の装備確認を10秒で。
          </p>
        </div>

        <form action={action} className="space-y-4 rounded-lg bg-white p-5 shadow-soft">
          {error ? (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
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
                className="mt-2 w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none transition focus:border-forest-500 focus:bg-white"
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
              className="mt-2 w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none transition focus:border-forest-500 focus:bg-white"
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
              className="mt-2 w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none transition focus:border-forest-500 focus:bg-white"
              placeholder="6文字以上"
            />
          </label>

          <SubmitButton
            pendingLabel={isSignup ? "作成中..." : "ログイン中..."}
            className="w-full rounded-lg bg-forest-700 px-5 py-3 text-base font-semibold text-white transition hover:bg-forest-900 disabled:opacity-60"
          >
            {isSignup ? "アカウント作成" : "ログイン"}
          </SubmitButton>
        </form>

        <p className="mt-6 text-center text-sm text-stone-600">
          {isSignup ? "すでにアカウントがありますか？" : "はじめて利用しますか？"}{" "}
          <Link
            href={isSignup ? "/login" : "/signup"}
            className="font-semibold text-forest-700"
          >
            {isSignup ? "ログイン" : "アカウント作成"}
          </Link>
        </p>
      </div>
    </main>
  );
}
