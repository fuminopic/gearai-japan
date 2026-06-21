import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "利用規約",
  description:
    "山支度（YAMAJITAKU）の利用規約。サービスの利用条件、免責事項、アカウント削除について説明します。",
  alternates: {
    canonical: "/terms"
  }
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#FAFAFA] px-5 py-10 text-ink sm:py-14">
      <article className="mx-auto max-w-[760px]">
        <header className="mb-9">
          <Link
            href="/"
            className="text-sm font-bold tracking-normal text-[#14724e]"
          >
            YAMAJITAKU
          </Link>
          <h1 className="mt-5 text-[28px] font-bold leading-tight tracking-normal text-[#1a3a2a]">
            利用規約
          </h1>
          <p className="mt-2 text-sm font-semibold text-stone-500">
            最終更新日：2026年6月21日
          </p>
        </header>

        <div className="space-y-9 text-[15.5px] leading-[1.8] text-stone-700">
          <p>
            この利用規約（以下「本規約」といいます）は、山支度（YAMAJITAKU、以下「本アプリ」といいます）の利用条件を定めるものです。
            利用者は、本アプリを利用することで本規約に同意したものとみなされます。
          </p>

          <TermsSection title="1. 本アプリの目的">
            <p>
              本アプリは、登山前の装備確認、所有装備の整理、山行計画に応じた持ち物チェックを補助するサービスです。
              本アプリの表示内容は、登山の安全を保証するものではありません。
            </p>
          </TermsSection>

          <TermsSection title="2. 利用者の責任">
            <p>
              実際の山行判断は、天候、体調、同行者、現地状況、交通機関、登山道状況、各自治体・山小屋・管理者からの最新情報を確認したうえで、
              利用者自身の責任で行ってください。
            </p>
          </TermsSection>

          <TermsSection title="3. アカウント">
            <p>
              利用者は、正確な情報を用いてアカウントを作成し、ログイン情報を適切に管理するものとします。
              アカウントの不正利用または管理不備により発生した損害について、本アプリは責任を負いません。
            </p>
          </TermsSection>

          <TermsSection title="4. 登録データ">
            <p>
              利用者は、所有装備、山行計画、装備写真などを任意で登録できます。
              登録内容に誤りがある場合、チェックリストや表示結果にも影響することがあります。
            </p>
          </TermsSection>

          <TermsSection title="5. 禁止事項">
            <ul className="list-disc space-y-2 pl-6">
              <li>法令または公序良俗に反する行為</li>
              <li>他人のアカウントを不正に利用する行為</li>
              <li>本アプリの運営を妨害する行為</li>
              <li>虚偽または不正確な情報を意図的に登録する行為</li>
            </ul>
          </TermsSection>

          <TermsSection title="6. 免責事項">
            <p>
              本アプリは、可能な範囲で正確な情報提供に努めますが、表示内容の完全性、正確性、最新性、特定目的への適合性を保証するものではありません。
              本アプリの利用または利用不能により生じた損害について、法令で認められる範囲で責任を負いません。
            </p>
          </TermsSection>

          <TermsSection title="7. アカウント削除">
            <p>
              利用者は、マイページからアカウントを削除できます。
              削除を実行すると、登録されたアカウント情報、所有装備、山行計画、アップロード画像などの関連データは削除され、復元できません。
            </p>
          </TermsSection>

          <TermsSection title="8. 本規約の変更">
            <p>
              本規約は、サービス内容の変更や法令改正に伴い、予告なく改定される場合があります。
              重要な変更がある場合は、アプリ内または本ページにて通知します。
            </p>
          </TermsSection>

          <TermsSection title="9. お問い合わせ">
            <div className="mt-4 rounded-lg border border-stone-200 bg-white px-5 py-5">
              本規約に関するお問い合わせは、以下のメールアドレスまでご連絡ください。
              <br />
              <br />
              <strong>yamajitaku.app@gmail.com</strong>
            </div>
          </TermsSection>
        </div>

        <footer className="mt-16 text-center text-[13px] text-stone-400">
          © 2026 山支度 YAMAJITAKU
        </footer>
      </article>
    </main>
  );
}

function TermsSection({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 border-l-4 border-[#2d6a4f] pl-3 text-[19px] font-bold tracking-normal text-[#1a3a2a]">
        {title}
      </h2>
      {children}
    </section>
  );
}
