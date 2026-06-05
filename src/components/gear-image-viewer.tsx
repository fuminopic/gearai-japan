"use client";

import { Maximize2, X } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils/format";

type GearImageViewerProps = {
  src: string;
  alt: string;
  className?: string;
};

export function GearImageViewer({ src, alt, className }: GearImageViewerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={cn(
          "group relative flex w-full items-center justify-center overflow-hidden rounded-lg border border-stone-200 bg-white p-3 text-left transition hover:border-forest-400",
          className
        )}
        aria-label="画像を拡大"
      >
        <img
          src={src}
          alt={alt}
          className="max-h-full max-w-full object-contain"
          loading="lazy"
        />
        <span className="absolute right-3 top-3 rounded-lg bg-white/90 p-2 text-stone-600 shadow-soft opacity-0 transition group-hover:opacity-100">
          <Maximize2 className="h-4 w-4" />
        </span>
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative flex max-h-[92vh] w-full max-w-5xl items-center justify-center rounded-lg bg-white p-4"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute right-3 top-3 rounded-lg bg-stone-100 p-2 text-stone-700 transition hover:bg-stone-200"
              aria-label="閉じる"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={src}
              alt={alt}
              className="max-h-[84vh] max-w-full object-contain"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
