"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

import { buildGearHref, getCurrentPlanReturnTo } from "@/lib/plan-return-to";

export function PlanAwareGearLink({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const returnTo = getCurrentPlanReturnTo(pathname, searchParams.toString());

  return (
    <Link href={buildGearHref("/gear", returnTo)} prefetch className={className}>
      {children}
    </Link>
  );
}
