"use client";

import { Minus } from "lucide-react";

export function PackRemoveButton({ onRemove }: { onRemove: () => void }) {
  return (
    <button
      type="button"
      aria-label="パックから外す"
      onClick={onRemove}
      className="inline-flex h-11 w-11 shrink-0 items-center justify-center transition active:scale-95"
    >
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-stone-500 text-white">
        <Minus aria-hidden className="h-3.5 w-3.5" strokeWidth={2.5} />
      </span>
    </button>
  );
}
