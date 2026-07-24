"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode
} from "react";

import { addPackItems, removePackItem } from "@/lib/actions/pack";
import { hapticSelection } from "@/lib/haptics";
import { formatWeight } from "@/lib/utils/format";

// マイギアの各行からマイパックを出し入れするための状態。
//
// 以前は「マイギアで登録 →(別画面)/pack/select で選び直す」の二段階だったため、
// 装備庫とパックが別物に見えていた。行の右のスイッチで直接出し入れできるよう
// にして、画面下のバーに現在のパックを出すことで、パックがマイギアの部分集合
// であることが分かるようにする。
//
// 反映は楽観更新。サーバー側が失敗したらスイッチとバーを元に戻し、行にエラー
// を出す(pack-contents.tsx の削除処理と同じ考え方)。

type PackContextValue = {
  packedIds: Set<string>;
  pendingIds: Set<string>;
  toggle: (input: { gearId: string; weightGrams: number; packed: boolean }) => void;
  itemCount: number;
  knownWeightG: number;
  error: string | null;
};

const PackContext = createContext<PackContextValue | null>(null);

function usePackControls() {
  const value = useContext(PackContext);

  if (!value) {
    throw new Error("GearPackProvider が必要です");
  }

  return value;
}

export function GearPackProvider({
  initialPackedIds,
  initialItemCount,
  initialKnownWeightG,
  children
}: {
  initialPackedIds: string[];
  /** 一覧に出ていないギアも含む、パック全体の点数と重量。 */
  initialItemCount: number;
  initialKnownWeightG: number;
  children: ReactNode;
}) {
  const [packedIds, setPackedIds] = useState(() => new Set(initialPackedIds));
  const [pendingIds, setPendingIds] = useState(() => new Set<string>());
  const [itemCount, setItemCount] = useState(initialItemCount);
  const [knownWeightG, setKnownWeightG] = useState(initialKnownWeightG);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const inFlightRef = useRef(new Set<string>());

  // サーバーの再検証が返ってきたら、進行中でないものだけ同期する。
  useEffect(() => {
    setPackedIds((current) => {
      const next = new Set(initialPackedIds);
      for (const id of current) {
        if (inFlightRef.current.has(id)) {
          next.add(id);
        }
      }
      for (const id of inFlightRef.current) {
        if (!current.has(id)) {
          next.delete(id);
        }
      }
      return next;
    });

    if (inFlightRef.current.size === 0) {
      setItemCount(initialItemCount);
      setKnownWeightG(initialKnownWeightG);
    }
  }, [initialPackedIds, initialItemCount, initialKnownWeightG]);

  const toggle = useCallback(
    ({ gearId, weightGrams, packed }: { gearId: string; weightGrams: number; packed: boolean }) => {
      if (inFlightRef.current.has(gearId)) {
        return;
      }

      hapticSelection();
      const nextPacked = !packed;
      inFlightRef.current.add(gearId);
      setPendingIds(new Set(inFlightRef.current));
      setError(null);

      const apply = (toPacked: boolean) => {
        setPackedIds((current) => {
          const next = new Set(current);
          if (toPacked) {
            next.add(gearId);
          } else {
            next.delete(gearId);
          }
          return next;
        });
        setItemCount((current) => Math.max(0, current + (toPacked ? 1 : -1)));
        setKnownWeightG((current) =>
          Math.max(0, current + (toPacked ? weightGrams : -weightGrams))
        );
      };

      apply(nextPacked);

      startTransition(async () => {
        // 圏外だと Server Action の呼び出し自体が reject する。
        // try/catch が無いと result を受け取れず、下の巻き戻しにも
        // 到達しないため、保存できていないのにスイッチだけ入ったままに
        // なっていた。山の中では圏外が普通なので、ここは必ず戻す。
        try {
          const result = nextPacked
            ? await addPackItems([gearId])
            : await removePackItem(gearId);

          if (!result.ok) {
            apply(packed);
            setError(result.error);
          }
        } catch (caught) {
          console.error("Pack toggle failed:", caught);
          apply(packed);
          setError("通信できませんでした。電波の良い場所で、もう一度お試しください。");
        } finally {
          inFlightRef.current.delete(gearId);
          setPendingIds(new Set(inFlightRef.current));
        }
      });
    },
    []
  );

  const value = useMemo(
    () => ({ packedIds, pendingIds, toggle, itemCount, knownWeightG, error }),
    [packedIds, pendingIds, toggle, itemCount, knownWeightG, error]
  );

  return <PackContext.Provider value={value}>{children}</PackContext.Provider>;
}

/** 行の右端に置くスイッチ。ラベルはスイッチの下。 */
export function GearPackToggle({
  gearId,
  weightGrams,
  disabled = false
}: {
  gearId: string;
  weightGrams: number;
  /** 「欲しい」のギアはパックに入れられない(addPackItems が所有のみ受け付ける)。 */
  disabled?: boolean;
}) {
  const { packedIds, pendingIds, toggle } = usePackControls();
  const packed = packedIds.has(gearId);
  const pending = pendingIds.has(gearId);

  return (
    <span className="flex shrink-0 flex-col items-center gap-1 pl-1">
      <button
        type="button"
        role="switch"
        aria-checked={packed}
        aria-label={packed ? "マイパックから外す" : "マイパックに入れる"}
        disabled={disabled || pending}
        onClick={(event) => {
          // 行全体が詳細ページへのリンクなので、遷移させない。
          event.preventDefault();
          event.stopPropagation();
          toggle({ gearId, weightGrams, packed });
        }}
        className={`relative block h-[26px] w-11 rounded-full transition-colors ${
          disabled
            ? "cursor-not-allowed bg-gray-100"
            : packed
              ? "bg-[#4e914a]"
              : "bg-[#d9d9d9]"
        } ${pending ? "opacity-60" : ""}`}
      >
        <span
          className={`absolute top-[3px] h-5 w-5 rounded-full bg-white shadow-sm transition-all ${
            packed ? "left-[22px]" : "left-[4px]"
          }`}
        />
      </button>
      <span
        className={`whitespace-nowrap text-[9px] font-medium leading-none ${
          disabled ? "text-gray-300" : "text-gray-400"
        }`}
      >
        マイパック
      </span>
    </span>
  );
}

/** 画面右下に常駐するパックの合計。 */
export function GearPackBar({ href }: { href: Route }) {
  const { itemCount, knownWeightG, error } = usePackControls();

  return (
    <>
      {error ? (
        <div className="fixed inset-x-4 bottom-[168px] z-40 rounded-xl bg-red-600 px-3 py-2 text-[11px] font-bold text-white shadow-lg">
          パックを更新できませんでした: {error}
        </div>
      ) : null}
      <Link
        href={href}
        className="fixed bottom-[104px] right-4 z-40 flex items-center gap-2.5 rounded-2xl bg-[#4e914a] py-2.5 pl-3.5 pr-3 shadow-[0_10px_24px_rgba(78,145,74,0.32)] transition active:scale-95"
      >
        <span className="block">
          <span className="block text-[10px] font-bold leading-none text-white">マイパック</span>
          <span className="mt-1 block whitespace-nowrap font-din text-[14px] font-bold leading-none text-white">
            {itemCount.toLocaleString("ja-JP")}点 ・ {formatWeight(knownWeightG, { compact: true })}
          </span>
        </span>
        <ChevronRight aria-hidden className="h-4 w-4 shrink-0 text-white" />
      </Link>
    </>
  );
}
