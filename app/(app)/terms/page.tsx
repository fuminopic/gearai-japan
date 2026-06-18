export default function TermsPage() {
  return (
    <section className="rounded-[24px] bg-white p-6 shadow-sm">
      <p className="text-sm font-bold text-[#14724e]">ポリシー</p>
      <h1 className="mt-2 text-3xl font-bold tracking-normal text-ink">
        利用規約
      </h1>
      <div className="mt-5 space-y-3 text-sm leading-7 text-stone-600">
        <p>
          山支度は、登山前の装備確認を補助するサービスです。実際の山行判断は、天候、体調、現地状況を確認したうえで利用者自身の責任で行ってください。
        </p>
        <p>
          本サービスの表示内容は、安全を保証するものではありません。
        </p>
      </div>
    </section>
  );
}
