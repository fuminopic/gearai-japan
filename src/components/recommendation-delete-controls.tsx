"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import {
  deleteAllRecommendations,
  deleteRecommendation
} from "@/lib/actions/ai";

type RecommendationDeleteButtonProps = {
  id: string;
};

export function RecommendationDeleteButton({
  id
}: RecommendationDeleteButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (!window.confirm("この旧推薦履歴を削除しますか？")) {
          return;
        }

        startTransition(async () => {
          await deleteRecommendation(id);
          router.refresh();
        });
      }}
      className="w-full rounded-lg border border-red-100 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-60"
    >
      {isPending ? "削除中..." : "削除"}
    </button>
  );
}

export function RecommendationDeleteAllButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (!window.confirm("旧推薦履歴をすべて削除しますか？")) {
          return;
        }

        startTransition(async () => {
          await deleteAllRecommendations();
          router.refresh();
        });
      }}
      className="w-full rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 disabled:opacity-60"
    >
      {isPending ? "削除中..." : "すべて削除"}
    </button>
  );
}
