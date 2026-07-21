"use client";

import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { updateGearImage } from "@/lib/actions/gear";
import { GearImageViewer } from "@/components/gear-image-viewer";
import { createClient } from "@/lib/supabase/client";

// ギア詳細で、その場で写真を追加・変更・削除する。
//
// 以前は「写真を追加」が編集フォームへのリンクで、写真を1枚足すだけでも
// 別ページに飛ばされていた。ここで完結させる。
// 対象は自分で登録したギアだけ(カタログ品は読み取り専用)。

type GearPhotoUploadProps = {
  gearId: string;
  gearName: string;
  initialImageUrl: string | null;
  className?: string;
};

export function GearPhotoUpload({
  gearId,
  gearName,
  initialImageUrl,
  className
}: GearPhotoUploadProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialImageUrl);
  const [status, setStatus] = useState<"idle" | "working">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | null) {
    if (!file || status === "working") {
      return;
    }

    setStatus("working");
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("ログイン状態を確認できませんでした");
      }

      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("gear-images")
        .upload(path, file, {
          cacheControl: "31536000",
          contentType: file.type || "image/jpeg",
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      const result = await updateGearImage(gearId, path);
      if (!result.ok) {
        throw new Error(result.error);
      }

      setPreviewUrl(URL.createObjectURL(file));
      router.refresh();
    } catch (caught) {
      console.error("Gear photo upload failed:", caught);
      setError("写真を保存できませんでした。もう一度お試しください。");
    } finally {
      setStatus("idle");
    }
  }

  async function handleRemove() {
    if (status === "working") {
      return;
    }

    setStatus("working");
    setError(null);

    try {
      const result = await updateGearImage(gearId, null);
      if (!result.ok) {
        throw new Error(result.error);
      }
      setPreviewUrl(null);
      router.refresh();
    } catch (caught) {
      console.error("Gear photo removal failed:", caught);
      setError("写真を削除できませんでした。もう一度お試しください。");
    } finally {
      setStatus("idle");
    }
  }

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => void handleFile(event.target.files?.[0] ?? null)}
      />

      {previewUrl ? (
        <>
          <GearImageViewer
            src={previewUrl}
            alt={gearName}
            className="h-72 sm:h-80 lg:h-96"
          />
          <div className="mt-3 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={status === "working"}
              className="text-xs font-bold text-[#14724e] disabled:opacity-60"
            >
              写真を変更
            </button>
            <button
              type="button"
              onClick={() => void handleRemove()}
              disabled={status === "working"}
              className="inline-flex items-center gap-1 text-xs font-bold text-stone-500 disabled:opacity-60"
            >
              <Trash2 aria-hidden className="h-3.5 w-3.5" />
              写真を削除
            </button>
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={status === "working"}
          className="flex h-72 w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-stone-300 bg-white text-center text-stone-400 transition active:scale-[0.99] disabled:opacity-70 sm:h-80 lg:h-96 [@media(hover:hover)]:hover:border-forest-400"
        >
          {status === "working" ? (
            <Loader2 className="h-8 w-8 animate-spin text-[#14724e]" />
          ) : (
            <ImagePlus className="h-8 w-8" />
          )}
          <span className="text-sm font-semibold">
            {status === "working" ? "アップロード中..." : "写真未登録"}
          </span>
          {status === "idle" ? (
            <span className="text-xs font-bold text-[#14724e]">写真を追加</span>
          ) : null}
        </button>
      )}

      {error ? (
        <p className="mt-2 text-center text-xs font-semibold text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
