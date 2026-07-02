import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/format";

type EmptyStateProps = {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <Card className={cn("p-6 text-center", className)}>
      <p className="text-lg font-semibold text-ink">{title}</p>
      {description ? (
        <p className="mt-2 text-sm leading-6 text-stone-500">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </Card>
  );
}
