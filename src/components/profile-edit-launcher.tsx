"use client";

import { ArrowLeft, Edit3 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { AppMenuDrawer } from "@/components/app-menu-drawer";
import { ProfileSettingsForm } from "@/components/profile-settings-form";

type ProfileEditLauncherProps = {
  email: string;
  displayName: string;
  initialAvatarUrl: string;
  hasAvatar: boolean;
  gender: string;
  ageRange: string;
  mountaineeringExperience: string;
  mountaineeringGenre: string;
  usualTripStyle: string;
  favoriteRegion: string;
};

export function ProfileEditLauncher({
  email,
  displayName,
  initialAvatarUrl,
  hasAvatar,
  gender,
  ageRange,
  mountaineeringExperience,
  mountaineeringGenre,
  usualTripStyle,
  favoriteRegion
}: ProfileEditLauncherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isDiscardConfirmationOpen, setIsDiscardConfirmationOpen] = useState(false);
  const dirtyRef = useRef(false);

  useEffect(() => {
    dirtyRef.current = isDirty;
  }, [isDirty]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePopState() {
      if (dirtyRef.current) {
        window.history.pushState(null, "", "/profile/edit");
        setIsDiscardConfirmationOpen(true);
        return;
      }

      setIsOpen(false);
      setIsDirty(false);
    }

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isOpen]);

  function openEditor() {
    window.history.pushState(null, "", "/profile/edit");
    setIsOpen(true);
  }

  function requestClose() {
    if (isDirty) {
      setIsDiscardConfirmationOpen(true);
      return;
    }

    window.history.back();
  }

  function discardAndClose() {
    setIsDiscardConfirmationOpen(false);
    setIsDirty(false);
    window.history.back();
  }

  return (
    <>
      <button
        type="button"
        onClick={openEditor}
        data-testid="profile-edit-launcher"
        className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#14724e] px-4 text-sm font-bold text-white transition active:scale-[0.98]"
      >
        <Edit3 aria-hidden className="h-4 w-4" />
        プロフィールを編集
      </button>

      {isOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="プロフィール設定"
          data-testid="profile-edit-instant-layer"
          className="fixed inset-0 z-[70] overflow-y-auto overscroll-contain bg-[#E5EBE9] text-ink"
        >
          <main className="secondary-shell brand-shell min-h-screen bg-[#E5EBE9] pb-32 text-ink">
            <header
              className="relative z-10 w-full bg-gradient-to-br from-[#1F7950] to-[#81AB44] px-4 pt-[max(env(safe-area-inset-top),20px)]"
              style={{ minHeight: "calc(max(env(safe-area-inset-top), 20px) + 150px)" }}
            >
              <div className="flex items-start justify-between">
                <button
                  type="button"
                  aria-label="マイページへ戻る"
                  onClick={requestClose}
                  className="-ml-2 inline-flex h-10 w-10 items-center justify-center rounded-xl text-white transition-transform active:scale-95"
                >
                  <ArrowLeft aria-hidden className="h-5 w-5" />
                </button>
                <AppMenuDrawer buttonClassName="-mr-2 inline-flex h-10 w-10 items-center justify-center rounded-xl text-white transition-transform active:scale-95" />
              </div>
              <div className="mt-2 flex items-end justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold leading-none text-white/85">マイページ</p>
                  <h1 className="mt-1.5 truncate text-[20px] font-bold leading-tight tracking-normal text-white">
                    プロフィール設定
                  </h1>
                </div>
              </div>
            </header>

            <div className="relative z-20 -mt-[51px] space-y-[11px] px-4">
              <ProfileSettingsForm
                email={email}
                displayName={displayName}
                initialAvatarUrl={initialAvatarUrl}
                initialHasAvatar={hasAvatar}
                gender={gender}
                ageRange={ageRange}
                mountaineeringExperience={mountaineeringExperience}
                mountaineeringGenre={mountaineeringGenre}
                usualTripStyle={usualTripStyle}
                favoriteRegion={favoriteRegion}
                onDirtyChange={setIsDirty}
              />
            </div>
          </main>

          {isDiscardConfirmationOpen ? (
            <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 px-6">
              <section
                role="dialog"
                aria-modal="true"
                aria-label="入力を破棄しますか？"
                className="w-full max-w-[320px] rounded-[20px] bg-white p-5 text-left shadow-xl"
              >
                <h2 className="text-base font-bold leading-relaxed text-ink">入力を破棄しますか？</h2>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-stone-500">
                  保存していない内容は失われます。
                </p>
                <div className="mt-5 grid gap-2">
                  <button
                    type="button"
                    onClick={discardAndClose}
                    className="inline-flex h-11 w-full items-center justify-center rounded-full bg-red-600 text-sm font-bold text-white transition active:scale-[0.99]"
                  >
                    破棄して戻る
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDiscardConfirmationOpen(false)}
                    className="inline-flex h-11 w-full items-center justify-center rounded-full border border-stone-200 bg-white text-sm font-bold text-stone-700 transition active:scale-[0.99]"
                  >
                    入力を続ける
                  </button>
                </div>
              </section>
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
