import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const profilePageSource = readFileSync("app/(app)/profile/page.tsx", "utf8");
const accountDeleteButtonSource = readFileSync(
  "src/components/account-delete-button.tsx",
  "utf8"
);
const authActionsSource = readFileSync("src/lib/actions/auth.ts", "utf8");
const supabaseAdminSource = readFileSync("src/lib/supabase/admin.ts", "utf8");
const loginPageSource = readFileSync("app/(auth)/login/page.tsx", "utf8");
const authFormSource = readFileSync("src/components/auth-form.tsx", "utf8");
const initialSchemaSource = readFileSync("supabase/migrations/001_initial_schema.sql", "utf8");
const tripPlansMigrationSource = readFileSync(
  "supabase/migrations/011_trip_plans_saved_flow.sql",
  "utf8"
);
const storageMigrationSource = readFileSync(
  "supabase/migrations/032_user_gear_private_image_storage.sql",
  "utf8"
);

test("profile exposes a low-weight account deletion entry below logout", () => {
  assert.match(profilePageSource, /signOut/);
  assert.match(profilePageSource, /AccountDeleteButton/);
  assert.ok(
    profilePageSource.indexOf("<form action={signOut}") <
      profilePageSource.indexOf("<AccountDeleteButton"),
    "account deletion entry should remain below logout"
  );
  assert.doesNotMatch(profilePageSource, /count: "exact", head: true/);
  assert.doesNotMatch(accountDeleteButtonSource, /gearCount/);
  assert.match(authActionsSource, /export async function deleteAccount/);
});

test("account deletion UI requires two confirmations and defaults final focus to cancel", () => {
  for (const copy of [
    "アカウントを削除",
    "アカウントを削除しますか？",
    "本当に削除してもよろしいですか？",
    "この操作は取り消せません。",
    "登録したメールアドレス・パスワード",
    "マイギアのデータ",
    "山行計画データ",
    "アップロードしたギア写真",
    "キャンセル",
    "次へ",
    "削除する"
  ]) {
    assert.match(accountDeleteButtonSource, new RegExp(copy));
  }

  assert.match(accountDeleteButtonSource, /setStep\("first"\)/);
  assert.match(accountDeleteButtonSource, /openDeleteDialog/);
  assert.doesNotMatch(accountDeleteButtonSource, /getAccountDeletionPreview/);
  assert.match(accountDeleteButtonSource, /setStep\("final"\)/);
  assert.match(accountDeleteButtonSource, /setStep\("closed"\)/);
  assert.match(accountDeleteButtonSource, /autoFocus/);
  assert.match(accountDeleteButtonSource, /cancelButtonRef\.current\?\.focus\(\)/);
  assert.match(accountDeleteButtonSource, /deleteAccount\(\)/);
  assert.match(accountDeleteButtonSource, /bg-red-700/);
});

test("account deletion server action clears user storage before auth deletion cascades profile data", () => {
  assert.match(authActionsSource, /export async function deleteAccount/);
  assert.match(authActionsSource, /supabase\.auth\.getUser\(\)/);
  assert.match(authActionsSource, /if \(userError \|\| !user\)/);
  assert.match(authActionsSource, /createAdminClient\(\)/);
  assert.match(authActionsSource, /\.from\("gear-images"\)/);
  assert.match(authActionsSource, /\.from\(PROFILE_AVATAR_BUCKET\)/);
  assert.match(authActionsSource, /listUserStoragePaths\(admin, "gear-images", user\.id\)/);
  assert.match(authActionsSource, /listUserStoragePaths\(\s*admin,\s*PROFILE_AVATAR_BUCKET/);
  assert.match(authActionsSource, /collectStoragePaths/);
  assert.match(authActionsSource, /\.remove\(storagePaths\)/);
  assert.match(authActionsSource, /\.remove\(profileAvatarPaths\)/);
  assert.match(authActionsSource, /public\.profiles\.id references auth\.users\(id\) with ON DELETE CASCADE/);
  assert.match(authActionsSource, /admin\.auth\.admin\.deleteUser\(user\.id\)/);
  assert.ok(
    authActionsSource.indexOf(".remove(profileAvatarPaths)") <
      authActionsSource.indexOf("admin.auth.admin.deleteUser(user.id)"),
    "avatar objects must be removed before Auth deletion cascades profile data"
  );
  assert.match(authActionsSource, /supabase\.auth\.signOut\(\)/);
  assert.match(authActionsSource, /redirect\("\/login\?deleted=1"\)/);
});

test("admin client uses the Supabase secret key only from server-side action", () => {
  assert.match(supabaseAdminSource, /SUPABASE_SECRET_KEY/);
  assert.match(supabaseAdminSource, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.ok(
    supabaseAdminSource.indexOf("SUPABASE_SECRET_KEY") <
      supabaseAdminSource.indexOf("SUPABASE_SERVICE_ROLE_KEY"),
    "new Supabase secret key name should be preferred while keeping service_role compatibility"
  );
  assert.match(supabaseAdminSource, /persistSession: false/);
  assert.match(supabaseAdminSource, /autoRefreshToken: false/);
  assert.doesNotMatch(supabaseAdminSource, /NEXT_PUBLIC_SUPABASE_ANON_KEY/);
});

test("user-owned database records cascade when auth user is deleted", () => {
  assert.match(
    initialSchemaSource,
    /create table public\.profiles \(\s*id uuid primary key references auth\.users\(id\) on delete cascade/
  );
  assert.match(
    initialSchemaSource,
    /create table public\.user_gear \([\s\S]*user_id uuid not null references public\.profiles\(id\) on delete cascade/
  );
  assert.match(
    initialSchemaSource,
    /create table public\.pack_lists \([\s\S]*user_id uuid not null references public\.profiles\(id\) on delete cascade/
  );
  assert.match(
    initialSchemaSource,
    /create table public\.ai_recommendations \([\s\S]*user_id uuid not null references public\.profiles\(id\) on delete cascade/
  );
  assert.match(
    tripPlansMigrationSource,
    /user_id uuid not null references public\.profiles\(id\) on delete cascade/
  );
});

test("gear image storage is private and user-scoped", () => {
  assert.match(storageMigrationSource, /'gear-images'/);
  assert.match(storageMigrationSource, /public,\s*file_size_limit/);
  assert.match(storageMigrationSource, /false,\s*8388608/);
  assert.match(storageMigrationSource, /gear_images_delete_own/);
  assert.match(storageMigrationSource, /\(storage\.foldername\(name\)\)\[1\] = auth\.uid\(\)::text/);
});

test("login page shows deletion completion notice", () => {
  assert.match(loginPageSource, /deleted\?: string/);
  assert.match(loginPageSource, /アカウントが削除されました/);
  assert.match(authFormSource, /notice\?: string/);
  assert.match(authFormSource, /forest-50/);
});
