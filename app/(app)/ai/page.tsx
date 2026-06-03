import { AIRecommendationForm } from "@/components/ai-recommendation-form";

type AIPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function AIPage({ searchParams }: AIPageProps) {
  const params = await searchParams;

  return <AIRecommendationForm error={params.error} />;
}

