import { getPackItemWeightGrams } from "@/lib/pack-summary";
import type { UserGear } from "@/lib/types";
import { formatWeight } from "@/lib/utils/format";

// マイパックを「雑誌風の1枚」に書き出す。
//
// 図1のように、自分の装備を並べて共有したい、という要望から。
// 出力は小紅書などの縦画像に合わせて 1242x1660(3:4)。
//
// DOM ではなく canvas に1ピクセルずつ描く。object-fit や box-shadow、
// 角丸クリップは無いので、等比縮小・shadowBlur・角丸パスを手で作る。
// 見た目はアプリのカードに寄せるが、影と角の細部は canvas なりの差が出る。

export const PACK_SHARE_IMAGE_WIDTH = 1242;
export const PACK_SHARE_IMAGE_HEIGHT = 1660;

// 4列4行。多い時は重い順に16件だけ載せる(大物が上に来る=分享の見栄え)。
const COLUMNS = 4;
const ROWS = 4;
const MAX_ITEMS = COLUMNS * ROWS;

const COLORS = {
  page: "#E5EBE9",
  bandFrom: "#1F7950",
  bandTo: "#81AB44",
  card: "#ffffff",
  ink: "#171a17",
  sub: "#8a8580",
  white: "#ffffff",
  footer: "#1b2a22"
};

const FONT = '-apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP", sans-serif';

type PackShareContext = {
  itemCount: number;
  totalWeightG: number;
  subtitle?: string;
};

export async function createPackShareImageBlob(
  items: readonly UserGear[],
  context: PackShareContext
): Promise<Blob> {
  const W = PACK_SHARE_IMAGE_WIDTH;
  const H = PACK_SHARE_IMAGE_HEIGHT;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas context is unavailable");
  }

  // 重い順に上限まで。0件でも枠は出す。
  const ordered = [...items]
    .sort((a, b) => (getPackItemWeightGrams(b) ?? 0) - (getPackItemWeightGrams(a) ?? 0))
    .slice(0, MAX_ITEMS);

  // 背景
  ctx.fillStyle = COLORS.page;
  ctx.fillRect(0, 0, W, H);

  // 上部バンド(アプリと同じ緑グラデ)
  const bandH = 132;
  const band = ctx.createLinearGradient(0, 0, W, bandH);
  band.addColorStop(0, COLORS.bandFrom);
  band.addColorStop(1, COLORS.bandTo);
  ctx.fillStyle = band;
  ctx.fillRect(0, 0, W, bandH);

  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = COLORS.white;
  ctx.textAlign = "left";
  ctx.font = `700 52px ${FONT}`;
  ctx.fillText("My Pack", 56, 84);

  // 中央ロゴ。文字ではなく、ホームの緑バンドと同じ白ワードマークを載せる。
  const wordmark = await loadLocalImage("/yamajitaku-wordmark-white.png");
  if (wordmark) {
    const logoH = 56;
    const logoW = (wordmark.width / wordmark.height) * logoH;
    ctx.drawImage(wordmark, (W - logoW) / 2, (bandH - logoH) / 2, logoW, logoH);
  }

  // 右肩に総重量。「総重量(小) 4.87(大) kg(小)」を右揃えで積む。
  // 右端から kg → 数値 → ラベル の順に幅を測って戻していく。
  const gramsValue = formatWeight(context.totalWeightG, { compact: true }); // 例 "4.87kg" or "870g"
  const unitMatch = gramsValue.match(/([\d.,]+)(\D+)$/);
  const numberPart = unitMatch ? unitMatch[1] : gramsValue;
  const unitPart = unitMatch ? unitMatch[2] : "";
  const right = W - 56;
  const baseline = 82;

  ctx.textAlign = "left";
  ctx.font = `500 30px ${FONT}`;
  const unitW = ctx.measureText(unitPart).width;
  ctx.font = `700 60px ${FONT}`;
  const numberW = ctx.measureText(numberPart).width;
  ctx.font = `500 26px ${FONT}`;
  const labelW = ctx.measureText("総重量").width;
  const gapSm = 10;

  const numberX = right - unitW - numberW;
  const labelX = numberX - gapSm - labelW;

  ctx.font = `500 26px ${FONT}`;
  ctx.fillText("総重量", labelX, baseline - 4);
  ctx.font = `700 60px ${FONT}`;
  ctx.fillText(numberPart, numberX, baseline + 6);
  ctx.font = `500 30px ${FONT}`;
  ctx.fillText(unitPart, right - unitW, baseline + 6);

  // グリッド
  const footerH = 96;
  const gridTop = bandH + 40;
  const gridBottom = H - footerH - 24;
  const sidePad = 40;
  const gap = 24;
  const gridW = W - sidePad * 2;
  const cellW = (gridW - gap * (COLUMNS - 1)) / COLUMNS;
  const cellH = (gridBottom - gridTop - gap * (ROWS - 1)) / ROWS;
  const imageH = cellH - 76; // 下76pxを名前と重量に使う

  const images = await Promise.all(ordered.map((item) => loadGearImage(item.image_url)));

  for (let i = 0; i < ordered.length; i += 1) {
    const item = ordered[i];
    const col = i % COLUMNS;
    const row = Math.floor(i / COLUMNS);
    const x = sidePad + col * (cellW + gap);
    const y = gridTop + row * (cellH + gap);

    // カード
    ctx.save();
    ctx.shadowColor = "rgba(23,26,23,0.12)";
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle = COLORS.card;
    roundRectPath(ctx, x, y, cellW, cellH, 28);
    ctx.fill();
    ctx.restore();

    // 画像(等比で内接、中央)
    const img = images[i];
    const boxX = x + 20;
    const boxY = y + 18;
    const boxW = cellW - 40;
    const boxH = imageH - 18;

    if (img) {
      const scale = Math.min(boxW / img.width, boxH / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      ctx.drawImage(img, boxX + (boxW - dw) / 2, boxY + (boxH - dh) / 2, dw, dh);
    } else {
      // 画像が無い/読み込めない時のプレースホルダ(汚染回避で失敗した時もここ)
      ctx.fillStyle = "#f1efe8";
      roundRectPath(ctx, boxX, boxY, boxW, boxH, 16);
      ctx.fill();
      ctx.fillStyle = "#c9c5bf";
      ctx.textAlign = "center";
      ctx.font = `700 40px ${FONT}`;
      ctx.fillText("？", boxX + boxW / 2, boxY + boxH / 2 + 14);
    }

    // 名前(1行・末尾省略)
    ctx.fillStyle = COLORS.ink;
    ctx.textAlign = "center";
    ctx.font = `700 24px ${FONT}`;
    drawTruncatedText(ctx, item.name, x + cellW / 2, y + cellH - 40, cellW - 28);

    // 重量
    const weightG = getPackItemWeightGrams(item);
    ctx.fillStyle = COLORS.sub;
    ctx.font = `500 22px ${FONT}`;
    ctx.fillText(
      weightG === null ? "重量未入力" : formatWeight(weightG),
      x + cellW / 2,
      y + cellH - 12
    );
  }

  // 下部フッター
  ctx.fillStyle = COLORS.footer;
  ctx.fillRect(0, H - footerH, W, footerH);
  ctx.fillStyle = COLORS.white;
  ctx.textAlign = "left";
  ctx.font = `500 26px ${FONT}`;
  drawTruncatedText(
    ctx,
    context.subtitle ?? `${context.itemCount.toLocaleString("ja-JP")}点のギア`,
    56,
    H - footerH / 2 + 9,
    W - 460
  );
  ctx.textAlign = "right";
  ctx.font = `500 24px ${FONT}`;
  ctx.fillText("山支度 ｜ 登山準備アプリ", W - 56, H - footerH / 2 + 9);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Failed to create image"));
      }
    }, "image/png");
  });
}

// ギア写真の読み込み。
//
// 最初は <img crossOrigin="anonymous"> で読んでいたが、同じURLをホームや
// マイパックが先に普通の <img>(CORSなし)で読んでキャッシュしていると、
// ブラウザがそのCORSなしのキャッシュを返してしまい、CORSチェックに落ちて
// onerror になる(一部だけ「？」になるのはこれ)。
//
// fetch(mode:cors) で blob を取り、object URL 経由で読み込む。object URL は
// 同一オリジン扱いなので canvas を汚染しない。cache:"reload" で <img> の
// 汚染キャッシュを避け、必ずCORSのレスポンスを取り直す。失敗しても全体は
// 止めず null(プレースホルダ)に落とす。
async function loadGearImage(url: string | null): Promise<HTMLImageElement | null> {
  if (!url) {
    return null;
  }

  try {
    const response = await fetch(url, { mode: "cors", cache: "reload" });
    if (!response.ok) {
      return null;
    }
    const blob = await response.blob();
    return await loadObjectUrlImage(blob);
  } catch (error) {
    console.error("Gear image fetch failed:", error);
    return null;
  }
}

function loadObjectUrlImage(blob: Blob): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      resolve(img);
      URL.revokeObjectURL(objectUrl);
    };
    img.onerror = () => {
      resolve(null);
      URL.revokeObjectURL(objectUrl);
    };
    img.src = objectUrl;
  });
}

// ローカルの静的画像(ロゴ)。同一オリジンなので汚染しない。
function loadLocalImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawTruncatedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number
) {
  if (ctx.measureText(text).width <= maxWidth) {
    ctx.fillText(text, x, y);
    return;
  }

  let clipped = text;
  while (clipped.length > 1 && ctx.measureText(`${clipped}…`).width > maxWidth) {
    clipped = clipped.slice(0, -1);
  }
  ctx.fillText(`${clipped}…`, x, y);
}

export async function sharePackImageIfAvailable(
  blob: Blob,
  fileName: string
): Promise<boolean> {
  if (typeof File === "undefined" || !navigator.share) {
    return false;
  }

  const file = new File([blob], fileName, { type: "image/png" });
  const shareData: ShareData = {
    files: [file],
    title: "マイパック",
    text: "山支度のマイパック"
  };

  if (navigator.canShare && !navigator.canShare(shareData)) {
    return false;
  }

  await navigator.share(shareData);
  return true;
}

export function downloadPackImage(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
