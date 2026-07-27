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
const profileOptionsSource = readFileSync("src/lib/profile-options.ts", "utf8");
const authActionsSource = readFileSync("src/lib/actions/auth.ts", "utf8");
const insurancePageSource = readFileSync("app/(app)/profile/insurance/page.tsx", "utf8");
const passwordPageSource = readFileSync("app/(app)/profile/password/page.tsx", "utf8");
const avatarMigrationSource = readFileSync(
  "supabase/migrations/20260727083724_add_profile_avatar_storage.sql",
  "utf8"
);

test("my page stays focused on profile, insurance, and account entry points", () => {
  for (const copy of [
    "マイページ",
    "プロフィールを編集",
    "山岳保険のご案内、保険情報の入力",
    "メールアドレス",
    "パスワード管理",
    "ログアウト"
  ]) {
    assert.match(profilePageSource, new RegExp(copy));
  }

  assert.match(profilePageSource, /getProfileAvatarSignedUrl/);
  assert.match(profilePageSource, /<img src=\{avatarUrl\}/);
  assert.match(profilePageSource, /\/profile\/insurance/);
  assert.match(profilePageSource, /signOut/);
  assert.match(profilePageSource, /AccountDeleteButton/);
  assert.doesNotMatch(profilePageSource, /山行記録/);
  assert.doesNotMatch(profilePageSource, /緊急連絡/);
});

test("profile settings include the requested optional mountaineering data with stable values", () => {
  for (const copy of [
    "基本情報",
    "表示名",
    "メモ",
    "ユーザー情報（任意）",
    "性別",
    "年齢層",
    "登山プロフィール（任意）",
    "装備リストやおすすめ設定の参考にします。",
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
  assert.match(profileSettingsFormSource, /AccountDeleteButton/);
  assert.match(avatarEditorSource, /プロフィール画像/);
  assert.match(profileEditPageSource, /<ProfileSettingsForm/);
  assert.match(profileEditPageSource, /getMetadataOptionValue/);
  assert.match(profileEditPageSource, /getMetadataOptionValues/);
  assert.match(profileSettingsFormSource, /MOUNTAINEERING_GENRE_MAX/);
  assert.match(profileSettingsFormSource, /FAVORITE_REGION_MAX/);
  assert.match(profileSettingsFormSource, /exclusiveValue="no_preference"/);
  assert.match(profileOptionsSource, /value: "male"/);
  assert.match(profileOptionsSource, /value: "snow_free_mountain"/);
  assert.match(profileOptionsSource, /value: "kyushu_okinawa"/);
  assert.match(profileOptionsSource, /value: "no_preference"/);
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
  assert.match(authActionsSource, /readProfileOptionList/);
  assert.match(authActionsSource, /favoriteRegions\.includes\("no_preference"\)/);
  assert.match(authActionsSource, /profile_gender/);
  assert.match(authActionsSource, /mountaineering_genres/);
  assert.match(authActionsSource, /usual_trip_styles/);
  assert.match(authActionsSource, /favorite_regions/);
  assert.match(authActionsSource, /supabase\.auth\.updateUser/);
  assert.match(authActionsSource, /revalidatePath\("\/profile"\)/);
  assert.doesNotMatch(authActionsSource, /\.from\("profiles"\)/);
});

test("avatar upload is private, compressed, replaceable, removable, and uses haptic completion feedback", () => {
  assert.match(avatarEditorSource, /image\/jpeg,image\/png,image\/webp/);
  assert.match(avatarEditorSource, /PROFILE_AVATAR_MAX_INPUT_BYTES/);
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
  assert.match(authActionsSource, /profile_avatar_path: previousPath/);
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
