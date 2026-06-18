import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const profilePageSource = readFileSync("app/(app)/profile/page.tsx", "utf8");
const profileEditPageSource = readFileSync("app/(app)/profile/edit/page.tsx", "utf8");
const authActionsSource = readFileSync("src/lib/actions/auth.ts", "utf8");

test("my page stays focused on profile and emergency readiness", () => {
  assert.match(profilePageSource, /プロフィール編集/);
  assert.match(profilePageSource, /\/profile\/edit/);
  assert.match(profilePageSource, /保険・遭難時の対策/);
  assert.match(profilePageSource, /emergency_phone/);
  assert.doesNotMatch(profilePageSource, /QRコード/);
  assert.doesNotMatch(profilePageSource, /メッセージ/);
  assert.doesNotMatch(profilePageSource, /ダッシュボード/);
  assert.doesNotMatch(profilePageSource, /山行記録/);
  assert.doesNotMatch(profilePageSource, /getDashboardSummary/);
  assert.doesNotMatch(profilePageSource, /getTripPlans/);
});

test("profile edit page provides basic account and emergency fields", () => {
  for (const copy of [
    "プロフィール設定",
    "ニックネーム",
    "自己紹介",
    "遭難時の対策",
    "携帯電話番号（非公開）",
    "メールアドレス",
    "現住所（都道府県）",
    "生年月日（非公開）",
    "山以外の趣味",
    "ホームページ"
  ]) {
    assert.match(profileEditPageSource, new RegExp(copy));
  }

  assert.match(profileEditPageSource, /action=\{updateProfile\}/);
  assert.match(profileEditPageSource, /href="\/profile"/);
  assert.match(profileEditPageSource, /generic-hills\.jpg/);
});

test("profile update stores user metadata without adding a new table", () => {
  assert.match(authActionsSource, /export async function updateProfile/);
  assert.match(authActionsSource, /supabase\.auth\.updateUser/);
  assert.match(authActionsSource, /display_name/);
  assert.match(authActionsSource, /emergency_phone/);
  assert.match(authActionsSource, /revalidatePath\("\/profile"\)/);
  assert.doesNotMatch(authActionsSource, /\.from\("profiles"\)/);
});
