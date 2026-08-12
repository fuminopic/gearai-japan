"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  migrateTripPlanChecklistOnlyState,
  writeTripPlanChecklistOnlyItemState
} from "@/lib/trip-plan-checklist-item-state-client";
import {
  applyChecklistOnlyItemState,
  type TripPlanChecklistItemState
} from "@/lib/trip-plan-checklist-item-state";
import { readTripPlanChecklistOnlyIds } from "@/lib/trip-plan-storage";

type ChecklistOnlySyncStatus = "idle" | "syncing" | "ready" | "error";

export function useTripPlanChecklistOnlyState({
  userId,
  planId
}: {
  userId: string | null;
  planId: string | null;
}) {
  const [serverStates, setServerStates] = useState<TripPlanChecklistItemState[] | null>(
    null
  );
  const [pendingStates, setPendingStates] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<ChecklistOnlySyncStatus>("idle");
  const [retryNonce, setRetryNonce] = useState(0);
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const keyRef = useRef("");

  const enqueue = useCallback((work: () => Promise<void>) => {
    const scheduled = queueRef.current.then(work, work);
    queueRef.current = scheduled.catch(() => undefined);
    return scheduled;
  }, []);

  useEffect(() => {
    const key = userId && planId ? `${userId}:${planId}` : "";
    keyRef.current = key;
    setPendingStates({});
    setServerStates(null);

    if (!userId || !planId) {
      setStatus("idle");
      return;
    }

    let active = true;
    setStatus("syncing");

    void enqueue(async () => {
      try {
        const result = await migrateTripPlanChecklistOnlyState({ userId, planId });

        if (!active || keyRef.current !== key) {
          return;
        }

        setServerStates(result.states);
        setStatus("ready");
      } catch (error) {
        console.error("Checklist-only state migration failed:", error);

        if (!active || keyRef.current !== key) {
          return;
        }

        // Keep the legacy value visible and retryable. It is deliberately not
        // marked as migrated until Supabase has confirmed the write.
        const localIds = readTripPlanChecklistOnlyIds({ userId, planId }).value;
        setServerStates(
          localIds.map((checklist_item_id) => ({
            checklist_item_id,
            is_checked: true
          }))
        );
        setStatus("error");
      }
    });

    return () => {
      active = false;
    };
  }, [enqueue, planId, retryNonce, userId]);

  const checkedIds = Object.entries(pendingStates).reduce(
    (ids, [itemId, isChecked]) =>
      applyChecklistOnlyItemState({ checkedIds: ids, itemId, isChecked }),
    (serverStates ?? []).filter((state) => state.is_checked).map((state) => state.checklist_item_id)
  );

  const setItemChecked = useCallback(
    (checklistItemId: string, isChecked: boolean) => {
      if (!userId || !planId) {
        return;
      }

      const key = `${userId}:${planId}`;
      setPendingStates((current) => ({ ...current, [checklistItemId]: isChecked }));

      void enqueue(async () => {
        try {
          await writeTripPlanChecklistOnlyItemState({
            userId,
            planId,
            checklistItemId,
            isChecked
          });

          if (keyRef.current !== key) {
            return;
          }

          setServerStates((current) => {
            const byId = new Map(
              (current ?? []).map((state) => [state.checklist_item_id, state])
            );
            byId.set(checklistItemId, {
              checklist_item_id: checklistItemId,
              is_checked: isChecked
            });
            return Array.from(byId.values());
          });
          setPendingStates((current) => {
            // A newer interaction for the same item may already be queued.
            // Do not let an older successful request clear that newer intent.
            if (current[checklistItemId] !== isChecked) {
              return current;
            }
            const next = { ...current };
            delete next[checklistItemId];
            return next;
          });
          setStatus("ready");
        } catch (error) {
          console.error("Checklist-only state write failed:", error);

          if (keyRef.current !== key) {
            return;
          }

          setPendingStates((current) => {
            // As above, retain a newer queued choice rather than rolling it
            // back because an earlier request failed.
            if (current[checklistItemId] !== isChecked) {
              return current;
            }
            const next = { ...current };
            delete next[checklistItemId];
            return next;
          });
          setStatus("error");
        }
      });
    },
    [enqueue, planId, userId]
  );

  const retry = useCallback(() => {
    setRetryNonce((current) => current + 1);
  }, []);

  return { checkedIds, retry, setItemChecked, status };
}
