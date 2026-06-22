import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "プライバシーポリシー",
  description:
    "山支度（YAMAJITAKU）のプライバシーポリシー。収集する情報、利用目的、外部サービス、データ削除について説明します.",
  alternates: {
    canonical: "/privacy"
  }
};

type PrivacyPageProps = {
  searchParams: Promise<{
    app?: string;
    from?: string;
  }>;
};

export default async function PrivacyPage({ searchParams }: PrivacyPageProps) {
  const params = await searchParams;
  const authReturnHref = params.app === "ios" ? "/login?app=ios" : "/login";
  const shouldShowAuthReturn = params.from === "auth";

  return (
    <main className="min-h-screen bg-[#FAFAFA] px-5 py-10 text-ink sm:py-14">
      <article className="mx-auto max-w-[760px]">
        <header className="mb-9">
          {shouldShowAuthReturn ? (
            <Link
              href={authReturnHref}
              className="inline-flex h-11 items-center rounded-full border border-[#14724e]/20 bg-white px-4 text-sm font-bold tracking-normal text-[#14724e] shadow-sm"
            >
              ログイン画面へ戻る
            </Link>
          ) : (
            <Link
              href="/"
              className="text-sm font-bold tracking-normal text-[#14724e]"
            >
              YAMAJITAKU
            </Link>
          )}
          <h1 className="mt-5 text-[28px] font-bold leading-tight tracking-normal text-[#1a3a2a]">
            プライバシーポリシー
          </h1>
          <p className="mt-2 text-sm font-semibold text-stone-500">
            最終更新日：2026年6月21日
          </p>
        </header>

        <div className="space-y-9 text-[15.5px] leading-[1.8] text-stone-700">
          <p>
            山支度（YAMAJITAKU、以下「本アプリ」といいます）は、利用者の皆様のプライバシーを尊重し、個人情報の保護に努めます。
            本プライバシーポリシーは、本アプリが収集する情報の種類、利用目的、管理方法について説明するものです。
          </p>

          <PolicySection title="1. 事業者情報">
            <p>
              本アプリは、個人開発者により提供されています。
              <br />
              お問い合わせ先：yamajitaku.app@gmail.com
            </p>
          </PolicySection>

          <PolicySection title="2. 収集する情報">
            <p>本アプリでは、サービス提供のために以下の情報を収集します。</p>
            <div className="overflow-x-auto">
              <table className="mt-4 w-full border-collapse text-left text-[14.5px]">
                <tbody>
                  <tr>
                    <th className="border border-stone-200 bg-[#f0f5f1] px-3 py-2">
                      情報の種類
                    </th>
                    <th className="border border-stone-200 bg-[#f0f5f1] px-3 py-2">
                      内容
                    </th>
                  </tr>
                  <tr>
                    <td className="border border-stone-200 px-3 py-2">
                      アカウント情報
                    </td>
                    <td className="border border-stone-200 px-3 py-2">
                      登録時に入力されたメールアドレスおよびパスワード（認証情報として安全に管理されます）
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-stone-200 px-3 py-2">装備データ</td>
                    <td className="border border-stone-200 px-3 py-2">
                      利用者が登録した所有装備、重量、カテゴリーなどの情報
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-stone-200 px-3 py-2">
                      山行計画データ
                    </td>
                    <td className="border border-stone-200 px-3 py-2">
                      利用者が作成した山行計画（山名、日程、スタイルなど）
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-stone-200 px-3 py-2">装備写真</td>
                    <td className="border border-stone-200 px-3 py-2">
                      利用者が任意でアップロードする装備の写真画像
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4">
              これらの情報は、利用者がアプリ内で入力・登録した内容に基づくものであり、
              本アプリのサーバーに保存され、複数の端末から同じアカウントでアクセスできるようにするために利用されます。
            </p>
          </PolicySection>

          <PolicySection title="3. 利用目的">
            <ul className="list-disc space-y-2 pl-6">
              <li>アカウントの作成・認証・ログイン状態の維持</li>
              <li>装備管理・山行計画機能の提供</li>
              <li>登録データの保存および端末間での同期</li>
              <li>お問い合わせへの対応</li>
            </ul>
          </PolicySection>

          <PolicySection title="4. 利用している外部サービス">
            <p>
              本アプリは、自社でサーバーを構築する代わりに、以下の外部サービス（クラウドインフラ）を利用してアプリの機能を提供しています。
              これらのサービスは、本アプリの利用者情報を保存・処理するために必要な範囲でのみ利用され、広告や分析目的での第三者提供は行っていません。
            </p>
            <div className="overflow-x-auto">
              <table className="mt-4 w-full border-collapse text-left text-[14.5px]">
                <tbody>
                  <tr>
                    <th className="border border-stone-200 bg-[#f0f5f1] px-3 py-2">
                      サービス名
                    </th>
                    <th className="border border-stone-200 bg-[#f0f5f1] px-3 py-2">
                      用途
                    </th>
                  </tr>
                  <tr>
                    <td className="border border-stone-200 px-3 py-2">
                      Supabase（東京リージョン）
                    </td>
                    <td className="border border-stone-200 px-3 py-2">
                      データベース、アカウント認証、装備写真の保存（ストレージ）。データは東京（ap-northeast-1）のサーバーで処理・保存されます。
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-stone-200 px-3 py-2">Vercel</td>
                    <td className="border border-stone-200 px-3 py-2">
                      アプリのサーバー・ホスティング基盤
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4">
              現時点では、広告配信SDK・アクセス解析ツール（アナリティクス）・決済サービスなど、その他の第三者サービスは利用していません。
            </p>
          </PolicySection>

          <PolicySection title="5. 第三者提供について">
            <p>
              本アプリは、利用者の個人情報を本人の同意なく第三者に提供することはありません。
              ただし、法令に基づく場合や、上記「4. 利用している外部サービス」に記載のクラウドインフラ事業者にデータの保存・処理を委託する場合はこの限りではありません。
            </p>
          </PolicySection>

          <PolicySection title="6. 端末の権限について">
            <p>
              本アプリでは、装備写真の登録機能のために、以下の権限を利用することがあります。
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                <strong>写真ライブラリへのアクセス</strong>
                ：装備の写真を選択してアップロードするため
              </li>
              <li>
                <strong>カメラへのアクセス</strong>
                ：装備の写真をその場で撮影して登録するため
              </li>
            </ul>
            <p className="mt-4">
              これらの権限は、利用者が実際に写真登録機能を使用する際にのみ求められ、許可しない場合でも本アプリの他の機能は通常通りご利用いただけます。
            </p>
          </PolicySection>

          <PolicySection title="7. データの保管・セキュリティ">
            <p>
              収集した情報は、外部クラウドサービス（Supabase）上で適切なセキュリティ対策のもとに保管されます。
              不正アクセス、紛失、改ざん、漏えいなどを防止するため、合理的な範囲で安全管理に努めます。
              また、サービスの安全な運用・障害対応のため、アクセスログ等の技術的な記録を一定期間保持する場合があります。
            </p>
          </PolicySection>

          <PolicySection title="8. データの削除・アカウントの削除">
            <p>
              利用者は、アプリ内の「マイページ」から、個別の装備データや山行計画データをいつでも削除できます。
            </p>
            <p className="mt-4">
              また、アカウント自体の削除（退会）を希望する場合は、「マイページ」＞「アカウント」内の「アカウントを削除」ボタンから手続きを行うことができます。
              確認画面で内容をご確認いただいたうえで削除を実行すると、登録されたメールアドレス、装備データ、山行計画データ、アップロードされた写真を含む全ての関連情報が即時に完全削除され、復元することはできません。
            </p>
            <p className="mt-4">
              アプリ内の手続きをご利用いただけない場合は、下記のお問い合わせ先まで直接ご連絡ください。確認の上、合理的な期間内に対応いたします。
            </p>
          </PolicySection>

          <PolicySection title="9. お子様の利用について">
            <p>
              本アプリは、13歳未満のお子様を対象としたサービスではありません。
              13歳未満のお子様の個人情報を意図的に収集することはありません。
            </p>
          </PolicySection>

          <PolicySection title="10. プライバシーポリシーの変更">
            <p>
              本ポリシーは、法令の改正やサービス内容の変更に伴い、予告なく改定される場合があります。
              重要な変更がある場合は、アプリ内または本ページにて通知します。
            </p>
          </PolicySection>

          <PolicySection title="11. お問い合わせ">
            <div className="mt-4 rounded-lg border border-stone-200 bg-white px-5 py-5">
              本プライバシーポリシーに関するお問い合わせは、以下のメールアドレスまでご連絡ください。
              <br />
              <br />
              <strong>yamajitaku.app@gmail.com</strong>
            </div>
          </PolicySection>
        </div>

        <footer className="mt-16 text-center text-[13px] text-stone-400">
          {shouldShowAuthReturn ? (
            <Link
              href={authReturnHref}
              className="mb-8 inline-flex h-11 items-center rounded-full bg-[#14724e] px-5 text-sm font-bold text-white"
            >
              ログイン画面へ戻る
            </Link>
          ) : null}
          <br />
          © 2026 山支度 YAMAJITAKU
        </footer>
      </article>
    </main>
  );
}

function PolicySection({
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
