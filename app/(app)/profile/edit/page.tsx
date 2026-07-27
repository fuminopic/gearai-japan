import { ProfileSettingsForm } from "@/components/profile-settings-form";
import { PageShell } from "@/components/ui/page-shell";
import { getProfileAvatarSignedUrl, getProfileDetails } from "@/lib/data/profile";
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

export default async function ProfileEditPage() {
  const { supabase, user } = await requireUser();
  const metadata = user.user_metadata;
  const [profile, gearCountResult] = await Promise.all([
    getProfileDetails(supabase, user.id),
    supabase.from("user_gear").select("id", { count: "exact", head: true }).eq("user_id", user.id)
  ]);
  const avatarUrl = await getProfileAvatarSignedUrl(supabase, user.id, metadata, profile);
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
        gearCount={gearCountResult.count ?? 0}
        displayName={displayName}
        initialAvatarUrl={avatarUrl}
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

function getDisplayName(
  email: string | undefined,
  metadata: Record<string, unknown> | null | undefined
) {
  return getMetadataString(metadata, "display_name") || email?.split("@")[0] || "";
}
