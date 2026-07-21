import { ExternalLink, ImagePlus, Trash2 } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { GearImageViewer } from "@/components/gear-image-viewer";
import { GearPhotoUpload } from "@/components/gear-photo-upload";
import { ConfirmSubmitButton } from "@/components/ui/confirm-dialog";
import { PageShell } from "@/components/ui/page-shell";
import { deleteGear } from "@/lib/actions/gear";
import { getUserGearById } from "@/lib/data/gear";
import { getGearDisplayWeightLabel } from "@/lib/gear-display";
import { buildGearHref, getPlanReturnTo } from "@/lib/plan-return-to";
import {
  statusLabels,
  verificationStatusLabels,
  weightTypeLabels
} from "@/lib/i18n/labels";
import { formatJpy } from "@/lib/utils/format";

type GearDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    returnTo?: string;
  }>;
};

export default async function GearDetailPage({
  params,
  searchParams
}: GearDetailPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const returnTo = getPlanReturnTo(query.returnTo);
  const gear = await getUserGearById(id);
  const verificationStatus =
    gear.gear_products?.verification_status ?? "unverified";
  const verification = verificationStatusLabels[verificationStatus];
  const officialUrl = gear.official_url ?? gear.gear_products?.official_url;
  const msrpSourceUrl = gear.gear_products?.msrp_source_url;
  const categoryLabel = gear.gear_categories?.name_ja ?? "-";
  const subcategoryLabel = gear.gear_subcategories?.name_ja ?? "-";
  const brandLine =
    [gear.brand, gear.model].filter(Boolean).join(" / ") || "ブランド未設定";
  const weightLabel = getGearDisplayWeightLabel(gear);
  const priceLabel = formatNullableJpy(gear.msrp_jpy);
  const summaryCategoryLabel =
    subcategoryLabel !== "-" ? subcategoryLabel : categoryLabel;
  const dataSourceLabel = gear.gear_products ? "製品カタログ" : "自分で登録";
  const dataSourceDescription = gear.gear_products
    ? "製品カタログの確認情報をもとに表示しています。"
    : "自分で登録した情報をもとに表示しています。必要に応じて編集してください。";
  // 官方目录装备(有 gear_products 关联)= 只读;自己添加的才可编辑
  const isCatalog = Boolean(gear.gear_products);
  const gearDisplayName = gear.name || brandLine;

  return (
    <PageShell
      backHref={buildGearHref("/gear", returnTo)}
      backLabel="マイギアへ戻る"
      eyebrow="ギア詳細"
      title={gearDisplayName}
      action={
        !isCatalog ? (
          <Link
            href={buildGearHref(`/gear/${gear.id}/edit`, returnTo)}
            className="inline-flex h-10 items-center justify-center rounded-full bg-white px-5 text-sm font-bold text-[#14724e] shadow-sm transition active:scale-95"
          >
            編集
          </Link>
        ) : null
      }
    >

      <section className="overflow-hidden rounded-[20px] bg-white shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[22rem_minmax(0,1fr)]">
          <div className="border-b border-stone-100 bg-stone-50/70 p-5 lg:border-b-0 lg:border-r">
            {isCatalog ? (
              gear.image_url ? (
                <GearImageViewer
                  src={gear.image_url}
                  alt={gear.name}
                  className="h-72 sm:h-80 lg:h-96"
                />
              ) : (
                <div className="flex h-72 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-stone-300 bg-white text-center text-stone-400 sm:h-80 lg:h-96">
                  <ImagePlus className="h-8 w-8" />
                  <p className="text-sm font-semibold">写真未登録</p>
                </div>
              )
            ) : (
              // 自分で登録したギアは、その場で写真を追加・変更・削除できる。
              <GearPhotoUpload
                gearId={gear.id}
                gearName={gear.name}
                initialImageUrl={gear.image_url}
              />
            )}
          </div>

          <div className="p-5 sm:p-6">
            <p className="text-sm font-bold text-stone-500">{brandLine}</p>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <SummaryPill label="重量" value={weightLabel} />
              <SummaryPill label="カテゴリー" value={summaryCategoryLabel} />
              <SummaryPill label="所有状態" value={statusLabels[gear.status]} />
            </div>

            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <DetailRow label="ブランド" value={gear.brand} />
              <DetailRow label="モデル" value={gear.model} />
              <DetailRow label="カテゴリー" value={categoryLabel} />
              <DetailRow label="サブカテゴリー" value={subcategoryLabel} />
              <DetailRow label="容量" value={gear.volume} />
              <DetailRow label="サイズ" value={gear.size} />
              <DetailRow label="対応人数" value={gear.capacity} />
              <DetailRow label="カラー" value={gear.color} />
              <DetailRow
                label="重量タイプ"
                value={weightTypeLabels[gear.weight_type]}
              />
            </dl>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <InfoCard title="データ確認" description={dataSourceDescription}>
          <DetailRow label="データ区分" value={dataSourceLabel} />
          <DetailRow label="カタログ確認" value={verification.label} />
          <DetailRow
            label="確認日"
            value={formatDateLabel(gear.gear_products?.last_verified_at)}
          />
          <div className="pt-1 sm:col-span-2">
            <dt className="text-sm text-stone-500">公式ページ</dt>
            <dd className="mt-1">
              {officialUrl ? (
                <a
                  href={officialUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 font-bold text-[#14724e]"
                >
                  公式製品ページ
                  <ExternalLink className="h-4 w-4" />
                </a>
              ) : (
                <span className="font-semibold text-ink">-</span>
              )}
            </dd>
          </div>
        </InfoCard>

        <InfoCard
          title="参考情報"
          description="価格情報は登録データの参考として表示しています。"
        >
          <DetailRow
            label="メーカー希望小売価格"
            value={priceLabel}
          />
          {msrpSourceUrl ? (
            <div className="pt-1">
              <dt className="text-sm text-stone-500">価格確認ページ</dt>
              <dd className="mt-1">
                <a
                  href={msrpSourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 font-bold text-[#14724e]"
                >
                  価格確認ページ
                  <ExternalLink className="h-4 w-4" />
                </a>
              </dd>
            </div>
          ) : null}
        </InfoCard>
      </section>

      {gear.memo ? (
        <section className="rounded-[20px] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-ink">メモ</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-stone-600">
            {gear.memo}
          </p>
        </section>
      ) : null}

      <section className="rounded-[20px] border border-red-100 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-ink">ギアの管理</h2>
        <p className="mt-2 text-sm leading-6 text-stone-500">
          このギアをマイギアから削除します。削除後は元に戻せません。
        </p>
        <form action={deleteGear.bind(null, gear.id)} className="mt-4">
          <input type="hidden" name="returnTo" value={returnTo ?? ""} />
          <ConfirmSubmitButton
            title="このギアを削除しますか？"
            description={`${gearDisplayName}を削除します。削除すると元に戻せません。`}
            confirmLabel="削除する"
            pendingLabel="削除中..."
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-red-50 px-4 py-3 text-sm font-bold text-red-700 disabled:opacity-60 sm:w-auto"
          >
            <Trash2 className="h-4 w-4" />
            このギアを削除
          </ConfirmSubmitButton>
        </form>
      </section>
    </PageShell>
  );
}

function SummaryPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-stone-50 px-3 py-3">
      <p className="text-[11px] font-semibold text-stone-400">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}

function InfoCard({
  title,
  description,
  children
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[20px] bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      {description ? (
        <p className="mt-2 text-sm leading-6 text-stone-500">{description}</p>
      ) : null}
      <dl className="mt-5 grid gap-4 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

function DetailRow({
  label,
  value
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div>
      <dt className="text-sm text-stone-500">{label}</dt>
      <dd className="mt-1 font-semibold text-ink">{value || "-"}</dd>
    </div>
  );
}

function formatNullableJpy(value: number | null) {
  return value === null ? "-" : formatJpy(value);
}

function formatDateLabel(value?: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("ja-JP");
}
