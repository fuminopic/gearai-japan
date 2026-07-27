import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const profilePageSource = readFileSync("app/(app)/profile/page.tsx", "utf8");
const profileEditPageSource = readFileSync("app/(app)/profile/edit/page.tsx", "utf8");
const profileSettingsFormSource = readFileSync(
  "src/components/profile-settings-form.tsx",
  "utf8"
);
const avatarEditorSource = readFileSync("src/components/profile-avatar-editor.tsx", "utf8");
const profileEditLauncherSource = readFileSync(
  "src/components/profile-edit-launcher.tsx",
  "utf8"
);
const profileOptionsSource = readFileSync("src/lib/profile-options.ts", "utf8");
const profileDataSource = readFileSync("src/lib/data/profile.ts", "utf8");
const authActionsSource = readFileSync("src/lib/actions/auth.ts", "utf8");
const insurancePageSource = readFileSync("app/(app)/profile/insurance/page.tsx", "utf8");
const passwordPageSource = readFileSync("app/(app)/profile/password/page.tsx", "utf8");
const avatarMigrationSource = readFileSync(
  "supabase/migrations/20260727083724_add_profile_avatar_storage.sql",
  "utf8"
);
const profileDetailsMigrationSource = readFileSync(
  "supabase/migrations/20260727090332_move_profile_details_to_profiles.sql",
  "utf8"
);

test("my page stays focused on profile, insurance, and account entry points", () => {
  for (const copy of [
    "マイページ",
    "山岳保険のご案内、保険情報の入力",
    "メールアドレス",
    "パスワード管理",
    "ログアウト"
  ]) {
    assert.match(profilePageSource, new RegExp(copy));
  }

  assert.match(profilePageSource, /getProfileAvatarSignedUrl/);
  assert.match(profileEditLauncherSource, /プロフィールを編集/);
  assert.match(profilePageSource, /<img src=\{avatarUrl\}/);
  assert.match(profilePageSource, /const avatarInitial = displayName\.trim\(\)\.slice\(0, 1\)\.toUpperCase\(\) \|\| "Y"/);
  assert.match(profilePageSource, /\/profile\/insurance/);
  assert.match(profilePageSource, /signOut/);
  assert.match(profilePageSource, /AccountDeleteButton/);
  assert.doesNotMatch(profilePageSource, /山行記録/);
  assert.doesNotMatch(profilePageSource, /緊急連絡/);
});

test("profile settings present compact single-choice profile rows", () => {
  for (const copy of [
    "基本情報",
    "ニックネーム",
    "性別",
    "年齢層",
    "登山歴",
    "主な登山ジャンル",
    "普段よくする山行",
    "よく行くエリア",
    "アカウント",
    "パスワード変更",
    "ログアウト"
  ]) {
    assert.match(profileSettingsFormSource, new RegExp(copy));
  }

  assert.match(profileSettingsFormSource, /<ProfileAvatarEditor/);
  assert.match(avatarEditorSource, /プロフィール画像/);
  assert.match(profileSettingsFormSource, /AccountDeleteButton/);
  assert.match(avatarEditorSource, /プロフィール画像/);
  assert.match(profileEditPageSource, /<ProfileSettingsForm/);
  assert.match(profileEditPageSource, /getProfileDetails/);
  assert.match(profileEditPageSource, /getProfileOptionValue/);
  assert.match(profileEditPageSource, /getProfileOptionValueFromArray/);
  assert.match(profileSettingsFormSource, /<ProfileOptionRow/);
  assert.match(profileSettingsFormSource, /<ProfileDialog/);
  assert.match(profileSettingsFormSource, /role="radiogroup"/);
  assert.match(profileSettingsFormSource, /aria-checked=\{checked\}/);
  assert.doesNotMatch(profileSettingsFormSource, /label="選択しない"/);
  assert.match(profileSettingsFormSource, /z-\[100\]/);
  assert.match(profileSettingsFormSource, /safe-area-inset-bottom\)\+7rem/);
  assert.match(profileSettingsFormSource, /avatarSlot/);
  assert.match(profileSettingsFormSource, /<AccountDeleteButton variant="row"/);
  assert.match(profileSettingsFormSource, /form="profile-settings-form"/);
  assert.match(profileOptionsSource, /value: "male"/);
  assert.match(profileOptionsSource, /value: "snow_free_mountain"/);
  assert.match(profileOptionsSource, /value: "kyushu_okinawa"/);
  assert.match(profileOptionsSource, /value: "no_preference"/);
  assert.doesNotMatch(profileSettingsFormSource, /表示名/);
  assert.doesNotMatch(profileSettingsFormSource, /メモ/);
  assert.doesNotMatch(profileSettingsFormSource, /ユーザー情報（任意）/);
  assert.doesNotMatch(profileSettingsFormSource, /登山プロフィール（任意）/);
  assert.doesNotMatch(profileSettingsFormSource, /アプリ内で表示する名前とメモです。/);
  assert.doesNotMatch(profileSettingsFormSource, /統計の参考にします。/);
  assert.doesNotMatch(profileSettingsFormSource, /装備リストやおすすめ設定の参考にします。/);
  assert.doesNotMatch(profileSettingsFormSource, /ProfileMultiSelect/);
  assert.doesNotMatch(profileSettingsFormSource, /MOUNTAINEERING_GENRE_MAX/);
  assert.doesNotMatch(profileSettingsFormSource, /FAVORITE_REGION_MAX/);
  assert.doesNotMatch(profileSettingsFormSource, /生年月日/);
  assert.doesNotMatch(profileSettingsFormSource, /血液型/);
  assert.doesNotMatch(profileSettingsFormSource, /職業/);
});

test("profile update validates options on the server and gives one pending-state feedback cycle", () => {
  assert.match(profileSettingsFormSource, /useActionState\(updateProfile/);
  assert.match(profileSettingsFormSource, /disabled=\{isPending\}/);
  assert.match(profileSettingsFormSource, /hapticSuccess\(\)/);
  assert.match(profileSettingsFormSource, /hapticError\(\)/);
  assert.match(authActionsSource, /export async function updateProfile/);
  assert.match(authActionsSource, /parseProfileFields/);
  assert.match(authActionsSource, /readOptionalProfileOption/);
  assert.match(authActionsSource, /\.from\("profiles"\)/);
  assert.match(authActionsSource, /gender: profileFields\.data\.gender \|\| null/);
  assert.match(authActionsSource, /mountaineering_genres: toSingleValueArray\(profileFields\.data\.mountaineeringGenre\)/);
  assert.match(authActionsSource, /usual_trip_styles: toSingleValueArray\(profileFields\.data\.usualTripStyle\)/);
  assert.match(authActionsSource, /favorite_regions: toSingleValueArray\(profileFields\.data\.favoriteRegion\)/);
  assert.match(authActionsSource, /function toSingleValueArray\(value: string\)/);
  assert.match(authActionsSource, /supabase\.auth\.updateUser/);
  assert.match(authActionsSource, /revalidatePath\("\/profile"\)/);
  assert.match(profileDataSource, /getProfileDetails/);
  assert.match(profileDataSource, /isProfileDetailsSchemaUnavailable/);
  assert.match(profileOptionsSource, /getProfileOptionValue/);
  assert.match(profileOptionsSource, /getProfileOptionValues/);
  assert.match(profileOptionsSource, /getProfileOptionValueFromArray/);
});

test("profile save treats the returned public.profiles row as the form's canonical state", () => {
  assert.match(authActionsSource, /\.select\(profileDetailsSelect\)\s*\.single<ProfileDetailsRow>\(\)/);
  assert.match(authActionsSource, /const savedProfile = profileDetailsFromRow\(savedRow\)/);
  assert.match(authActionsSource, /profile: savedProfile/);

  assert.match(profileSettingsFormSource, /const \[profileValues, setProfileValues\]/);
  assert.match(profileSettingsFormSource, /state\.ok && state\.profile/);
  assert.match(profileSettingsFormSource, /setProfileValues\(\{/);
  assert.match(profileSettingsFormSource, /router\.refresh\(\)/);
  assert.match(profileSettingsFormSource, /value=\{profileValues\.gender\}/);
  assert.match(profileSettingsFormSource, /value=\{profileValues\.ageRange\}/);
  assert.match(profileSettingsFormSource, /value=\{profileValues\.mountaineeringExperience\}/);
  assert.match(profileSettingsFormSource, /value=\{profileValues\.mountaineeringGenre\}/);
  assert.match(profileSettingsFormSource, /value=\{profileValues\.usualTripStyle\}/);
  assert.match(profileSettingsFormSource, /value=\{profileValues\.favoriteRegion\}/);
  assert.match(profileSettingsFormSource, /nickname: state\.displayName \?\? ""/);
  assert.match(authActionsSource, /displayName/);
});

test("legacy metadata is a one-way fallback and cannot overwrite a saved canonical profile", () => {
  assert.match(profileOptionsSource, /PROFILE_DETAILS_METADATA_VERSION = 1/);
  assert.match(profileOptionsSource, /hasCanonicalProfileDetails\(metadata\)/);
  assert.match(
    profileOptionsSource,
    /values\.length > 0 \|\| hasCanonicalProfileDetails\(metadata\)/
  );
  assert.match(authActionsSource, /profile_gender: null/);
  assert.match(authActionsSource, /profile_age_range: null/);
  assert.match(authActionsSource, /mountaineering_experience: null/);
  assert.match(authActionsSource, /mountaineering_genres: null/);
  assert.match(authActionsSource, /usual_trip_styles: null/);
  assert.match(authActionsSource, /favorite_regions: null/);
  assert.match(authActionsSource, /profile_details_version: PROFILE_DETAILS_METADATA_VERSION/);
});

test("all six canonical profile fields use the expected database mappings", () => {
  for (const mapping of [
    "gender: profileFields.data.gender || null",
    "age_range: profileFields.data.ageRange || null",
    "mountaineering_experience: profileFields.data.mountaineeringExperience || null",
    "mountaineering_genres: toSingleValueArray(profileFields.data.mountaineeringGenre)",
    "usual_trip_styles: toSingleValueArray(profileFields.data.usualTripStyle)",
    "favorite_regions: toSingleValueArray(profileFields.data.favoriteRegion)"
  ]) {
    assert.match(authActionsSource, new RegExp(mapping.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("existing arrays are read as one choice and rewritten as single-element arrays without a schema change", () => {
  assert.match(profileEditPageSource, /mountaineeringGenre=\{getProfileOptionValueFromArray/);
  assert.match(profileEditPageSource, /usualTripStyle=\{getProfileOptionValueFromArray/);
  assert.match(profileEditPageSource, /favoriteRegion=\{getProfileOptionValueFromArray/);
  assert.match(profileOptionsSource, /getProfileOptionValues\(storedValues, metadata, metadataKey, options\)\[0\] \?\? ""/);
  assert.match(profileDetailsMigrationSource, /mountaineering_genres text\[\]/);
  assert.match(profileDetailsMigrationSource, /usual_trip_styles text\[\]/);
  assert.match(profileDetailsMigrationSource, /favorite_regions text\[\]/);
  assert.match(profileDetailsMigrationSource, /cardinality\(coalesce\(mountaineering_genres/);
  assert.match(profileDetailsMigrationSource, /cardinality\(coalesce\(favorite_regions/);
});

test("profile edit keeps the form path free of account-delete counting and streams the private avatar URL separately", () => {
  assert.doesNotMatch(profileEditPageSource, /count: "exact", head: true/);
  assert.doesNotMatch(profilePageSource, /count: "exact", head: true/);
  assert.match(profileEditPageSource, /<Suspense/);
  assert.match(profileEditPageSource, /<ProfileAvatarSlot/);
  assert.match(profileEditPageSource, /getProfileAvatarSignedUrl/);
  assert.match(profileEditPageSource, /initialAvatarUrl=""/);
});

test("profile edit opens immediately with the current private avatar URL instead of an empty fallback", () => {
  assert.match(profilePageSource, /<ProfileEditLauncher/);
  assert.match(profilePageSource, /initialAvatarUrl=\{avatarUrl\}/);
  assert.match(profilePageSource, /hasAvatar=\{Boolean\(getStoredProfileAvatarPath\(profile, user\.id\)\)\}/);
  assert.match(profilePageSource, /getProfileOptionValue\(profile\?\.gender/);
  assert.match(profilePageSource, /getProfileOptionValueFromArray\(/);

  assert.match(profileEditLauncherSource, /window\.history\.pushState\(null, "", "\/profile\/edit"\)/);
  assert.match(profileEditLauncherSource, /<ProfileSettingsForm/);
  assert.match(profileEditLauncherSource, /initialAvatarUrl=\{initialAvatarUrl\}/);
  assert.match(profileEditLauncherSource, /initialHasAvatar=\{hasAvatar\}/);
  assert.match(profileEditLauncherSource, /onDirtyChange=\{setIsDirty\}/);
  assert.match(profileEditLauncherSource, /data-testid="profile-edit-instant-layer"/);
  assert.match(profileEditLauncherSource, /z-\[70\]/);
  assert.match(profileEditLauncherSource, /handlePopState/);
  assert.match(profileEditLauncherSource, /入力を破棄しますか？/);

  assert.doesNotMatch(profileEditLauncherSource, /router\.prefetch/);
  assert.doesNotMatch(profileEditLauncherSource, /localStorage/);
  assert.doesNotMatch(profileEditLauncherSource, /getProfileAvatarSignedUrl/);
  assert.doesNotMatch(profileEditLauncherSource, /createClient/);
  assert.doesNotMatch(profileEditLauncherSource, /requireUser/);

  assert.match(profileSettingsFormSource, /onDirtyChange\?\.\(false\)/);
  assert.match(profileSettingsFormSource, /onInput=\{\(\) => onDirtyChange\?\.\(true\)\}/);
  assert.match(profileSettingsFormSource, /onChange=\{\(\) => onDirtyChange\?\.\(true\)\}/);
  assert.match(avatarEditorSource, /initialHasAvatar\?: boolean/);
  assert.match(avatarEditorSource, /const \[hasAvatar, setHasAvatar\]/);
  assert.match(avatarEditorSource, /useEffect\(\(\) => \{\s*setAvatarUrl\(initialAvatarUrl\)/);
  assert.match(avatarEditorSource, /useRouter\(\)/);
  assert.match(avatarEditorSource, /router\.refresh\(\)/);
  assert.match(avatarEditorSource, /!hasAvatar/);
});

test("memo is no longer rendered, edited, or saved", () => {
  assert.doesNotMatch(profileSettingsFormSource, /self_introduction/);
  assert.doesNotMatch(profileEditPageSource, /self_introduction/);
  assert.doesNotMatch(profilePageSource, /self_introduction/);
  assert.doesNotMatch(authActionsSource, /formData\.get\("self_introduction"\)/);
  assert.doesNotMatch(authActionsSource, /self_introduction: selfIntroduction/);
});

test("avatar upload is private, compressed, replaceable, removable, and uses haptic completion feedback", () => {
  assert.match(avatarEditorSource, /image\/jpeg,image\/png,image\/webp/);
  assert.match(avatarEditorSource, /PROFILE_AVATAR_MAX_INPUT_BYTES/);
  assert.doesNotMatch(avatarEditorSource, /JPEG・PNG・WebP（10MBまで）/);
  assert.match(avatarEditorSource, /createSquareAvatar/);
  assert.match(avatarEditorSource, /canvas\.toBlob/);
  assert.match(avatarEditorSource, /"image\/jpeg", 0\.86/);
  assert.match(avatarEditorSource, /crypto\.randomUUID\(\)/);
  assert.match(avatarEditorSource, /\.from\(PROFILE_AVATAR_BUCKET\)/);
  assert.match(avatarEditorSource, /saveProfileAvatar\(path\)/);
  assert.match(avatarEditorSource, /deleteProfileAvatar\(\)/);
  assert.match(avatarEditorSource, /hapticSuccess\(\)/);
  assert.match(avatarEditorSource, /hapticError\(\)/);
  assert.match(authActionsSource, /export async function saveProfileAvatar/);
  assert.match(authActionsSource, /export async function deleteProfileAvatar/);
  assert.match(authActionsSource, /isProfileAvatarPath\(path, user\.id\)/);
  assert.match(authActionsSource, /remove\(\[previousPath\]\)/);
  assert.match(authActionsSource, /avatar_storage_path: path/);
  assert.match(authActionsSource, /avatar_storage_path: null/);
  assert.match(authActionsSource, /profile_avatar_path: previousPath/);
});

test("profile details have a queryable, user-owned canonical record and avatar source", () => {
  for (const column of [
    "gender text",
    "age_range text",
    "mountaineering_experience text",
    "mountaineering_genres text[]",
    "usual_trip_styles text[]",
    "favorite_regions text[]",
    "avatar_storage_path text"
  ]) {
    assert.match(profileDetailsMigrationSource, new RegExp(column.replace(/[\[\]]/g, "\\$&")));
  }

  for (const constraint of [
    "profiles_gender_allowed",
    "profiles_age_range_allowed",
    "profiles_mountaineering_experience_allowed",
    "profiles_mountaineering_genres_allowed",
    "profiles_usual_trip_styles_allowed",
    "profiles_favorite_regions_allowed",
    "profiles_avatar_storage_path_owned"
  ]) {
    assert.match(profileDetailsMigrationSource, new RegExp(constraint));
  }

  assert.match(profileDetailsMigrationSource, /profiles_select_own/);
  assert.match(profileDetailsMigrationSource, /profiles_update_own/);
  assert.match(profileDetailsMigrationSource, /\(select auth\.uid\(\)\) = id/);
  assert.match(profileDetailsMigrationSource, /cardinality\(coalesce\(mountaineering_genres/);
  assert.match(profileDetailsMigrationSource, /'no_preference' = any/);
  assert.match(profileDataSource, /getStoredProfileAvatarPath/);
  assert.match(profileDataSource, /profile\?\.avatarStoragePath/);
  assert.doesNotMatch(profileDataSource, /getProfileAvatarPath/);
  assert.doesNotMatch(profileDataSource, /profile_avatar_path/);
  assert.match(authActionsSource, /getStoredProfileAvatarPath\(profile, user\.id\)/);
  assert.doesNotMatch(authActionsSource, /getStoredProfileAvatarPath\(profile, user\.id, user\.user_metadata\)/);
});

test("avatar save, replacement, deletion, refresh, and re-entry share the canonical path and signed URL", () => {
  assert.match(profileDataSource, /createSignedUrl\(path, 60 \* 60\)/);
  assert.match(profilePageSource, /getProfileAvatarSignedUrl\(supabase, user\.id, profile\)/);
  assert.match(profileEditPageSource, /getProfileAvatarSignedUrl\(supabase, userId, profile\)/);
  assert.match(avatarEditorSource, /setAvatarUrl\(URL\.createObjectURL\(compressedFile\)\)/);
  assert.match(avatarEditorSource, /setAvatarUrl\(""\)/);
  assert.match(avatarEditorSource, /setHasAvatar\(false\)/);
  assert.match(avatarEditorSource, /router\.refresh\(\)/);
  assert.match(authActionsSource, /revalidatePath\("\/profile"\)/);
  assert.match(authActionsSource, /revalidatePath\("\/profile\/edit"\)/);
});

test("avatar storage migration is private, idempotent, and scoped to the current user folder", () => {
  assert.match(avatarMigrationSource, /'profile-avatars'/);
  assert.match(avatarMigrationSource, /false,\s*2097152/);
  assert.match(avatarMigrationSource, /array\['image\/jpeg'\]/);
  assert.match(avatarMigrationSource, /on conflict \(id\) do update/);
  for (const policy of [
    "profile_avatars_select_own",
    "profile_avatars_insert_own",
    "profile_avatars_update_own",
    "profile_avatars_delete_own"
  ]) {
    assert.match(avatarMigrationSource, new RegExp(policy));
  }
  assert.match(
    avatarMigrationSource,
    /\(storage\.foldername\(name\)\)\[1\] = \(select auth\.uid\(\)::text\)/
  );
});

test("password and insurance flows remain independent", () => {
  assert.match(passwordPageSource, /パスワードを追加・変更/);
  assert.match(passwordPageSource, /action=\{updatePassword\}/);
  assert.match(insurancePageSource, /保険のご加入/);
  assert.match(insurancePageSource, /action=\{updateInsurance\}/);
  assert.doesNotMatch(profileSettingsFormSource, /山岳保険/);
});

test("secondary profile page keeps the shared back-header shell", () => {
  assert.match(profileEditPageSource, /<PageShell/);
  assert.match(profileEditPageSource, /backHref="\/profile"/);
  assert.match(profileEditPageSource, /backLabel="マイページへ戻る"/);
});
