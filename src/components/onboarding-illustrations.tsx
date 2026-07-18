// オンボーディング用フラットSVGイラスト一式。
//
// 5点で1つのビジュアルシステム: 共通の背景ブロブ + 地面楕円 + ブランドの
// 森グリーン（#14724e / #1F7950 / #81AB44）と trail ベージュ（#d3c7ad / #836f49）、
// 白カード（角丸12〜16px）。キャラクター・マスコットは使用しない（未確立のため）。
// 3枚目のみ、アプリ内チェックリストの状態色（所持=#14724e / 不足=#B91C1C /
// 要確認=#1D4ED8）を引用して「自動整理」の意味を伝える。
// 外部画像・出所不明素材は使わず、すべて手書きのベクター形状のみ。

const C = {
  blob: "#f4f8f4", // forest-50
  tint: "#e5eee5", // forest-100
  edge: "#cbdcca", // forest-200
  deep: "#14724e", // brand deep green
  mid: "#1F7950", // home gradient start
  light: "#81AB44", // home gradient end (sun / accent)
  beige: "#d3c7ad", // trail-300
  tan: "#836f49", // trail-600
  dark: "#4b3f2c", // trail-800
  card: "#ffffff",
  paper: "#eeebe2", // trail-100
  missing: "#B91C1C", // 既存チェックリストUIの「不足」
  confirm: "#1D4ED8" // 既存チェックリストUIの「確認済み/要確認」系ブルー
} as const;

type IllustrationProps = {
  className?: string;
};

function svgProps(className?: string) {
  return {
    viewBox: "0 0 320 220",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": true as const,
    className
  };
}

/** 白い円の中の緑チェック。完了・所持の共通記号。 */
function CheckCircle({
  cx,
  cy,
  r = 9,
  fill = C.deep
}: {
  cx: number;
  cy: number;
  r?: number;
  fill?: string;
}) {
  const s = r / 9;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={fill} />
      <path
        d={`M${cx - 4 * s} ${cy} l${3 * s} ${3.2 * s} l${5.2 * s} ${-6.2 * s}`}
        stroke="#ffffff"
        strokeWidth={2.4 * s}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

/** 1. 山行準備を、もっと確実に — 山なみ + 整理されたチェックリスト */
export function WelcomeIllustration({ className }: IllustrationProps) {
  return (
    <svg {...svgProps(className)}>
      <ellipse cx="160" cy="118" rx="150" ry="96" fill={C.blob} />
      <circle cx="238" cy="50" r="17" fill={C.light} />
      {/* 奥の稜線 */}
      <path d="M22 152 L102 74 L172 152 Z" fill={C.edge} />
      {/* 主峰(冠雪) */}
      <path d="M88 152 L172 52 L252 152 Z" fill={C.mid} />
      <path
        d="M154 74 L172 52 L190 74 C184 70 181 76 176 73 C171 70 165 77 160 73 C157 71 156 72 154 74 Z"
        fill={C.blob}
      />
      {/* 手前の尾根 */}
      <path d="M40 152 L104 96 L184 152 Z" fill={C.deep} />
      <ellipse cx="160" cy="156" rx="136" ry="9" fill={C.tint} />
      {/* チェックリストカード */}
      <g>
        <rect x="188" y="92" width="98" height="88" rx="14" fill={C.card} />
        <CheckCircle cx={206} cy={112} r={8} />
        <rect x="218" y="108" width="52" height="8" rx="4" fill={C.tint} />
        <CheckCircle cx={206} cy={136} r={8} />
        <rect x="218" y="132" width="42" height="8" rx="4" fill={C.tint} />
        <circle cx="206" cy="160" r="8" fill={C.paper} />
        <rect x="218" y="156" width="48" height="8" rx="4" fill={C.paper} />
      </g>
    </svg>
  );
}

/** 2. 山を選ぶだけで、準備が始まる — 山 + 条件選択チップ */
export function PlanIllustration({ className }: IllustrationProps) {
  return (
    <svg {...svgProps(className)}>
      <ellipse cx="160" cy="118" rx="150" ry="96" fill={C.blob} />
      <circle cx="64" cy="46" r="15" fill={C.light} />
      {/* 選ばれた山 */}
      <path d="M28 166 L120 56 L212 166 Z" fill={C.mid} />
      <path d="M120 56 L212 166 L120 166 Z" fill={C.deep} />
      <path
        d="M103 76 L120 56 L137 76 C131 72 128 78 123 75 C118 72 112 79 107 75 C105 73 104 74 103 76 Z"
        fill={C.blob}
      />
      {/* 登山道 */}
      <path
        d="M74 166 C96 148 92 136 112 122 C126 112 118 96 120 84"
        stroke={C.beige}
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray="1 11"
      />
      <ellipse cx="132" cy="170" rx="118" ry="9" fill={C.tint} />
      {/* 条件チップ: 季節(選択済み) / 日程 / スタイル */}
      <g>
        <rect x="216" y="84" width="84" height="28" rx="14" fill={C.deep} />
        <circle cx="232" cy="98" r="6" stroke="#ffffff" strokeWidth="2.4" />
        <path
          d="M282 95 l3 3.2 l5.4 -6.4"
          stroke="#ffffff"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="248" y="93" width="26" height="8" rx="4" fill="#ffffff" opacity="0.85" />

        <rect x="216" y="120" width="84" height="28" rx="14" fill={C.card} />
        <rect x="225" y="128" width="14" height="12" rx="3" stroke={C.tan} strokeWidth="2.2" />
        <path d="M225 132.5 H239" stroke={C.tan} strokeWidth="2.2" />
        <rect x="248" y="130" width="34" height="8" rx="4" fill={C.tint} />

        <rect x="216" y="156" width="84" height="28" rx="14" fill={C.card} />
        <path
          d="M225 176 L232.5 164 L240 176 Z"
          stroke={C.mid}
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <rect x="248" y="166" width="30" height="8" rx="4" fill={C.tint} />
      </g>
    </svg>
  );
}

/** 3. 必要な装備を、自動で整理 — 所持 / 不足 / 要確認 に分かれるリスト */
export function GearSortIllustration({ className }: IllustrationProps) {
  return (
    <svg {...svgProps(className)}>
      <ellipse cx="160" cy="112" rx="150" ry="96" fill={C.blob} />
      {/* リストカード */}
      <rect x="70" y="30" width="180" height="144" rx="16" fill={C.card} />
      <rect x="88" y="46" width="64" height="10" rx="5" fill={C.tint} />
      {/* 自動整理の輝き */}
      <path d="M262 34 l3.4 8 l8 3.4 l-8 3.4 l-3.4 8 l-3.4 -8 l-8 -3.4 l8 -3.4 Z" fill={C.light} />
      <path d="M282 62 l2.2 5.2 l5.2 2.2 l-5.2 2.2 l-2.2 5.2 l-2.2 -5.2 l-5.2 -2.2 l5.2 -2.2 Z" fill={C.light} />
      {/* 行1: 所持 */}
      <CheckCircle cx={98} cy={78} r={9} />
      <rect x="114" y="70" width="16" height="16" rx="5" fill={C.paper} />
      <rect x="140" y="74" width="70" height="8" rx="4" fill={C.tint} />
      {/* 行2: 不足 */}
      <g>
        <circle cx="98" cy="112" r="9" fill={C.missing} />
        <rect x="96.8" y="106.5" width="2.4" height="7" rx="1.2" fill="#ffffff" />
        <circle cx="98" cy="117" r="1.5" fill="#ffffff" />
      </g>
      <rect x="114" y="104" width="16" height="16" rx="5" fill={C.paper} />
      <rect x="140" y="108" width="56" height="8" rx="4" fill={C.tint} />
      {/* 行3: 要確認(未チェックの確認枠) */}
      <g>
        <circle cx="98" cy="146" r="9" fill={C.confirm} />
        <rect x="93.5" y="141.5" width="9" height="9" rx="2" stroke="#ffffff" strokeWidth="1.8" />
      </g>
      <rect x="114" y="138" width="16" height="16" rx="5" fill={C.paper} />
      <rect x="140" y="142" width="64" height="8" rx="4" fill={C.tint} />
      {/* 凡例ピル */}
      <g>
        <rect x="64" y="188" width="56" height="18" rx="9" fill={C.card} />
        <circle cx="76" cy="197" r="4" fill={C.deep} />
        <rect x="84" y="194" width="28" height="6" rx="3" fill={C.tint} />
        <rect x="128" y="188" width="56" height="18" rx="9" fill={C.card} />
        <circle cx="140" cy="197" r="4" fill={C.missing} />
        <rect x="148" y="194" width="28" height="6" rx="3" fill={C.tint} />
        <rect x="192" y="188" width="56" height="18" rx="9" fill={C.card} />
        <circle cx="204" cy="197" r="4" fill={C.confirm} />
        <rect x="212" y="194" width="28" height="6" rx="3" fill={C.tint} />
      </g>
    </svg>
  );
}

/** 4. マイ装備を、ひとつにまとめる — 装備タイルがザックと重量に集約される */
export function MyGearIllustration({ className }: IllustrationProps) {
  return (
    <svg {...svgProps(className)}>
      <ellipse cx="160" cy="118" rx="150" ry="96" fill={C.blob} />
      {/* 装備タイル 2x2 */}
      <g>
        <rect x="46" y="52" width="52" height="52" rx="12" fill={C.card} />
        {/* 登山靴 */}
        <path
          d="M58 84 v-12 c0 -3 2 -5 5 -5 h6 c3 0 5 2 5 5 v4 h8 c3 0 6 3 6 6 v2 Z"
          fill={C.tan}
        />
        <rect x="56" y="84" width="34" height="6" rx="3" fill={C.dark} />

        <rect x="108" y="52" width="52" height="52" rx="12" fill={C.card} />
        {/* ランタン */}
        <path d="M126 70 h16 l3 14 h-22 Z" fill={C.beige} />
        <rect x="123" y="84" width="22" height="6" rx="3" fill={C.tan} />
        <path d="M129 70 c0 -8 10 -8 10 0" stroke={C.tan} strokeWidth="2.4" />
        <circle cx="134" cy="77" r="3.4" fill={C.light} />

        <rect x="46" y="114" width="52" height="52" rx="12" fill={C.card} />
        {/* ボトル */}
        <rect x="64" y="130" width="16" height="26" rx="6" fill={C.mid} />
        <rect x="67" y="124" width="10" height="8" rx="3" fill={C.dark} />

        <rect x="108" y="114" width="52" height="52" rx="12" fill={C.card} />
        {/* ロープ */}
        <circle cx="134" cy="140" r="12" stroke={C.beige} strokeWidth="7" />
        <path d="M126 148 c4 4 12 4 16 0" stroke={C.tan} strokeWidth="3" strokeLinecap="round" />
      </g>
      {/* 集約の点線 */}
      <path
        d="M168 78 C190 84 198 96 206 108 M168 140 C188 136 198 128 206 118"
        stroke={C.edge}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="1 9"
      />
      {/* ザック */}
      <g>
        <ellipse cx="238" cy="176" rx="52" ry="8" fill={C.tint} />
        <rect x="206" y="76" width="64" height="94" rx="20" fill={C.deep} />
        <rect x="214" y="66" width="48" height="18" rx="9" fill={C.mid} />
        <rect x="218" y="124" width="40" height="38" rx="12" fill={C.mid} />
        <rect x="230" y="96" width="16" height="6" rx="3" fill={C.beige} />
        <path d="M206 112 h-8 c-4 0 -6 4 -4 8 l8 22" stroke={C.dark} strokeWidth="5" strokeLinecap="round" />
        <path d="M270 112 h8 c4 0 6 4 4 8 l-8 22" stroke={C.dark} strokeWidth="5" strokeLinecap="round" />
      </g>
      {/* 重量タグ */}
      <g>
        <rect x="252" y="34" width="44" height="30" rx="10" fill={C.light} />
        <path d="M266 49 h16 M269 49 l-3 8 h8 Z M279 49 l-3 8 h8 Z" stroke="#ffffff" strokeWidth="2" strokeLinejoin="round" />
        <path d="M274 49 v-5" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
        <path d="M262 64 l6 8" stroke={C.light} strokeWidth="3" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/** 5. 出発前に、最後の確認 — 荷物と、確認済みの装備チェック */
export function FinalCheckIllustration({ className }: IllustrationProps) {
  return (
    <svg {...svgProps(className)}>
      <ellipse cx="160" cy="118" rx="150" ry="96" fill={C.blob} />
      <circle cx="256" cy="52" r="16" fill={C.light} />
      <path d="M216 84 L252 44 L288 84 Z" fill={C.edge} />
      <ellipse cx="150" cy="188" rx="120" ry="10" fill={C.tint} />
      {/* トレッキングポール */}
      <path d="M196 92 L216 180" stroke={C.tan} strokeWidth="4" strokeLinecap="round" />
      <path d="M196 92 c-4 -2 -8 0 -9 4" stroke={C.tan} strokeWidth="4" strokeLinecap="round" />
      {/* ザック(正面・出発準備完了) */}
      <g>
        <rect x="112" y="70" width="76" height="112" rx="24" fill={C.deep} />
        {/* マット */}
        <rect x="116" y="56" width="68" height="22" rx="11" fill={C.beige} />
        <circle cx="130" cy="67" r="6" fill={C.paper} />
        {/* 前ポケット */}
        <rect x="126" y="126" width="48" height="46" rx="14" fill={C.mid} />
        <rect x="142" y="94" width="16" height="6" rx="3" fill={C.beige} />
        <path d="M126 148 h48" stroke={C.deep} strokeWidth="3" />
      </g>
      {/* 確認済みの装備 */}
      <g>
        <rect x="26" y="64" width="40" height="40" rx="12" fill={C.card} />
        {/* ヘッドライト */}
        <rect x="34" y="78" width="24" height="12" rx="6" stroke={C.tan} strokeWidth="2.4" />
        <rect x="52" y="79.5" width="9" height="9" rx="2.5" fill={C.light} />
        <CheckCircle cx={64} cy={68} r={8} />

        <rect x="26" y="116" width="40" height="40" rx="12" fill={C.card} />
        {/* 防寒レイヤー */}
        <path
          d="M38 132 l6 -5 h8 l6 5 l-3 5 l-2 -2 v12 h-10 v-12 l-2 2 Z"
          fill={C.mid}
        />
        <CheckCircle cx={64} cy={120} r={8} />

        <rect x="234" y="112" width="40" height="40" rx="12" fill={C.card} />
        {/* 水分 */}
        <rect x="247" y="126" width="14" height="22" rx="5" fill={C.mid} />
        <rect x="249.5" y="121" width="9" height="7" rx="2.5" fill={C.dark} />
        <CheckCircle cx={272} cy={116} r={8} />
      </g>
    </svg>
  );
}
