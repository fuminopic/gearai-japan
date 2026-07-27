import { Suspense } from "react";

import { ProfileAvatarEditor } from "@/components/profile-avatar-editor";
import { ProfileSettingsForm } from "@/components/profile-settings-form";
import { PageShell } from "@/components/ui/page-shell";
import {
  getProfileAvatarSignedUrl,
  getProfileDetails,
  type ProfileDetails
} from "@/lib/data/profile";
import { requireUser } from "@/lib/data/gear";
import {
  AGE_RANGE_OPTIONS,
  FAVORITE_REGION_OPTIONS,
  GENDER_OPTIONS,
  MOUNTAINEERING_EXPERIENCE_OPTIONS,
  MOUNTAINEERING_GENRE_OPTIONS,
  USUAL_TRIP_STYLE_OPTIONS,
  getProfileOptionValue,
  getProfileOptionValueFromArray,
  getMetadataString
} from "@/lib/profile-options";
import { createClient } from "@/lib/supabase/server";

export default async function ProfileEditPage() {
  const { supabase, user } = await requireUser();
  const metadata = user.user_metadata;
  const profile = await getProfileDetails(supabase, user.id);
  const displayName = getDisplayName(user.email, metadata);

  return (
    <PageShell
      backHref="/profile"
      backLabel="マイページへ戻る"
      eyebrow="マイページ"
      title="プロフィール設定"
    >
      <ProfileSettingsForm
        email={user.email ?? ""}
        displayName={displayName}
        initialAvatarUrl=""
        avatarSlot={
          <Suspense
            fallback={<ProfileAvatarEditor displayName={displayName} initialAvatarUrl="" />}
          >
            <ProfileAvatarSlot displayName={displayName} userId={user.id} profile={profile} />
          </Suspense>
        }
        gender={getProfileOptionValue(profile?.gender, metadata, "profile_gender", GENDER_OPTIONS)}
        ageRange={getProfileOptionValue(profile?.ageRange, metadata, "profile_age_range", AGE_RANGE_OPTIONS)}
        mountaineeringExperience={getProfileOptionValue(
          profile?.mountaineeringExperience,
          metadata,
          "mountaineering_experience",
          MOUNTAINEERING_EXPERIENCE_OPTIONS
        )}
        mountaineeringGenre={getProfileOptionValueFromArray(
          profile?.mountaineeringGenres,
          metadata,
          "mountaineering_genres",
          MOUNTAINEERING_GENRE_OPTIONS
        )}
        usualTripStyle={getProfileOptionValueFromArray(
          profile?.usualTripStyles,
          metadata,
          "usual_trip_styles",
          USUAL_TRIP_STYLE_OPTIONS
        )}
        favoriteRegion={getProfileOptionValueFromArray(
          profile?.favoriteRegions,
          metadata,
          "favorite_regions",
          FAVORITE_REGION_OPTIONS
        )}
      />
    </PageShell>
  );
}

async function ProfileAvatarSlot({
  displayName,
  userId,
  profile
}: {
  displayName: string;
  userId: string;
  profile: ProfileDetails | null;
}) {
  const supabase = await createClient();
  const avatarUrl = await getProfileAvatarSignedUrl(supabase, userId, profile);

  return <ProfileAvatarEditor displayName={displayName} initialAvatarUrl={avatarUrl} />;
}

function getDisplayName(
  email: string | undefined,
  metadata: Record<string, unknown> | null | undefined
) {
  return getMetadataString(metadata, "display_name") || email?.split("@")[0] || "";
}
