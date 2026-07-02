import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rootLayoutSource = readFileSync("app/layout.tsx", "utf8");
const appLayoutSource = readFileSync("app/(app)/layout.tsx", "utf8");
const rootLoadingSource = readFileSync("app/loading.tsx", "utf8");
const authLoadingSource = readFileSync("app/(auth)/loading.tsx", "utf8");

test("authenticated remote app layout avoids a second splash screen", () => {
  assert.doesNotMatch(rootLayoutSource, /SplashScreen/);
  assert.doesNotMatch(appLayoutSource, /SplashScreen/);
  assert.doesNotMatch(appLayoutSource, /@\/components\/splash-screen/);
  assert.match(appLayoutSource, /No remote splash here/);
  assert.match(appLayoutSource, /bundled local login page owns the single/);
});

test("pre-auth startup loading stays neutral and spinner-only", () => {
  for (const source of [rootLoadingSource, authLoadingSource]) {
    assert.match(source, /bg-\[#FAFAF8\]/);
    assert.match(source, /animate-spin/);
    assert.match(source, /border-t-\[#2D6A4F\]/);
    assert.doesNotMatch(source, /shadow-soft/);
    assert.doesNotMatch(source, /bg-trail-50/);
    assert.doesNotMatch(source, /rounded-lg/);
    assert.doesNotMatch(source, /yamajitaku-splash-logo/);
  }
});
