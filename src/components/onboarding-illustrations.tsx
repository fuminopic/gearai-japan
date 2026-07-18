// オンボーディング用フラットSVGイラスト一式(ロゴ言語版)。
//
// 山支度ロゴの視覚言語に揃える:
// - 頂の丸い三角形の山シルエット + 内部を流れる曲面のトーン帯
//   (clipPath でシルエットに沿わせる。深緑 → 中緑 → 黄緑のレイヤー)
// - ロゴの白い人物と同じ発想の「白い負形」(山に抜かれたチェックリスト、
//   白い破線の登山道、ザックの白いポケットなど)
// - 前景に少量の山吹色の丘 / フラッグ / スパーク(ロゴの黄色に対応)
// - 白いカード/ピル/チップは角丸12〜16px + 極薄ヘアライン + 6%の接地影
// - ギアのグリフは深緑の単色シルエットに統一(アイコン寄せ集め感を避ける)
// - 各ページ主役はひとつ。キャラクター・マスコットは使用しない(未確立のため)。
// 3枚目のみ、アプリ内チェックリストの状態色(所持済み=#14724e / 不足=#B91C1C /
// 要確認=#1D4ED8)を引用して「自動で仕分け」の意味を伝える。外部素材は不使用。

const C = {
  blob: "#f4f8f4", // forest-50: 背景ブロブ
  tint: "#e5eee5", // forest-100: リストバー
  faint: "#f0f4ef", // 区切り線・サブバー
  hairline: "#e8eee8", // 白面の極薄縁取り
  deep: "#14724e", // ブランド深緑
  mid: "#1F7950", // 中緑
  pine: "#0F5A3D", // 陰の緑(ロゴの右峰)
  lime: "#A8C455", // ロゴの明るい黄緑バンド
  light: "#81AB44", // 黄緑アクセント
  sunny: "#E5B94B", // ロゴの山吹色(前景の丘・フラッグ)
  beige: "#d3c7ad", // trail-300
  tan: "#836f49", // trail-600
  dark: "#4b3f2c", // trail-800
  card: "#ffffff",
  paper: "#eeebe2", // trail-100
  ink: "#171a17",
  missing: "#B91C1C", // 既存チェックリストUIの「不足」
  confirm: "#1D4ED8" // 既存チェックリストUIの「要確認」系ブルー
} as const;

/** 全ページ共通の背景ブロブ(同一パスで統一感を出す) */
const BLOB_PATH =
  "M26 104 C26 50 80 18 160 18 C240 18 294 52 294 106 C294 154 244 182 158 182 C72 182 26 158 26 104 Z";

type IllustrationProps = {
  className?: string;
};

function svgProps(className?: string) {
  return {
    viewBox: "0 0 320 200",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": true as const,
    className
  };
}

/** 柔らかい接地影。立体化しない程度の6%インク。 */
function Shadow({
  cx,
  cy,
  rx,
  ry = 6
}: {
  cx: number;
  cy: number;
  rx: number;
  ry?: number;
}) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={C.ink} opacity={0.06} />;
}

/** 円形バッジの緑チェック。完了・所持済みの共通記号。 */
function CheckCircle({
  cx,
  cy,
  r = 8.5,
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

/** 1. 山へ行く前の不安を、なくす。 — ロゴ調の山に白く抜かれた準備リスト + 装備 */
export function WelcomeIllustration({ className }: IllustrationProps) {
  const sil =
    "M58 154 C92 106 118 62 141 47 C146 43.8 154 43.8 159 47 C182 62 208 106 242 154 Z";
  return (
    <svg {...svgProps(className)}>
      <defs>
        <clipPath id="yj-ob-w">
          <path d={sil} />
        </clipPath>
      </defs>
      <path d={BLOB_PATH} fill={C.blob} />
      <circle cx="262" cy="42" r="12" fill={C.light} />
      {/* 陰の副峰(ロゴの右峰) */}
      <path
        d="M186 154 C201 120 213 97 219 90 C221.4 87.2 227.6 87.2 230 90 C240 101 251 126 263 154 Z"
        fill={C.pine}
      />
      {/* 主峰: 中緑ベース + 流れる黄緑バンド + 深緑の陰面 */}
      <path d={sil} fill={C.mid} />
      <g clipPath="url(#yj-ob-w)">
        <path d="M30 160 C78 112 114 64 145 40 C124 88 98 126 64 160 Z" fill={C.lime} />
        <path d="M150 40 C156 76 178 116 226 156 L266 156 L266 36 Z" fill={C.deep} />
        {/* 白く抜かれた準備リスト(ロゴの白い人物と同じ負形の発想) */}
        <circle cx="131" cy="102" r="7" fill="#ffffff" />
        <path
          d="M127.8 102 l2.4 2.6 l4.2 -5"
          stroke={C.mid}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="143" y="98.5" width="52" height="7" rx="3.5" fill="#ffffff" />
        <circle cx="131" cy="124" r="7" fill="#ffffff" />
        <path
          d="M127.8 124 l2.4 2.6 l4.2 -5"
          stroke={C.mid}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="143" y="120.5" width="44" height="7" rx="3.5" fill="#ffffff" />
        <circle cx="131" cy="146" r="7" stroke="#ffffff" strokeWidth="2.2" />
        <rect x="143" y="142.5" width="48" height="7" rx="3.5" fill="#ffffff" opacity="0.7" />
      </g>
      {/* 前景: 山吹色の丘と、置かれた装備(小さなザック) */}
      <path
        d="M96 154 C130 132 168 132 196 144 C214 151.5 232 154 248 154 L248 162 L96 162 Z"
        fill={C.sunny}
      />
      <Shadow cx={226} cy={158} rx={24} ry={4.5} />
      <rect x="210" y="112" width="32" height="42" rx="11" fill={C.beige} />
      <rect x="214" y="106" width="24" height="14" rx="7" fill={C.tan} />
      <rect x="223" y="124" width="6" height="18" rx="3" fill={C.tan} />
    </svg>
  );
}

/** 2. 条件を選ぶだけで、山行計画が完成 — 白い登山道が通ったロゴ調の山 + 条件ピル */
export function PlanIllustration({ className }: IllustrationProps) {
  const sil =
    "M38 158 C68 112 96 64 111 52 C115 48.6 121 48.6 125 52 C140 64 168 112 198 158 Z";
  return (
    <svg {...svgProps(className)}>
      <defs>
        <clipPath id="yj-ob-p">
          <path d={sil} />
        </clipPath>
      </defs>
      <path d={BLOB_PATH} fill={C.blob} />
      <Shadow cx={118} cy={160} rx={68} />
      <path d={sil} fill={C.mid} />
      <g clipPath="url(#yj-ob-p)">
        <path d="M10 162 C58 114 92 68 116 46 C98 92 74 128 42 162 Z" fill={C.lime} />
        <path d="M118 44 C124 80 146 120 190 158 L214 158 L214 40 Z" fill={C.deep} />
        {/* 白い破線の登山道(負形) */}
        <path
          d="M100 158 C114 140 110 128 122 114 C134 100 126 88 120 66"
          stroke="#ffffff"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeDasharray="0.1 9"
        />
      </g>
      {/* 頂の計画フラッグ(山吹色) */}
      <path d="M118 50 V30" stroke={C.tan} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M118 31 l15 5 l-15 5 Z" fill={C.sunny} />
      {/* 前景の丘 */}
      <path
        d="M64 158 C96 140 140 140 172 150 C186 154.5 198 156.5 206 158 L206 165 L64 165 Z"
        fill={C.sunny}
      />
      {/* 条件ピル: 季節(選択済み) / 予定日 / スタイル(グリフは深緑の単色) */}
      <g>
        <rect x="212" y="64" width="88" height="30" rx="15" fill={C.deep} />
        <circle cx="228" cy="79" r="5.5" stroke="#ffffff" strokeWidth="2.2" />
        <rect x="242" y="75.5" width="24" height="7" rx="3.5" fill="#ffffff" opacity="0.9" />
        <path
          d="M277 79 l3 3.2 l5.5 -6.2"
          stroke="#ffffff"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <rect x="212" y="104" width="88" height="30" rx="15" fill={C.card} stroke={C.hairline} />
        <rect x="221" y="111" width="16" height="14" rx="3.5" stroke={C.deep} strokeWidth="2.2" />
        <path d="M221 116 H237" stroke={C.deep} strokeWidth="2.2" />
        <circle cx="227" cy="120.5" r="1.6" fill={C.deep} />
        <circle cx="232" cy="120.5" r="1.6" fill={C.deep} />
        <rect x="244" y="115.5" width="32" height="7" rx="3.5" fill={C.tint} />

        <rect x="212" y="144" width="88" height="30" rx="15" fill={C.card} stroke={C.hairline} />
        <path
          d="M221 164 C226 153 230.5 149 233 147 C235.5 149 240 153 245 164 Z"
          stroke={C.deep}
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path d="M233 164 v-6" stroke={C.deep} strokeWidth="2" strokeLinecap="round" />
        <rect x="250" y="155.5" width="26" height="7" rx="3.5" fill={C.tint} />
      </g>
    </svg>
  );
}

/** 3. 必要な装備を、自動で整理 — 所持済み / 不足 / 要確認 への自動仕分け */
export function GearSortIllustration({ className }: IllustrationProps) {
  return (
    <svg {...svgProps(className)}>
      <path d={BLOB_PATH} fill={C.blob} />
      {/* 仕分けリストカード */}
      <Shadow cx={160} cy={172} rx={84} />
      <rect x="76" y="28" width="168" height="140" rx="16" fill={C.card} stroke={C.hairline} />
      {/* ヘッダー: ミニ山マーク(深緑+黄緑) + タイトルバー */}
      <path
        d="M96 52 C100 45 103 41.5 105 40.6 C106 40.1 108 40.1 109 40.6 C111 41.5 114.5 45 119 52 Z"
        fill={C.deep}
      />
      <path
        d="M110 52 C112.6 47.6 114.6 45 116 44.3 C116.8 43.9 118.2 43.9 119 44.3 C120.4 45 122.4 47.6 125 52 Z"
        fill={C.lime}
      />
      <rect x="133" y="42" width="52" height="9" rx="4.5" fill={C.tint} />
      {/* 自動仕分けのスパーク(山吹色・ひとつだけ) */}
      <path
        d="M252 28 c1.5 6 3 7.5 9 9 c-6 1.5 -7.5 3 -9 9 c-1.5 -6 -3 -7.5 -9 -9 c6 -1.5 7.5 -3 9 -9 Z"
        fill={C.sunny}
      />
      {/* 行区切り */}
      <rect x="96" y="93" width="130" height="2" rx="1" fill={C.faint} />
      <rect x="96" y="125" width="130" height="2" rx="1" fill={C.faint} />
      {/* 行1: 所持済み(バッジはカード縁を割って前後関係をつくる) */}
      <rect x="100" y="68" width="92" height="9" rx="4.5" fill={C.tint} />
      <rect x="100" y="81" width="46" height="5.5" rx="2.75" fill={C.faint} />
      <circle cx="76" cy="78" r="13" fill={C.card} />
      <CheckCircle cx={76} cy={78} r={10} />
      {/* 行2: 不足 */}
      <rect x="100" y="100" width="78" height="9" rx="4.5" fill={C.tint} />
      <rect x="100" y="113" width="38" height="5.5" rx="2.75" fill={C.faint} />
      <circle cx="76" cy="110" r="13" fill={C.card} />
      <circle cx="76" cy="110" r="10" fill={C.missing} />
      <rect x="74.7" y="103.5" width="2.6" height="8.5" rx="1.3" fill="#ffffff" />
      <circle cx="76" cy="116" r="1.7" fill="#ffffff" />
      {/* 行3: 要確認 */}
      <rect x="100" y="132" width="86" height="9" rx="4.5" fill={C.tint} />
      <rect x="100" y="145" width="42" height="5.5" rx="2.75" fill={C.faint} />
      <circle cx="76" cy="142" r="13" fill={C.card} />
      <circle cx="76" cy="142" r="10" fill={C.confirm} />
      <path
        d="M72.8 138.5 c0 -3.2 6.6 -3.4 6.6 0 c0 2.3 -3.3 2.1 -3.3 4.6"
        stroke="#ffffff"
        strokeWidth="2.3"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="76.1" cy="146.8" r="1.6" fill="#ffffff" />
    </svg>
  );
}

/** 4. 装備も重量も、まとめて管理 — 主役のザックに装備チップと総重量が寄り添う */
export function MyGearIllustration({ className }: IllustrationProps) {
  return (
    <svg {...svgProps(className)}>
      <path d={BLOB_PATH} fill={C.blob} />
      {/* 主役: 丸みのあるザック(下部に流れる中緑バンド + 白い負形のポケット) */}
      <Shadow cx={192} cy={183} rx={46} />
      <path
        d="M152 90 C152 73 167 63 192 63 C217 63 232 73 232 90 L230 156 C230 169 215 177 192 177 C169 177 154 169 154 156 Z"
        fill={C.deep}
      />
      <path
        d="M152 118 C170 108 204 132 232 118 L230 156 C230 169 215 177 192 177 C169 177 154 169 154 156 Z"
        fill={C.mid}
      />
      <path d="M178 52 c4 -7 24 -7 28 0" stroke={C.deep} strokeWidth="3" strokeLinecap="round" />
      <rect x="166" y="52" width="52" height="24" rx="12" fill={C.mid} />
      <rect x="170" y="118" width="44" height="40" rx="14" fill="#ffffff" />
      <path d="M170 132 h44" stroke={C.tint} strokeWidth="2.5" />
      <rect x="187" y="100" width="10" height="12" rx="4" fill={C.beige} />
      {/* 総重量ピル(雨蓋に重ねる) */}
      <rect x="224" y="46" width="54" height="26" rx="13" fill={C.light} />
      <path d="M245 57 c0 -6 12 -6 12 0" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" />
      <rect x="243" y="57" width="16" height="9" rx="4.5" fill="#ffffff" />
      {/* 登録された装備チップ(白い円 + 深緑の単色グリフ) */}
      <g>
        <circle cx="64" cy="74" r="22" fill={C.card} stroke={C.hairline} />
        <path
          d="M52 82 v-11 c0 -3 2.4 -5.4 5.4 -5.4 h3.8 c2.7 0 4.8 2.1 4.8 4.8 v4.4 h6.6 c3 0 5.4 2.4 5.4 5.4 v1.8 Z"
          fill={C.deep}
        />
        <rect x="52" y="82" width="26" height="4.6" rx="2.3" fill={C.pine} />

        <circle cx="58" cy="132" r="22" fill={C.card} stroke={C.hairline} />
        <rect x="46" y="127" width="21" height="9" rx="4.5" stroke={C.deep} strokeWidth="2.2" />
        <rect x="60" y="125" width="9" height="13" rx="3.4" fill={C.deep} />
        <circle cx="64.5" cy="131.5" r="1.8" fill="#ffffff" />

        <circle cx="134" cy="170" r="22" fill={C.card} stroke={C.hairline} />
        <rect x="127" y="162" width="14" height="20" rx="5.5" fill={C.deep} />
        <rect x="130.5" y="157" width="7" height="7" rx="2.5" fill={C.pine} />
      </g>
    </svg>
  );
}

/** 5. 出発前の抜け漏れを、ひと目で確認 — 確認済みの装備と、丘で出発を待つザック */
export function FinalCheckIllustration({ className }: IllustrationProps) {
  return (
    <svg {...svgProps(className)}>
      <path d={BLOB_PATH} fill={C.blob} />
      {/* 朝日と遠景の峰(峰の陰から昇る) */}
      <circle cx="250" cy="38" r="12" fill={C.light} />
      <path
        d="M218 96 C234 68 246 56.5 252 53.6 C254.5 52.4 259.5 52.4 262 53.6 C272 59 282 76 294 96 Z"
        fill={C.pine}
      />
      {/* 前景: 山吹色の丘 */}
      <path
        d="M108 168 C140 150 190 150 224 160 C236 163.5 246 166 254 168 L254 175 L108 175 Z"
        fill={C.sunny}
      />
      <Shadow cx={172} cy={172} rx={56} ry={5.5} />
      {/* 主役: 出発を待つザック(マット + 白い負形のポケット + ポール) */}
      <rect x="132" y="42" width="72" height="20" rx="10" fill={C.beige} />
      <circle cx="146" cy="52" r="6.5" fill={C.paper} />
      <rect x="156" y="42" width="4.5" height="20" rx="2.25" fill={C.tan} />
      <rect x="184" y="42" width="4.5" height="20" rx="2.25" fill={C.tan} />
      <path
        d="M136 88 C136 72 149 62 169 62 C189 62 202 72 202 88 L200 152 C200 165 187 173 169 173 C151 173 138 165 138 152 Z"
        fill={C.deep}
      />
      <path
        d="M138 116 C154 108 184 128 202 116 L200 152 C200 165 187 173 169 173 C151 173 138 165 138 152 Z"
        fill={C.mid}
      />
      <rect x="164" y="96" width="10" height="12" rx="4" fill={C.beige} />
      <rect x="150" y="114" width="38" height="38" rx="13" fill="#ffffff" />
      <path d="M150 128 h38" stroke={C.tint} strokeWidth="2.5" />
      <path d="M210 84 L228 168" stroke={C.tan} strokeWidth="4.5" strokeLinecap="round" />
      <circle cx="209" cy="80" r="4.5" fill={C.dark} />
      <circle cx="225.5" cy="156" r="4" stroke={C.tan} strokeWidth="2" />
      {/* 確認済み装備チップ(チェックが縁を割る・グリフは深緑の単色) */}
      <g>
        <rect x="32" y="54" width="78" height="32" rx="16" fill={C.card} stroke={C.hairline} />
        <rect x="42" y="65" width="25" height="10.5" rx="5" stroke={C.deep} strokeWidth="2.2" />
        <rect x="59" y="62.5" width="10.5" height="14" rx="3.8" fill={C.deep} />
        <circle cx="64.5" cy="69.5" r="1.8" fill="#ffffff" />
        <CheckCircle cx={108} cy={70} r={8.5} />

        <rect x="32" y="98" width="78" height="32" rx="16" fill={C.card} stroke={C.hairline} />
        <path
          d="M44 109 l7.5 -5.5 h11 l7.5 5.5 l-3.8 5.8 l-2.7 -2.2 v12.4 h-13 v-12.4 l-2.7 2.2 Z"
          fill={C.deep}
        />
        <CheckCircle cx={108} cy={114} r={8.5} />

        <rect x="32" y="142" width="78" height="32" rx="16" fill={C.card} stroke={C.hairline} />
        <rect x="50" y="148" width="14" height="22" rx="5.5" fill={C.deep} />
        <rect x="53.5" y="143" width="7" height="7" rx="2.5" fill={C.pine} />
        <CheckCircle cx={108} cy={158} r={8.5} />
      </g>
    </svg>
  );
}
