export type ProfileOption = {
  value: string;
  label: string;
};

export const PROFILE_AVATAR_BUCKET = "profile-avatars";
export const PROFILE_AVATAR_MAX_INPUT_BYTES = 10 * 1024 * 1024;
export const PROFILE_AVATAR_MAX_OUTPUT_BYTES = 2 * 1024 * 1024;
export const PROFILE_AVATAR_MAX_EDGE = 1024;
export const PROFILE_AVATAR_ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp"
] as const;

export const GENDER_OPTIONS = [
  { value: "male", label: "男性" },
  { value: "female", label: "女性" },
  { value: "other", label: "その他" },
  { value: "prefer_not_to_say", label: "回答しない" }
] as const satisfies readonly ProfileOption[];

export const AGE_RANGE_OPTIONS = [
  { value: "teens", label: "10代" },
  { value: "twenties", label: "20代" },
  { value: "thirties", label: "30代" },
  { value: "forties", label: "40代" },
  { value: "fifties", label: "50代" },
  { value: "sixties", label: "60代" },
  { value: "seventies_plus", label: "70代以上" },
  { value: "prefer_not_to_say", label: "回答しない" }
] as const satisfies readonly ProfileOption[];

export const MOUNTAINEERING_EXPERIENCE_OPTIONS = [
  { value: "no_experience", label: "未経験" },
  { value: "under_1_year", label: "1年未満" },
  { value: "one_to_three_years", label: "1〜3年" },
  { value: "four_to_nine_years", label: "4〜9年" },
  { value: "ten_years_or_more", label: "10年以上" }
] as const satisfies readonly ProfileOption[];

export const MOUNTAINEERING_GENRE_OPTIONS = [
  { value: "hiking", label: "ハイキング" },
  { value: "snow_free_mountain", label: "無雪期登山" },
  { value: "winter_mountain", label: "雪山登山" },
  { value: "trail_running", label: "トレイルラン" },
  { value: "canyoning", label: "沢登り" },
  { value: "climbing", label: "クライミング" },
  { value: "other", label: "その他" }
] as const satisfies readonly ProfileOption[];

export const USUAL_TRIP_STYLE_OPTIONS = [
  { value: "day_hike", label: "日帰り" },
  { value: "mountain_hut", label: "山小屋泊" },
  { value: "tent_stay", label: "テント泊" }
] as const satisfies readonly ProfileOption[];

export const FAVORITE_REGION_OPTIONS = [
  { value: "hokkaido", label: "北海道" },
  { value: "tohoku", label: "東北" },
  { value: "kanto", label: "関東" },
  { value: "koshinetsu", label: "甲信越" },
  { value: "hokuriku", label: "北陸" },
  { value: "tokai", label: "東海" },
  { value: "kinki", label: "近畿" },
  { value: "chugoku", label: "中国" },
  { value: "shikoku", label: "四国" },
  { value: "kyushu_okinawa", label: "九州・沖縄" },
  { value: "no_preference", label: "特に決まっていない" }
] as const satisfies readonly ProfileOption[];

export const MOUNTAINEERING_GENRE_MAX = 3;
export const FAVORITE_REGION_MAX = 3;

export type ProfileMetadata = Record<string, unknown> | null | undefined;

export function getMetadataString(metadata: ProfileMetadata, key: string) {
  const value = metadata?.[key];
  return typeof value === "string" ? value : "";
}

export function getMetadataOptionValue(
  metadata: ProfileMetadata,
  key: string,
  options: readonly ProfileOption[]
) {
  const value = getMetadataString(metadata, key);
  return options.some((option) => option.value === value) ? value : "";
}

export function getMetadataOptionValues(
  metadata: ProfileMetadata,
  key: string,
  options: readonly ProfileOption[]
) {
  const value = metadata?.[key];
  if (!Array.isArray(value)) {
    return [];
  }

  const allowed = new Set(options.map((option) => option.value));
  return Array.from(
    new Set(value.filter((entry): entry is string => typeof entry === "string" && allowed.has(entry)))
  );
}

export function getProfileAvatarPath(metadata: ProfileMetadata, userId: string) {
  const path = getMetadataString(metadata, "profile_avatar_path");
  return isProfileAvatarPath(path, userId) ? path : "";
}

export function isProfileAvatarPath(path: string, userId: string) {
  const fileName = path.slice(`${userId}/`.length);
  return (
    path.startsWith(`${userId}/`) &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$/i.test(fileName)
  );
}
