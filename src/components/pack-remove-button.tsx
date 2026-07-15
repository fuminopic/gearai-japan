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
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-800 text-white">
        <Minus aria-hidden className="h-4 w-4" strokeWidth={2.5} />
      </span>
    </button>
  );
}
