import { ExternalLink } from "lucide-react";
import Link from "next/link";

import { getUserGearById } from "@/lib/data/gear";
import { statusLabels, verificationStatusLabels } from "@/lib/i18n/labels";
import { formatJpy, formatWeight } from "@/lib/utils/format";

type GearDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function GearDetailPage({ params }: GearDetailPageProps) {
  const { id } = await params;
  const gear = await getUserGearById(id);
  const verificationStatus =
    gear.gear_products?.verification_status ?? "unverified";
  const verification = verificationStatusLabels[verificationStatus];
  const officialUrl = gear.official_url ?? gear.gear_products?.official_url;
  const msrpSourceUrl = gear.gear_products?.msrp_source_url;

  return (
    <div className="space-y-5">
      <section className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-forest-700">装備詳細</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink">
            {gear.name}
          </h1>
          <p className="mt-2 text-sm text-stone-500">
            {[gear.brand, gear.model].filter(Boolean).join(" / ")}
          </p>
        </div>
        <Link
          href={`/gear/${gear.id}/edit`}
          className="rounded-lg bg-forest-700 px-5 py-3 text-sm font-semibold text-white"
        >
          編集
        </Link>
      </section>

      <section className="rounded-lg bg-white p-5 shadow-soft">
        <span
          className={`inline-flex rounded-lg border px-3 py-1 text-sm font-semibold ${verification.className}`}
        >
          {verification.marker} {verification.label}
        </span>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-stone-500">verification_status</dt>
            <dd className="mt-1 font-semibold text-ink">{verificationStatus}</dd>
          </div>
          <div>
            <dt className="text-sm text-stone-500">last_verified_at</dt>
            <dd className="mt-1 font-semibold text-ink">
              {gear.gear_products?.last_verified_at ?? "-"}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-stone-500">重量</dt>
            <dd className="mt-1 font-semibold text-ink">
              {formatWeight(
                Number(
                  gear.measured_weight_grams ??
                    gear.official_weight_grams ??
                    gear.weight_grams
                )
              )}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-stone-500">MSRP</dt>
            <dd className="mt-1 font-semibold text-ink">
              {formatJpy(Number(gear.msrp_jpy ?? 0))}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-stone-500">購入価格</dt>
            <dd className="mt-1 font-semibold text-ink">
              {formatJpy(Number(gear.purchase_price_jpy ?? 0))}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-stone-500">ステータス</dt>
            <dd className="mt-1 font-semibold text-ink">
              {statusLabels[gear.status]}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-stone-500">カテゴリー</dt>
            <dd className="mt-1 font-semibold text-ink">
              {[gear.gear_categories?.name_ja, gear.gear_subcategories?.name_ja]
                .filter(Boolean)
                .join(" / ") || "-"}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-stone-500">容量・サイズ</dt>
            <dd className="mt-1 font-semibold text-ink">
              {[gear.volume, gear.capacity, gear.size].filter(Boolean).join(" / ") ||
                "-"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg bg-white p-5 shadow-soft">
        <h2 className="text-lg font-semibold text-ink">公式ソース</h2>
        <div className="mt-4 space-y-3 text-sm">
          {officialUrl ? (
            <a
              href={officialUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 font-semibold text-forest-700"
            >
              公式製品ページ
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : (
            <p className="text-stone-500">公式製品ページなし</p>
          )}
          {msrpSourceUrl ? (
            <a
              href={msrpSourceUrl}
              target="_blank"
              rel="noreferrer"
              className="block font-semibold text-forest-700"
            >
              MSRP source
            </a>
          ) : null}
        </div>
      </section>
    </div>
  );
}
