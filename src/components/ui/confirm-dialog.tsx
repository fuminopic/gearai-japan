"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { useState } from "react";

// アプリ内の確認ダイアログ。
//
// これまで削除系は window.confirm を使っていたが、iOS の WebView では
// システムのアラートとして出るためアプリの外に出た感じになる。
//
// 実装は素の div のオーバーレイ。<dialog> の showModal() は Safari 15.4
// からで、このアプリの iOS Deployment Target は 15.0 なので使わない。

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  cancelLabel: string;
  onCancel: () => void;
  children: ReactNode;
};

export function ConfirmDialog({
  open,
  title,
  description,
  cancelLabel,
  onCancel,
  children
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    // 背後のページがスクロールしてしまうのを止める。
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCancel();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onCancel]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onCancel();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-[320px] rounded-[20px] bg-white p-5 text-left shadow-sm"
      >
        <h2 className="text-base font-bold leading-relaxed text-ink">{title}</h2>
        {description ? (
          <p className="mt-2 text-sm font-semibold leading-relaxed text-stone-500">
            {description}
          </p>
        ) : null}
        <div className="mt-5 grid gap-2">
          {children}
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="inline-flex h-11 w-full items-center justify-center rounded-full border border-stone-200 bg-white text-sm font-bold text-stone-700 transition active:scale-[0.99]"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export const confirmButtonClassName =
  "inline-flex h-11 w-full items-center justify-center rounded-full bg-red-600 text-sm font-bold text-white transition active:scale-[0.99] disabled:opacity-70";

type SharedProps = {
  children: ReactNode;
  className?: string;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  pendingLabel?: string;
};

/**
 * 親の <form> をそのまま送信する確認ボタン。
 *
 * 確認側を type="submit" にしてあるので、Server Action の呼び出し方も
 * useFormStatus の pending も今までどおり動く。ダイアログは form の中に
 * 描画する必要があるため、ポータルは使わない。
 */
export function ConfirmSubmitButton({
  children,
  className,
  title,
  description,
  confirmLabel,
  cancelLabel = "キャンセル",
  pendingLabel = "処理中..."
}: SharedProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { pending } = useFormStatus();

  useEffect(() => {
    if (pending) {
      setIsOpen(false);
    }
  }, [pending]);

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() => setIsOpen(true)}
        className={className}
      >
        {pending ? pendingLabel : children}
      </button>
      <ConfirmDialog
        open={isOpen}
        title={title}
        description={description}
        cancelLabel={cancelLabel}
        onCancel={() => setIsOpen(false)}
      >
        <button type="submit" className={confirmButtonClassName}>
          {confirmLabel}
        </button>
      </ConfirmDialog>
    </>
  );
}

type ConfirmActionButtonProps = SharedProps & {
  onConfirm: () => void;
  isPending?: boolean;
};

/** form を持たず、onClick でアクションを呼ぶ側の確認ボタン。 */
export function ConfirmActionButton({
  children,
  className,
  title,
  description,
  confirmLabel,
  cancelLabel = "キャンセル",
  pendingLabel = "処理中...",
  onConfirm,
  isPending = false
}: ConfirmActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isPending) {
      setIsOpen(false);
    }
  }, [isPending]);

  return (
    <>
      <button
        type="button"
        disabled={isPending}
        onClick={() => setIsOpen(true)}
        className={className}
      >
        {isPending ? pendingLabel : children}
      </button>
      <ConfirmDialog
        open={isOpen}
        title={title}
        description={description}
        cancelLabel={cancelLabel}
        onCancel={() => setIsOpen(false)}
      >
        <button
          type="button"
          className={confirmButtonClassName}
          onClick={() => {
            setIsOpen(false);
            onConfirm();
          }}
        >
          {confirmLabel}
        </button>
      </ConfirmDialog>
    </>
  );
}
