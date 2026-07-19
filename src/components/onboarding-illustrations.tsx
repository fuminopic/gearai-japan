// オンボーディング用イラスト。
//
// 手描きSVGから、支給されたイラストアセット(PNG)に差し替えた。
// 画像は `public/onboarding/` に配置し、next/image 経由で最適化する。
// alt は空 + aria-hidden: 意味は隣接する見出しと本文が担うため、読み上げでは
// 重複させない(装飾画像として扱う)。
//
// アセットの対応:
//   welcome.png     … 1ページ目 山へ行く前の不安を、なくす。
//   plan.png        … 2ページ目 条件を選ぶだけで、山行計画が完成
//   my-gear.png     … 3ページ目 装備も重量も、まとめて管理
//   final-check.png … 4ページ目 出発前の抜け漏れを、ひと目で確認

import Image from "next/image";

type IllustrationProps = {
  className?: string;
};

/** 正方形イラストの共通ラッパー。比率は 1:1 で固定し、幅は呼び出し側が決める。 */
function OnboardingImage({
  src,
  className,
  priority = false
}: {
  src: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={src}
      alt=""
      aria-hidden
      width={1000}
      height={1000}
      // 1枚目だけ先読みする(初回表示のちらつきを防ぐ)。以降はスワイプで進むため遅延で足りる。
      priority={priority}
      sizes="(max-width: 359px) 200px, 250px"
      className={className}
    />
  );
}

/** 1. 山へ行く前の不安を、なくす。 */
export function WelcomeIllustration({ className }: IllustrationProps) {
  return <OnboardingImage src="/onboarding/welcome.png" className={className} priority />;
}

/** 2. 条件を選ぶだけで、山行計画が完成 */
export function PlanIllustration({ className }: IllustrationProps) {
  return <OnboardingImage src="/onboarding/plan.png" className={className} />;
}

/** 3. 装備も重量も、まとめて管理 */
export function MyGearIllustration({ className }: IllustrationProps) {
  return <OnboardingImage src="/onboarding/my-gear.png" className={className} />;
}

/** 4. 出発前の抜け漏れを、ひと目で確認 */
export function FinalCheckIllustration({ className }: IllustrationProps) {
  return <OnboardingImage src="/onboarding/final-check.png" className={className} />;
}
