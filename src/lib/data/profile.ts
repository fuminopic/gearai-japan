import { PROFILE_AVATAR_BUCKET, getProfileAvatarPath, type ProfileMetadata } from "@/lib/profile-options";
import type { createClient } from "@/lib/supabase/server";

export async function getProfileAvatarSignedUrl(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  metadata: ProfileMetadata
) {
  const path = getProfileAvatarPath(metadata, userId);
  if (!path) {
    return "";
  }

  const { data, error } = await supabase.storage
    .from(PROFILE_AVATAR_BUCKET)
    .createSignedUrl(path, 60 * 60);

  return error ? "" : data.signedUrl;
}
