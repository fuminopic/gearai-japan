import Link from "next/link";

// 存在しない URL の受け皿。これが無いと Next.js の既定の
// "404 | This page could not be found" がそのまま出ていた。
export default function NotFound() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[#FAFAF8] px-5">
      <section className="w-full max-w-sm rounded-[20px] bg-white p-6 text-center shadow-sm">
        <p className="font-din text-[11px] font-bold text-[#14724e]">404</p>
        <h1 className="mt-2 text-[20px] font-bold leading-tight tracking-normal text-ink">
          ページが見つかりません
        </h1>
        <p className="mt-3 text-sm font-semibold leading-relaxed text-stone-600">
          URLが変わったか、削除された可能性があります。
        </p>
        <Link
          href="/dashboard"
          className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-full bg-[#14724e] text-sm font-bold text-white transition active:scale-[0.99]"
        >
          ホームへ戻る
        </Link>
      </section>
    </main>
  );
}
