import Link from "next/link";

import { RecommendationHistoryList } from "@/components/recommendation-history-list";
import { getRecommendationHistory } from "@/lib/data/recommendations";

export default async function RecommendationHistoryPage() {
  const records = await getRecommendationHistory();

  return (
    <div className="space-y-5">
      <section className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-forest-700">推薦履歴</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink">
            AI推薦履歴
          </h1>
        </div>
        <Link
          href="/ai"
          className="rounded-lg bg-forest-700 px-5 py-3 text-sm font-semibold text-white"
        >
          新規作成
        </Link>
      </section>
      <RecommendationHistoryList records={records} />
    </div>
  );
}
