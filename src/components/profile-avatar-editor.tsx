"use client";

import { Camera, Loader2, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { deleteProfileAvatar, saveProfileAvatar } from "@/lib/actions/auth";
import { hapticError, hapticSuccess } from "@/lib/haptics";
import {
  PROFILE_AVATAR_ACCEPTED_TYPES,
  PROFILE_AVATAR_BUCKET,
  PROFILE_AVATAR_MAX_EDGE,
  PROFILE_AVATAR_MAX_INPUT_BYTES,
  PROFILE_AVATAR_MAX_OUTPUT_BYTES
} from "@/lib/profile-options";
import { createClient } from "@/lib/supabase/client";

type ProfileAvatarEditorProps = {
  displayName: string;
  initialAvatarUrl: string;
  initialHasAvatar?: boolean;
};

export function ProfileAvatarEditor({
  displayName,
  initialAvatarUrl,
  initialHasAvatar = false
}: ProfileAvatarEditorProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [hasAvatar, setHasAvatar] = useState(Boolean(initialAvatarUrl) || initialHasAvatar);
  const [isWorking, setIsWorking] = useState(false);
  const [feedback, setFeedback] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  const initial = displayName.trim().slice(0, 1).toUpperCase() || "Y";

  useEffect(() => {
    setAvatarUrl(initialAvatarUrl);
    setHasAvatar(Boolean(initialAvatarUrl) || initialHasAvatar);
  }, [initialAvatarUrl, initialHasAvatar]);

  async function handleFile(file: File | null) {
    if (!file || isWorking) {
      return;
    }

    setFeedback(null);

    try {
      validateImageFile(file);
      setIsWorking(true);

      const compressedFile = await createSquareAvatar(file);
      if (compressedFile.size > PROFILE_AVATAR_MAX_OUTPUT_BYTES) {
        throw new Error("画像を小さくできませんでした。別の画像をお試しください。");
      }

      const supabase = createClient();
      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("ログイン状態を確認できませんでした。");
      }

      const path = `${user.id}/${crypto.randomUUID()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from(PROFILE_AVATAR_BUCKET)
        .upload(path, compressedFile, {
          cacheControl: "0",
          contentType: "image/jpeg",
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      const result = await saveProfileAvatar(path);
      if (!result.ok) {
        await supabase.storage.from(PROFILE_AVATAR_BUCKET).remove([path]);
        throw new Error(result.message);
      }

      setAvatarUrl(URL.createObjectURL(compressedFile));
      setHasAvatar(true);
      setFeedback({ tone: "success", message: "プロフィール画像を更新しました。" });
      hapticSuccess();
      router.refresh();
    } catch (caught) {
      console.error("Profile avatar upload failed:", caught);
      setFeedback({
        tone: "error",
        message:
          caught instanceof Error
            ? caught.message
            : "プロフィール画像を保存できませんでした。もう一度お試しください。"
      });
      hapticError();
    } finally {
      setIsWorking(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  async function handleDelete() {
    if (isWorking || !hasAvatar) {
      return;
    }

    setFeedback(null);
    setIsWorking(true);

    try {
      const result = await deleteProfileAvatar();
      if (!result.ok) {
        throw new Error(result.message);
      }

      setAvatarUrl("");
      setHasAvatar(false);
      setFeedback({ tone: "success", message: "プロフィール画像を削除しました。" });
      hapticSuccess();
      router.refresh();
    } catch (caught) {
      console.error("Profile avatar delete failed:", caught);
      setFeedback({
        tone: "error",
        message:
          caught instanceof Error
            ? caught.message
            : "プロフィール画像を削除できませんでした。もう一度お試しください。"
      });
      hapticError();
    } finally {
      setIsWorking(false);
    }
  }

  return (
    <div className="px-5 py-5">
      <span className="text-sm font-bold text-ink">プロフィール画像</span>
      <div className="mt-4 flex min-w-0 items-center gap-4">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(event) => void handleFile(event.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isWorking}
          aria-label="プロフィール画像を選択"
          className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-forest-50 text-2xl font-bold text-[#14724e] ring-2 ring-white transition active:scale-95 disabled:opacity-60"
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="プロフィール画像" className="h-full w-full object-cover" />
          ) : (
            initial
          )}
          {isWorking ? (
            <span className="absolute inset-0 flex items-center justify-center bg-black/35 text-white">
              <Loader2 aria-label="処理中" className="h-5 w-5 animate-spin" />
            </span>
          ) : null}
        </button>
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isWorking}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#14724e] px-3 text-sm font-bold text-[#14724e] transition active:scale-[0.98] disabled:opacity-60"
          >
            <Camera aria-hidden className="h-4 w-4" />
            {hasAvatar ? "画像を変更" : "画像を追加"}
          </button>
          {hasAvatar ? (
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={isWorking}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl px-2 text-sm font-bold text-stone-500 transition active:scale-[0.98] disabled:opacity-60"
            >
              <Trash2 aria-hidden className="h-4 w-4" />
              画像を削除
            </button>
          ) : null}
        </div>
      </div>
      {feedback ? (
        <p
          role="status"
          className={`mt-3 text-xs font-semibold ${
            feedback.tone === "error" ? "text-red-700" : "text-[#14724e]"
          }`}
        >
          {feedback.message}
        </p>
      ) : null}
    </div>
  );
}

function validateImageFile(file: File) {
  if (!PROFILE_AVATAR_ACCEPTED_TYPES.includes(file.type as (typeof PROFILE_AVATAR_ACCEPTED_TYPES)[number])) {
    throw new Error("JPEG・PNG・WebP形式の画像を選択してください。");
  }

  if (file.size > PROFILE_AVATAR_MAX_INPUT_BYTES) {
    throw new Error("画像は10MB以下にしてください。");
  }
}

async function createSquareAvatar(file: File) {
  const sourceUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(sourceUrl);
    const sourceEdge = Math.min(image.naturalWidth, image.naturalHeight);
    if (sourceEdge <= 0) {
      throw new Error("画像を読み込めませんでした。");
    }

    const targetEdge = Math.min(PROFILE_AVATAR_MAX_EDGE, sourceEdge);
    const canvas = document.createElement("canvas");
    canvas.width = targetEdge;
    canvas.height = targetEdge;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("画像を処理できませんでした。");
    }

    const sourceX = (image.naturalWidth - sourceEdge) / 2;
    const sourceY = (image.naturalHeight - sourceEdge) / 2;
    context.drawImage(
      image,
      sourceX,
      sourceY,
      sourceEdge,
      sourceEdge,
      0,
      0,
      targetEdge,
      targetEdge
    );

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => {
        if (result) {
          resolve(result);
        } else {
          reject(new Error("画像を圧縮できませんでした。"));
        }
      }, "image/jpeg", 0.86);
    });

    return new File([blob], "profile-avatar.jpg", { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("画像を読み込めませんでした。"));
    image.src = src;
  });
}
