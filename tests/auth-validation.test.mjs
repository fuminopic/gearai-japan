import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const authValidationSource = readFileSync("src/lib/auth-validation.ts", "utf8");
const gearDataSource = readFileSync("src/lib/data/gear.ts", "utf8");
const appLayoutSource = readFileSync("app/(app)/layout.tsx", "utf8");
const homePageSource = readFileSync("app/page.tsx", "utf8");

test("auth validation classifies missing and invalid sessions as login redirects", () => {
  assert.match(authValidationSource, /export function classifyAuthUserError/);
  assert.match(authValidationSource, /authsessionmissing/);
  assert.match(authValidationSource, /auth session missing/);
  assert.match(authValidationSource, /session missing/);
  assert.match(authValidationSource, /invalid token/);
  assert.match(authValidationSource, /jwt expired/);
  assert.match(authValidationSource, /refresh token/);
  assert.match(authValidationSource, /status === 400 \|\| status === 401 \|\| status === 403/);
  assert.match(gearDataSource, /authResult\.kind === "unauthenticated"/);
  assert.match(gearDataSource, /redirect\("\/login"\)/);
});

test("auth validation retries transient errors once before surfacing recoverable UI", () => {
  assert.match(authValidationSource, /getUserWithAuthRetry/);
  assert.match(authValidationSource, /classifyAuthUserError\(result\.error\) === "transient"/);
  assert.match(authValidationSource, /setTimeout\(resolve, 400\)/);
  assert.match(authValidationSource, /status === 429/);
  assert.match(authValidationSource, /status >= 500/);
  assert.match(authValidationSource, /fetch failed/);
  assert.match(authValidationSource, /network/);
  assert.match(authValidationSource, /transient_error/);
  assert.match(gearDataSource, /throw new AuthValidationError\(authResult\.message\)/);
});

test("protected app layout catches transient auth validation errors instead of 500", () => {
  assert.match(appLayoutSource, /import \{ AuthValidationError, requireUser \}/);
  assert.match(appLayoutSource, /catch \(caught\)/);
  assert.match(appLayoutSource, /caught instanceof AuthValidationError/);
  assert.match(appLayoutSource, /<RecoverableAuthError message=\{caught\.message\} \/>/);
  assert.match(appLayoutSource, /function RecoverableAuthError/);
  assert.match(appLayoutSource, /ログイン状態を確認できませんでした/);
  assert.match(appLayoutSource, /再試行/);
  assert.match(appLayoutSource, /ログイン画面へ/);
  assert.doesNotMatch(appLayoutSource, /signOut/);
});

test("home page shares the same auth classifier as requireUser", () => {
  assert.match(homePageSource, /getUserWithAuthRetry/);
  assert.match(homePageSource, /result\.kind === "transient_error"/);
  assert.match(homePageSource, /result\.kind === "authenticated"/);
  assert.doesNotMatch(homePageSource, /supabase\.auth\.getUser\(\)/);
  assert.doesNotMatch(homePageSource, /setTimeout\(resolve, 400\)/);
});
