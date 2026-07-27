import { ExternalLink, ImagePlus, Trash2 } from "lucide-react";
import Link from "next/link";

import { GearImageViewer } from "@/components/gear-image-viewer";
import { GearPhotoUpload } from "@/components/gear-photo-upload";
import { ConfirmSubmitButton } from "@/components/ui/confirm-dialog";
import { PageShell } from "@/components/ui/page-shell";
import { deleteGear } from "@/lib/actions/gear";
import { getUserGearById } from "@/lib/data/gear";
import { getGearDisplayWeightLabel } from "@/lib/gear-display";
import { buildGearHref, getPlanReturnTo } from "@/lib/plan-return-to";
import { weightTypeLabels } from "@/lib/i18n/labels";

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
  const officialUrl = gear.official_url ?? gear.gear_products?.official_url;
  const categoryLabel = gear.gear_categories?.name_ja ?? "-";
  const subcategoryLabel = gear.gear_subcategories?.name_ja ?? "-";
  const brandLine =
    [gear.brand, gear.model].filter(Boolean).join(" / ") || "ブランド未設定";
  const weightLabel = getGearDisplayWeightLabel(gear);
  const summaryCategoryLabel =
    subcategoryLabel !== "-" ? subcategoryLabel : categoryLabel;
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

            <div className="mt-5 grid grid-cols-2 gap-2">
              <SummaryPill label="重量" value={weightLabel} />
              <SummaryPill label="カテゴリー" value={summaryCategoryLabel} />
            </div>

            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <DetailRow label="ブランド" value={gear.brand} />
              <DetailRow label="モデル" value={gear.model} />
              <DetailRow label="カテゴリー" value={categoryLabel} />
              <DetailRow label="サブカテゴリー" value={subcategoryLabel} />
              <DetailRow
                label="重量タイプ"
                value={weightTypeLabels[gear.weight_type]}
              />
            </dl>
          </div>
        </div>
      </section>

      {(gear.memo || officialUrl) ? (
        <details className="rounded-[20px] bg-white p-5 shadow-sm">
          <summary className="cursor-pointer text-sm font-bold text-[#14724e]">
            その他の情報
          </summary>
          {gear.memo ? (
            <div className="mt-4">
              <h2 className="text-sm font-semibold text-stone-700">メモ</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-stone-600">
                {gear.memo}
              </p>
            </div>
          ) : null}
          {officialUrl ? (
            <a
              href={officialUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 font-bold text-[#14724e]"
            >
              公式製品ページ
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : null}
        </details>
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
