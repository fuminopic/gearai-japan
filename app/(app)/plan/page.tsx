import {
  PlanPageContent,
  type PlanPageContentProps
} from "@/components/plan-page-content";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function PlanPage(props: PlanPageContentProps) {
  return <PlanPageContent {...props} />;
}
