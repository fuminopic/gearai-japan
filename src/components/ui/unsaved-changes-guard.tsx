"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";

// 入力途中で離れたときに、黙って消えないようにする。
//
// ギア登録は入力が20項目あり、プロフィールも長い。どちらにも戻るボタンを
// 付けたので、途中で抜けること自体は起きやすくなった。
//
// フォーム側には手を入れない。囲っている <form> を自分で探して、最初の
// input/change で「触った」と見なす。中身の state を知る必要がないので、
// 1800行あるギアのフォームを触らずに済む。
export function UnsavedChangesGuard({
  title = "入力を破棄しますか？",
  description = "保存していない内容は失われます。"
}: {
  title?: string;
  description?: string;
}) {
  const router = useRouter();
  const markerRef = useRef<HTMLSpanElement>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    const form = markerRef.current?.closest("form");

    if (!form) {
      return;
    }

    function markDirty() {
      setIsDirty(true);
    }

    function markClean() {
      setIsDirty(false);
    }

    form.addEventListener("input", markDirty);
    form.addEventListener("change", markDirty);
    form.addEventListener("submit", markClean);

    return () => {
      form.removeEventListener("input", markDirty);
      form.removeEventListener("change", markDirty);
      form.removeEventListener("submit", markClean);
    };
  }, []);

  useEffect(() => {
    if (!isDirty) {
      return;
    }

    // リロードやタブを閉じる操作向け。アプリ内の遷移はこれでは拾えないので
    // 下のクリック監視と併用する。
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);

  useEffect(() => {
    if (!isDirty) {
      return;
    }

    // PageHeader の戻るリンクだけを対象にする。フォーム内のリンクや
    // 外部リンクは止めない。
    function handleClick(event: MouseEvent) {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const link = target.closest("a[data-guarded-back]");
      const href = link?.getAttribute("href");

      if (!href) {
        return;
      }

      event.preventDefault();
      setPendingHref(href);
    }

    document.addEventListener("click", handleClick, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
    };
  }, [isDirty]);

  return (
    <>
      <span ref={markerRef} hidden aria-hidden="true" />
      <ConfirmDialog
        open={pendingHref !== null}
        title={title}
        description={description}
        cancelLabel="入力を続ける"
        onCancel={() => setPendingHref(null)}
      >
        <button
          type="button"
          onClick={() => {
            const href = pendingHref;
            setPendingHref(null);
            setIsDirty(false);

            if (href) {
              router.push(href as Route);
            }
          }}
          className="inline-flex h-11 w-full items-center justify-center rounded-full bg-red-600 text-sm font-bold text-white transition active:scale-[0.99]"
        >
          破棄して戻る
        </button>
      </ConfirmDialog>
    </>
  );
}
