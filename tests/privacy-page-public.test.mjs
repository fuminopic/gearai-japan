import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const publicPrivacyPath = "app/privacy/page.tsx";
const protectedPrivacyPath = "app/(app)/privacy/page.tsx";
const publicPrivacySource = readFileSync(publicPrivacyPath, "utf8");
const appLayoutSource = readFileSync("app/(app)/layout.tsx", "utf8");

test("privacy policy is served from the public /privacy route", () => {
  assert.ok(existsSync(publicPrivacyPath));
  assert.equal(existsSync(protectedPrivacyPath), false);
  assert.match(publicPrivacySource, /export default function PrivacyPage/);
  assert.doesNotMatch(publicPrivacySource, /requireUser/);
  assert.doesNotMatch(publicPrivacySource, /redirect\("\/login"\)/);
  assert.doesNotMatch(publicPrivacySource, /noindex/i);
  assert.match(appLayoutSource, /AuthGate/);
});

test("privacy policy keeps the supplied legal content and contact details", () => {
  for (const copy of [
    "最終更新日：2026年6月21日",
    "山支度（YAMAJITAKU、以下「本アプリ」といいます）",
    "yamajitaku.app@gmail.com",
    "アカウント情報",
    "装備データ",
    "山行計画データ",
    "装備写真",
    "Supabase（東京リージョン）",
    "Vercel",
    "写真ライブラリへのアクセス",
    "カメラへのアクセス",
    "アカウントを削除",
    "13歳未満",
    "© 2026 山支度 YAMAJITAKU"
  ]) {
    assert.match(publicPrivacySource, new RegExp(copy));
  }
});

test("privacy policy exposes crawlable metadata for App Store review", () => {
  assert.match(publicPrivacySource, /export const metadata/);
  assert.match(publicPrivacySource, /title: "プライバシーポリシー"/);
  assert.match(publicPrivacySource, /canonical: "\/privacy"/);
  assert.doesNotMatch(publicPrivacySource, /robots/);
});
