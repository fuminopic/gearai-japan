"use client";

import { AlertTriangle, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { deleteAccount } from "@/lib/actions/auth";

type AccountDeleteButtonProps = {
  gearCount: number;
};

type DialogStep = "closed" | "first" | "final";

export function AccountDeleteButton({ gearCount }: AccountDeleteButtonProps) {
  const router = useRouter();
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const [step, setStep] = useState<DialogStep>("closed");
  const [isPending, startTransition] = useTransition();

  function closeDialog() {
    if (isPending) {
      return;
    }

    setStep("closed");
  }

  function deleteCurrentAccount() {
    startTransition(async () => {
      await deleteAccount();
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setStep("first")}
        className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-bold text-red-700 transition active:scale-[0.98]"
      >
        <Trash2 aria-hidden className="h-4 w-4" />
        アカウントを削除
      </button>

      {step !== "closed" ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="account-delete-dialog-title"
          className="fixed inset-0 z-50 flex items-end bg-black/40 px-4 py-5 sm:items-center sm:justify-center"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-700">
                <AlertTriangle aria-hidden className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h2
                  id="account-delete-dialog-title"
                  className="text-lg font-bold tracking-normal text-ink"
                >
                  {step === "first"
                    ? "アカウントを削除しますか？"
                    : "本当に削除してもよろしいですか？"}
                </h2>
                {step === "first" ? (
                  <div className="mt-3 space-y-3 text-sm font-semibold leading-relaxed text-stone-600">
                    <p>
                      アカウントを削除すると、以下のデータがすべて完全に削除され、
                      復元することはできません。
                    </p>
                    <ul className="list-disc space-y-1 pl-5">
                      <li>登録したメールアドレス・パスワード</li>
                      <li>所有装備データ（{gearCount}件）</li>
                      <li>山行計画データ</li>
                      <li>アップロードした装備写真</li>
                    </ul>
                  </div>
                ) : (
                  <p className="mt-3 text-sm font-semibold leading-relaxed text-stone-600">
                    この操作は取り消せません。
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={closeDialog}
                disabled={isPending}
                aria-label="閉じる"
                className="rounded-lg p-2 text-stone-500 transition active:scale-[0.96] disabled:opacity-50"
              >
                <X aria-hidden className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                ref={cancelButtonRef}
                type="button"
                onClick={closeDialog}
                disabled={isPending}
                autoFocus
                className="h-11 rounded-xl border border-stone-200 bg-white px-4 text-sm font-bold text-stone-700 transition active:scale-[0.98] disabled:opacity-50"
              >
                キャンセル
              </button>
              {step === "first" ? (
                <button
                  type="button"
                  onClick={() => {
                    setStep("final");
                    window.setTimeout(() => cancelButtonRef.current?.focus(), 0);
                  }}
                  className="h-11 rounded-xl bg-stone-900 px-4 text-sm font-bold text-white transition active:scale-[0.98]"
                >
                  次へ
                </button>
              ) : (
                <button
                  type="button"
                  onClick={deleteCurrentAccount}
                  disabled={isPending}
                  className="h-11 rounded-xl bg-red-700 px-4 text-sm font-bold text-white transition active:scale-[0.98] disabled:opacity-60"
                >
                  {isPending ? "削除中..." : "削除する"}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
