import { RecommendationDetail } from "@/components/recommendation-detail";
import { getRecommendationById } from "@/lib/data/recommendations";

type RecommendationPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function RecommendationPage({ params }: RecommendationPageProps) {
  const { id } = await params;
  const record = await getRecommendationById(id);

  return <RecommendationDetail record={record} />;
}

