"use client";

import { useRouter } from "next/navigation";
import type { Route } from "next";
import { useCallback, useEffect, useState } from "react";

import { ConfirmDialog, confirmButtonClassName } from "@/components/ui/confirm-dialog";
import {
  getNativeNotificationPermission,
  getNativeNotificationPromptDeferred,
  hasNativeNotificationBridge,
  type NativeImmediateChecklistReminder,
  openNativeNotificationSettings,
  reconcileNativeTripReminders,
  requestNativeNotificationPermission,
  setNativeNotificationPromptDeferred
} from "@/lib/native-notification-bridge";

type DialogKind = "permission" | "settings" | null;

const permissionTitle = "山行前日の準備をお知らせします";
const permissionDescription =
  "山行日の前日に、装備チェックのリマインダーをお送りします。";

export function NativeNotificationCoordinator() {
  const router = useRouter();
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [isPending, setIsPending] = useState(false);
  const [immediateReminder, setImmediateReminder] =
    useState<NativeImmediateChecklistReminder | null>(null);

  const reconcileReminders = useCallback(async () => {
    const permission = await getNativeNotificationPermission();
    const syncResult = await reconcileNativeTripReminders();
    const nextImmediate = syncResult?.immediate[0] ?? null;
    if (nextImmediate) setImmediateReminder(nextImmediate);
    return permission;
  }, []);

  useEffect(() => {
    if (!hasNativeNotificationBridge()) return;

    void (async () => {
      try {
        const permission = await reconcileReminders();
        if (permission !== "prompt") return;
        if (!(await getNativeNotificationPromptDeferred())) {
          setDialog("permission");
        }
      } catch (error) {
        console.info("[NativeNotifications] initial check unavailable", error);
      }
    })();

    const onReminderSync = (event: Event) => {
      const kind = (event as CustomEvent<{ kind?: string }>).detail?.kind;
      void (async () => {
        try {
          const permission = await reconcileReminders();
          if (permission === "prompt" && kind === "created") setDialog("permission");
          if (permission === "denied" && kind === "created") setDialog("settings");
        } catch (error) {
          console.info("[NativeNotifications] plan sync unavailable", error);
        }
      })();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void reconcileReminders().catch((error) =>
          console.info("[NativeNotifications] foreground sync unavailable", error)
        );
      }
    };

    window.addEventListener("yamajitaku:trip-plan-reminder-sync", onReminderSync);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("yamajitaku:trip-plan-reminder-sync", onReminderSync);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [reconcileReminders]);

  async function requestPermission() {
    setIsPending(true);
    try {
      await setNativeNotificationPromptDeferred(false);
      const permission = await requestNativeNotificationPermission();
      if (permission === "granted") await reconcileReminders();
      setDialog(null);
    } catch (error) {
      console.info("[NativeNotifications] permission request failed", error);
    } finally {
      setIsPending(false);
    }
  }

  async function deferPermission() {
    setIsPending(true);
    try {
      await setNativeNotificationPromptDeferred(true);
      setDialog(null);
    } finally {
      setIsPending(false);
    }
  }

  function openImmediateChecklist() {
    if (!immediateReminder) return;
    const route = immediateReminder.route;
    setImmediateReminder(null);
    router.push(route as Route);
  }

  return (
    <>
      <ConfirmDialog
        open={dialog === "permission" && immediateReminder === null}
        title={permissionTitle}
        description={permissionDescription}
        cancelLabel="あとで"
        onCancel={() => void deferPermission()}
      >
        <button type="button" disabled={isPending} onClick={() => void requestPermission()} className={confirmButtonClassName.replace("bg-red-600", "bg-[#14724e]")}>
          {isPending ? "確認中..." : "通知を許可する"}
        </button>
      </ConfirmDialog>
      <ConfirmDialog
        open={dialog === "settings" && immediateReminder === null}
        title="通知がオフになっています"
        description="山行前日のリマインダーを受け取るには、設定で通知をオンにしてください。"
        cancelLabel="今はしない"
        onCancel={() => setDialog(null)}
      >
        <button type="button" onClick={() => void openNativeNotificationSettings()} className={confirmButtonClassName.replace("bg-red-600", "bg-[#14724e]")}>
          設定を開く
        </button>
      </ConfirmDialog>
      <ConfirmDialog
        open={immediateReminder !== null}
        title={immediateReminder?.title ?? ""}
        description={immediateReminder?.body}
        cancelLabel="あとで"
        onCancel={() => setImmediateReminder(null)}
      >
        <button type="button" onClick={openImmediateChecklist} className={confirmButtonClassName.replace("bg-red-600", "bg-[#14724e]")}>
          チェックリストを確認
        </button>
      </ConfirmDialog>
    </>
  );
}
