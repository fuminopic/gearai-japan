import { ProfileSettingsForm } from "@/components/profile-settings-form";
import { PageShell } from "@/components/ui/page-shell";
import { getProfileAvatarSignedUrl } from "@/lib/data/profile";
import { requireUser } from "@/lib/data/gear";
import {
  AGE_RANGE_OPTIONS,
  FAVORITE_REGION_OPTIONS,
  GENDER_OPTIONS,
  MOUNTAINEERING_EXPERIENCE_OPTIONS,
  MOUNTAINEERING_GENRE_OPTIONS,
  USUAL_TRIP_STYLE_OPTIONS,
  getMetadataOptionValue,
  getMetadataOptionValues,
  getMetadataString
} from "@/lib/profile-options";

export default async function ProfileEditPage() {
  const { supabase, user } = await requireUser();
  const metadata = user.user_metadata;
  const [avatarUrl, gearCountResult] = await Promise.all([
    getProfileAvatarSignedUrl(supabase, user.id, metadata),
    supabase.from("user_gear").select("id", { count: "exact", head: true }).eq("user_id", user.id)
  ]);
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
        selfIntroduction={getMetadataString(metadata, "self_introduction")}
        initialAvatarUrl={avatarUrl}
        gender={getMetadataOptionValue(metadata, "profile_gender", GENDER_OPTIONS)}
        ageRange={getMetadataOptionValue(metadata, "profile_age_range", AGE_RANGE_OPTIONS)}
        mountaineeringExperience={getMetadataOptionValue(
          metadata,
          "mountaineering_experience",
          MOUNTAINEERING_EXPERIENCE_OPTIONS
        )}
        mountaineeringGenres={getMetadataOptionValues(
          metadata,
          "mountaineering_genres",
          MOUNTAINEERING_GENRE_OPTIONS
        )}
        usualTripStyles={getMetadataOptionValues(
          metadata,
          "usual_trip_styles",
          USUAL_TRIP_STYLE_OPTIONS
        )}
        favoriteRegions={getMetadataOptionValues(
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
