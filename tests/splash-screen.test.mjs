import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rootLayoutSource = readFileSync("app/layout.tsx", "utf8");
const splashSource = readFileSync("src/components/splash-screen.tsx", "utf8");

test("root layout mounts the app splash screen", () => {
  assert.match(rootLayoutSource, /SplashScreen/);
  assert.match(rootLayoutSource, /@\/components\/splash-screen/);
});

test("splash screen uses the supplied artwork with a short one-time fade", () => {
  assert.match(splashSource, /"use client"/);
  assert.match(splashSource, /\/splash-screen\.png/);
  assert.match(splashSource, /SPLASH_VISIBLE_MS = 1000/);
  assert.match(splashSource, /SPLASH_FADE_MS = 260/);
  assert.match(splashSource, /sessionStorage/);
  assert.match(splashSource, /yamajitaku:splash-seen/);
  assert.match(splashSource, /object-cover/);
  assert.match(splashSource, /priority/);
});
