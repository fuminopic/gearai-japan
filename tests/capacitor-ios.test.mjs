import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const capacitorConfigSource = readFileSync("capacitor.config.ts", "utf8");
const generatedCapacitorConfig = readFileSync(
  "ios/App/App/capacitor.config.json",
  "utf8"
);
const infoPlistSource = readFileSync("ios/App/App/Info.plist", "utf8");
const appDelegateSource = readFileSync("ios/App/App/AppDelegate.swift", "utf8");
const projectSource = readFileSync("ios/App/App.xcodeproj/project.pbxproj", "utf8");
const launchScreenSource = readFileSync(
  "ios/App/App/Base.lproj/LaunchScreen.storyboard",
  "utf8"
);
const appIconContents = readFileSync(
  "ios/App/App/Assets.xcassets/AppIcon.appiconset/Contents.json",
  "utf8"
);

test("Capacitor iOS shell loads the production Yamajitaku site", () => {
  assert.match(capacitorConfigSource, /appId:\s*"com\.yamajitaku\.app"/);
  assert.match(capacitorConfigSource, /appName:\s*"山支度"/);
  assert.match(capacitorConfigSource, /url:\s*"https:\/\/www\.yamajitaku\.com"/);
  assert.match(capacitorConfigSource, /allowNavigation:\s*\["yamajitaku\.com",\s*"www\.yamajitaku\.com"\]/);
  assert.match(capacitorConfigSource, /cleartext:\s*false/);
  assert.match(capacitorConfigSource, /appendUserAgent:\s*"YamajitakuApp"/);

  const generatedConfig = JSON.parse(generatedCapacitorConfig);
  assert.equal(generatedConfig.appId, "com.yamajitaku.app");
  assert.equal(generatedConfig.appName, "山支度");
  assert.equal(generatedConfig.server.url, "https://www.yamajitaku.com");
  assert.deepEqual(generatedConfig.server.allowNavigation, [
    "yamajitaku.com",
    "www.yamajitaku.com"
  ]);
  assert.equal(generatedConfig.server.cleartext, false);
  assert.equal(generatedConfig.appendUserAgent, "YamajitakuApp");
});

test("iOS metadata includes App Store ready identity and permissions", () => {
  assert.match(projectSource, /PRODUCT_BUNDLE_IDENTIFIER = com\.yamajitaku\.app;/);
  assert.match(projectSource, /MARKETING_VERSION = 1\.0;/);
  assert.match(projectSource, /CURRENT_PROJECT_VERSION = 5;/);

  assert.match(infoPlistSource, /<key>CFBundleDisplayName<\/key>\s*<string>山支度<\/string>/);
  assert.match(infoPlistSource, /<key>NSPhotoLibraryUsageDescription<\/key>\s*<string>装備の写真を選択してアップロードするため<\/string>/);
  assert.match(infoPlistSource, /<key>NSCameraUsageDescription<\/key>\s*<string>装備の写真を撮影して登録するため<\/string>/);
  assert.match(infoPlistSource, /<key>ITSAppUsesNonExemptEncryption<\/key>\s*<false\/>/);
  assert.match(infoPlistSource, /<key>CFBundleURLSchemes<\/key>[\s\S]*<string>yamajitaku<\/string>/);
});

test("native launch screen stays neutral before the web app decides what to show", () => {
  assert.match(launchScreenSource, /<view key="view"/);
  assert.doesNotMatch(launchScreenSource, /<imageView key="view"/);
  assert.doesNotMatch(launchScreenSource, /image="Splash"/);
  assert.doesNotMatch(launchScreenSource, /<image name="Splash"/);
});

test("iOS shell uses supplied app icon and enables webview history gestures", () => {
  assert.match(appIconContents, /"size"\s*:\s*"1024x1024"/);
  assert.match(appIconContents, /"filename"\s*:\s*"AppIcon-512@2x\.png"/);
  assert.equal(
    existsSync("ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png"),
    true
  );

  assert.match(appDelegateSource, /allowsBackForwardNavigationGestures\s*=\s*true/);
  assert.match(appDelegateSource, /url\.scheme == "yamajitaku"/);
  assert.match(appDelegateSource, /loadOAuthCallbackInWebView/);
  assert.match(appDelegateSource, /components\.host = "www\.yamajitaku\.com"/);
});
