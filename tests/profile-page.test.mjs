import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const profilePageSource = readFileSync("app/(app)/profile/page.tsx", "utf8");
const profileEditPageSource = readFileSync("app/(app)/profile/edit/page.tsx", "utf8");
const authActionsSource = readFileSync("src/lib/actions/auth.ts", "utf8");

test("my page works as an account and mountain safety center", () => {
  assert.match(profilePageSource, /マイページ/);
  assert.match(profilePageSource, /プロフィール設定を編集/);
  assert.match(profilePageSource, /\/profile\/edit/);
  assert.match(profilePageSource, /保険・遭難時の対策/);
  assert.match(profilePageSource, /山行前の登録状況/);
  assert.match(profilePageSource, /登山の初期設定/);
  assert.match(profilePageSource, /mobile_phone/);
  assert.match(profilePageSource, /emergency_contact_phone/);
  assert.match(profilePageSource, /mountain_insurance_status/);
  assert.match(profilePageSource, /signOut/);
  assert.doesNotMatch(profilePageSource, /QRコード/);
  assert.doesNotMatch(profilePageSource, /メッセージ/);
  assert.doesNotMatch(profilePageSource, /ダッシュボード/);
  assert.doesNotMatch(profilePageSource, /山行記録/);
  assert.doesNotMatch(profilePageSource, /getDashboardSummary/);
  assert.doesNotMatch(profilePageSource, /getTripPlans/);
});

test("profile edit page only asks for Yamajitaku-relevant settings", () => {
  for (const copy of [
    "プロフィール設定",
    "基本情報",
    "表示名",
    "保険・遭難時の対策",
    "本人の携帯番号",
    "緊急連絡先の名前",
    "緊急連絡先の電話",
    "山岳保険",
    "保険期限",
    "遭難対策サービス",
    "登山の初期設定",
    "主な山域",
    "よく使うスタイル",
    "登山経験",
    "歩行ペース",
    "装備メモ",
    "メールアドレス",
    "保存する"
  ]) {
    assert.match(profileEditPageSource, new RegExp(copy));
  }

  assert.match(profileEditPageSource, /action=\{updateProfile\}/);
  assert.match(profileEditPageSource, /href="\/profile"/);
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
  assert.match(authActionsSource, /mobile_phone/);
  assert.match(authActionsSource, /emergency_phone/);
  assert.match(authActionsSource, /emergency_contact_phone/);
  assert.match(authActionsSource, /mountain_insurance_status/);
  assert.match(authActionsSource, /rescue_service_name/);
  assert.match(authActionsSource, /home_area/);
  assert.match(authActionsSource, /default_trip_style/);
  assert.match(authActionsSource, /hiking_experience/);
  assert.match(authActionsSource, /gear_preference_note/);
  assert.match(authActionsSource, /revalidatePath\("\/profile"\)/);
  assert.doesNotMatch(authActionsSource, /\.from\("profiles"\)/);
});
