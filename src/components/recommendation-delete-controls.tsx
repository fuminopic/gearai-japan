"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { ConfirmActionButton } from "@/components/ui/confirm-dialog";
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
    <ConfirmActionButton
      title="この履歴を削除しますか？"
      description="削除すると元に戻せません。"
      confirmLabel="削除する"
      pendingLabel="削除中..."
      isPending={isPending}
      onConfirm={() => {
        startTransition(async () => {
          await deleteRecommendation(id);
          router.refresh();
        });
      }}
      className="w-full rounded-lg border border-red-100 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-60"
    >
      削除
    </ConfirmActionButton>
  );
}

export function RecommendationDeleteAllButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <ConfirmActionButton
      title="履歴をすべて削除しますか？"
      description="削除すると元に戻せません。"
      confirmLabel="すべて削除する"
      pendingLabel="削除中..."
      isPending={isPending}
      onConfirm={() => {
        startTransition(async () => {
          await deleteAllRecommendations();
          router.refresh();
        });
      }}
      className="w-full rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 disabled:opacity-60"
    >
      すべて削除
    </ConfirmActionButton>
  );
}
