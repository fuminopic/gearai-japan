import Link from "next/link";

import { RecommendationHistoryList } from "@/components/recommendation-history-list";
import { getRecommendationHistory } from "@/lib/data/recommendations";

type RecommendationHistoryPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function RecommendationHistoryPage({
  searchParams
}: RecommendationHistoryPageProps) {
  const params = await searchParams;
  const records = await getRecommendationHistory();

  return (
    <div className="space-y-5">
      <section className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-forest-700">過去の記録</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink">
            過去の推薦履歴
          </h1>
        </div>
        <Link
          href="/plan"
          className="rounded-lg bg-forest-700 px-5 py-3 text-sm font-semibold text-white"
        >
          山行計画を作成
        </Link>
      </section>
      {params.error ? (
        <p className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {params.error}
        </p>
      ) : null}
      <RecommendationHistoryList records={records} />
    </div>
  );
}
