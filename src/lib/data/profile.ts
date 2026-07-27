import {
  PROFILE_AVATAR_BUCKET,
  getProfileAvatarPath,
  isProfileAvatarPath,
  type ProfileMetadata
} from "@/lib/profile-options";
import type { createClient } from "@/lib/supabase/server";

export type ProfileDetails = {
  gender: string | null;
  ageRange: string | null;
  mountaineeringExperience: string | null;
  mountaineeringGenres: string[];
  usualTripStyles: string[];
  favoriteRegions: string[];
  avatarStoragePath: string | null;
};

export type ProfileDetailsRow = {
  gender: string | null;
  age_range: string | null;
  mountaineering_experience: string | null;
  mountaineering_genres: string[] | null;
  usual_trip_styles: string[] | null;
  favorite_regions: string[] | null;
  avatar_storage_path: string | null;
};

export const profileDetailsSelect =
  "gender, age_range, mountaineering_experience, mountaineering_genres, usual_trip_styles, favorite_regions, avatar_storage_path";

export function profileDetailsFromRow(data: ProfileDetailsRow): ProfileDetails {
  return {
    gender: data.gender,
    ageRange: data.age_range,
    mountaineeringExperience: data.mountaineering_experience,
    mountaineeringGenres: Array.isArray(data.mountaineering_genres)
      ? data.mountaineering_genres
      : [],
    usualTripStyles: Array.isArray(data.usual_trip_styles) ? data.usual_trip_styles : [],
    favoriteRegions: Array.isArray(data.favorite_regions) ? data.favorite_regions : [],
    avatarStoragePath: data.avatar_storage_path
  };
}

export async function getProfileDetails(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<ProfileDetails | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(profileDetailsSelect)
    .eq("id", userId)
    .maybeSingle<ProfileDetailsRow>();

  // The release migration is intentionally separate from the application deployment.
  // Until it has run, retain the legacy metadata read path instead of breaking profile pages.
  if (error) {
    if (isProfileDetailsSchemaUnavailable(error)) {
      return null;
    }

    throw error;
  }

  if (!data) {
    return null;
  }

  return profileDetailsFromRow(data);
}

export function getStoredProfileAvatarPath(
  profile: ProfileDetails | null,
  userId: string,
  metadata: ProfileMetadata
) {
  if (profile?.avatarStoragePath && isProfileAvatarPath(profile.avatarStoragePath, userId)) {
    return profile.avatarStoragePath;
  }

  return getProfileAvatarPath(metadata, userId);
}

export async function getProfileAvatarSignedUrl(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  metadata: ProfileMetadata,
  profile: ProfileDetails | null = null
) {
  const path = getStoredProfileAvatarPath(profile, userId, metadata);
  if (!path) {
    return "";
  }

  const { data, error } = await supabase.storage
    .from(PROFILE_AVATAR_BUCKET)
    .createSignedUrl(path, 60 * 60);

  return error ? "" : data.signedUrl;
}

export function isProfileDetailsSchemaUnavailable(error: { code?: string; message?: string }) {
  return (
    error.code === "PGRST204" ||
    /(?:avatar_storage_path|mountaineering_genres|favorite_regions|age_range|gender)/i.test(
      error.message ?? ""
    )
  );
}
