import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const profilePageSource = readFileSync("app/(app)/profile/page.tsx", "utf8");
const profileEditPageSource = readFileSync("app/(app)/profile/edit/page.tsx", "utf8");
const insurancePageSource = readFileSync("app/(app)/profile/insurance/page.tsx", "utf8");
const authActionsSource = readFileSync("src/lib/actions/auth.ts", "utf8");

test("my page stays focused on account and pre-trip insurance", () => {
  assert.match(profilePageSource, /マイページ/);
  assert.match(profilePageSource, /プロフィールを編集/);
  assert.match(profilePageSource, /\/profile\/edit/);
  assert.match(profilePageSource, /\/profile\/insurance/);
  assert.match(profilePageSource, /山岳保険のご案内、保険情報の入力/);
  assert.match(profilePageSource, /mountain_insurance_status/);
  assert.match(profilePageSource, /未加入/);
  assert.match(profilePageSource, /契約済み/);
  assert.match(profilePageSource, /signOut/);
  assert.doesNotMatch(profilePageSource, /山行前の登録状況/);
  assert.doesNotMatch(profilePageSource, /遭難時の対策/);
  assert.doesNotMatch(profilePageSource, /遭難対策サービス/);
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
    "メールアドレス",
    "保存する"
  ]) {
    assert.match(profileEditPageSource, new RegExp(copy));
  }

  assert.match(profileEditPageSource, /action=\{updateProfile\}/);
  assert.match(profileEditPageSource, /href="\/profile"/);
  assert.doesNotMatch(profileEditPageSource, /山岳保険/);
  assert.doesNotMatch(profileEditPageSource, /加入状況/);
  assert.doesNotMatch(profileEditPageSource, /保険名/);
  assert.doesNotMatch(profileEditPageSource, /有効期限/);
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

test("insurance page mirrors the insurance-only entry flow", () => {
  for (const copy of [
    "保険のご加入",
    "保険",
    "未加入",
    "契約済み",
    "保険名",
    "保険開始日",
    "保険終了日",
    "証券番号などを入力してください"
  ]) {
    assert.match(insurancePageSource, new RegExp(copy));
  }

  assert.match(insurancePageSource, /action=\{updateInsurance\}/);
  assert.match(insurancePageSource, /name="mountain_insurance_status"/);
  assert.match(insurancePageSource, /name="mountain_insurance_provider"/);
  assert.match(insurancePageSource, /name="mountain_insurance_starts_on"/);
  assert.match(insurancePageSource, /name="mountain_insurance_expires_on"/);
  assert.match(insurancePageSource, /name="mountain_insurance_policy_number"/);
  assert.match(insurancePageSource, /accent-\[#14724e\]/);
  assert.match(insurancePageSource, /min-w-0 max-w-full/);
  assert.doesNotMatch(insurancePageSource, /遭難対策サービス/);
  assert.doesNotMatch(insurancePageSource, /sticky bottom-24/);
});

test("profile and insurance updates store user metadata without adding a new table", () => {
  assert.match(authActionsSource, /export async function updateProfile/);
  assert.match(authActionsSource, /export async function updateInsurance/);
  assert.match(authActionsSource, /supabase\.auth\.updateUser/);
  assert.match(authActionsSource, /display_name/);
  assert.match(authActionsSource, /mountain_insurance_status/);
  assert.match(authActionsSource, /mountain_insurance_provider/);
  assert.match(authActionsSource, /mountain_insurance_starts_on/);
  assert.match(authActionsSource, /mountain_insurance_expires_on/);
  assert.match(authActionsSource, /mountain_insurance_policy_number/);
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
