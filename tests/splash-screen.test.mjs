import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rootLayoutSource = readFileSync("app/layout.tsx", "utf8");
const appLayoutSource = readFileSync("app/(app)/layout.tsx", "utf8");
const splashSource = readFileSync("src/components/splash-screen.tsx", "utf8");
const rootLoadingSource = readFileSync("app/loading.tsx", "utf8");
const authLoadingSource = readFileSync("app/(auth)/loading.tsx", "utf8");

test("authenticated app layout mounts the app splash screen", () => {
  assert.doesNotMatch(rootLayoutSource, /SplashScreen/);
  assert.match(appLayoutSource, /SplashScreen/);
  assert.match(appLayoutSource, /@\/components\/splash-screen/);
});

test("splash screen uses the supplied artwork with a short one-time fade", () => {
  assert.match(splashSource, /"use client"/);
  assert.match(splashSource, /\/splash-screen\.png/);
  assert.match(splashSource, /SPLASH_VISIBLE_MS = 1000/);
  assert.match(splashSource, /SPLASH_FADE_MS = 260/);
  assert.doesNotMatch(splashSource, /sessionStorage/);
  assert.doesNotMatch(splashSource, /yamajitaku:splash-seen:v2/);
  assert.match(splashSource, /object-cover/);
  assert.match(splashSource, /fetchPriority="high"/);
  assert.match(splashSource, /isArtworkReady/);
  assert.match(splashSource, /imageRef\.current\?\.complete/);
});

test("pre-auth startup loading stays visually neutral", () => {
  for (const source of [rootLoadingSource, authLoadingSource]) {
    assert.match(source, /bg-white/);
    assert.doesNotMatch(source, /animate-pulse/);
    assert.doesNotMatch(source, /shadow-soft/);
    assert.doesNotMatch(source, /bg-trail-50/);
    assert.doesNotMatch(source, /rounded-lg/);
  }
});
