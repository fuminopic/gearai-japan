import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const profilePageSource = readFileSync("app/(app)/profile/page.tsx", "utf8");
const profileEditPageSource = readFileSync("app/(app)/profile/edit/page.tsx", "utf8");
const authActionsSource = readFileSync("src/lib/actions/auth.ts", "utf8");

test("my page stays focused on account and pre-trip insurance", () => {
  assert.match(profilePageSource, /マイページ/);
  assert.match(profilePageSource, /プロフィールを編集/);
  assert.match(profilePageSource, /\/profile\/edit/);
  assert.match(profilePageSource, /山岳保険/);
  assert.match(profilePageSource, /mountain_insurance_status/);
  assert.match(profilePageSource, /signOut/);
  assert.doesNotMatch(profilePageSource, /山行前の登録状況/);
  assert.doesNotMatch(profilePageSource, /遭難時の対策/);
  assert.doesNotMatch(profilePageSource, /緊急連絡/);
  assert.doesNotMatch(profilePageSource, /登山の初期設定/);
  assert.doesNotMatch(profilePageSource, /mobile_phone/);
  assert.doesNotMatch(profilePageSource, /emergency_contact_phone/);
  assert.doesNotMatch(profilePageSource, /QRコード/);
  assert.doesNotMatch(profilePageSource, /メッセージ/);
  assert.doesNotMatch(profilePageSource, /ダッシュボード/);
  assert.doesNotMatch(profilePageSource, /山行記録/);
  assert.doesNotMatch(profilePageSource, /getDashboardSummary/);
  assert.doesNotMatch(profilePageSource, /getTripPlans/);
});

test("profile edit page only asks for display profile and mountain insurance", () => {
  for (const copy of [
    "プロフィール設定",
    "基本情報",
    "表示名",
    "山岳保険",
    "加入状況",
    "保険名",
    "有効期限",
    "メールアドレス",
    "保存する"
  ]) {
    assert.match(profileEditPageSource, new RegExp(copy));
  }

  assert.match(profileEditPageSource, /action=\{updateProfile\}/);
  assert.match(profileEditPageSource, /href="\/profile"/);
  assert.doesNotMatch(profileEditPageSource, /遭難時の対策/);
  assert.doesNotMatch(profileEditPageSource, /緊急連絡先/);
  assert.doesNotMatch(profileEditPageSource, /本人の携帯番号/);
  assert.doesNotMatch(profileEditPageSource, /遭難対策サービス/);
  assert.doesNotMatch(profileEditPageSource, /登山の初期設定/);
  assert.doesNotMatch(profileEditPageSource, /主な山域/);
  assert.doesNotMatch(profileEditPageSource, /登山経験/);
  assert.doesNotMatch(profileEditPageSource, /歩行ペース/);
  assert.doesNotMatch(profileEditPageSource, /装備メモ/);
  assert.doesNotMatch(profileEditPageSource, /生年月日/);
  assert.doesNotMatch(profileEditPageSource, /血液型/);
  assert.doesNotMatch(profileEditPageSource, /職業/);
  assert.doesNotMatch(profileEditPageSource, /ホームページ/);
  assert.doesNotMatch(profileEditPageSource, /性別/);
});

test("profile update stores user metadata without adding a new table", () => {
  assert.match(authActionsSource, /export async function updateProfile/);
  assert.match(authActionsSource, /supabase\.auth\.updateUser/);
  assert.match(authActionsSource, /display_name/);
  assert.match(authActionsSource, /mountain_insurance_status/);
  assert.match(authActionsSource, /mountain_insurance_provider/);
  assert.match(authActionsSource, /mountain_insurance_expires_on/);
  assert.match(authActionsSource, /revalidatePath\("\/profile"\)/);
  assert.doesNotMatch(authActionsSource, /mobile_phone/);
  assert.doesNotMatch(authActionsSource, /emergency_phone/);
  assert.doesNotMatch(authActionsSource, /emergency_contact_phone/);
  assert.doesNotMatch(authActionsSource, /rescue_service_name/);
  assert.doesNotMatch(authActionsSource, /home_area/);
  assert.doesNotMatch(authActionsSource, /default_trip_style/);
  assert.doesNotMatch(authActionsSource, /hiking_experience/);
  assert.doesNotMatch(authActionsSource, /gear_preference_note/);
  assert.doesNotMatch(authActionsSource, /\.from\("profiles"\)/);
});
