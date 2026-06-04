import { AlertTriangle, BadgeCheck, CircleDollarSign, Link2, Scale } from "lucide-react";

import { StatCard } from "@/components/stat-card";
import { getDataQualitySummary } from "@/lib/data/data-quality";

export default async function DataQualityPage() {
  const summary = await getDataQualitySummary();

  return (
    <div className="space-y-5">
      <section>
        <p className="text-sm font-semibold text-forest-700">Admin</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink">
          Data Quality
        </h1>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="MSRP 缺失"
          value={`${summary.missingMsrpCount.toLocaleString("ja-JP")} 件`}
          detail="gear_products.msrp_jpy"
          icon={<CircleDollarSign className="h-5 w-5" />}
        />
        <StatCard
          label="重量缺失"
          value={`${summary.missingWeightCount.toLocaleString("ja-JP")} 件`}
          detail="official_weight_grams / weight_grams"
          icon={<Scale className="h-5 w-5" />}
        />
        <StatCard
          label="官方链接缺失"
          value={`${summary.missingOfficialUrlCount.toLocaleString("ja-JP")} 件`}
          detail="gear_products.official_url"
          icon={<Link2 className="h-5 w-5" />}
        />
        <StatCard
          label="分类缺失"
          value={`${summary.missingCategoryCount.toLocaleString("ja-JP")} 件`}
          detail="gear_products.category_id"
          icon={<AlertTriangle className="h-5 w-5" />}
        />
        <StatCard
          label="未验证装备数量"
          value={`${summary.unverifiedCount.toLocaleString("ja-JP")} 件`}
          detail="unverified / needs_review"
          icon={<BadgeCheck className="h-5 w-5" />}
        />
      </section>
    </div>
  );
}
