"use client";

import { Minus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { removePackItem } from "@/lib/actions/pack";

export function PackRemoveButton({ gearId }: { gearId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      aria-label="パックから外す"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const result = await removePackItem(gearId);

          if (result.ok) {
            router.refresh();
          }
        });
      }}
      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 transition active:scale-95 disabled:opacity-50"
    >
      <Minus aria-hidden className="h-5 w-5" strokeWidth={2.5} />
    </button>
  );
}
