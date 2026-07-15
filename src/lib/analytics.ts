"use client";

import posthog from "posthog-js";

type AnalyticsPlatform = "web" | "ios_webview";
type AnalyticsEventProperties = {
  plan_generate: {
    season: string;
    style: string;
    platform: AnalyticsPlatform;
  };
  gap_view: {
    missing_count: number;
    season: string;
    style: string;
    platform: AnalyticsPlatform;
  };
  gear_mark_owned: {
    source: "gear_form";
    category: string;
    is_catalog_item: boolean;
  };
  plan_save: {
    season: string;
    style: string;
    platform: AnalyticsPlatform;
  };
  preparation_complete: {
    season: string;
    style: string;
    platform: AnalyticsPlatform;
  };
  second_plan_create: {
    season: string;
    style: string;
    platform: AnalyticsPlatform;
  };
};

type AnalyticsEventName = keyof AnalyticsEventProperties;
type AnalyticsStorageScope = "session" | "persistent";

const analyticsStoragePrefix = "yamajitaku:analytics:v1";
let identifiedUserId: string | null = null;

export function identifyAnalyticsUser(userId: string) {
  if (!isAnalyticsEnabled() || identifiedUserId === userId) {
    return;
  }

  posthog.identify(userId);
  identifiedUserId = userId;
}

export function captureAnalyticsEvent<TEvent extends AnalyticsEventName>(
  event: TEvent,
  properties: AnalyticsEventProperties[TEvent]
) {
  if (!isAnalyticsEnabled()) {
    return;
  }

  posthog.capture(event, properties);
}

export function captureAnalyticsEventOnce<TEvent extends AnalyticsEventName>({
  event,
  key,
  properties,
  scope = "session"
}: {
  event: TEvent;
  key: string;
  properties: AnalyticsEventProperties[TEvent];
  scope?: AnalyticsStorageScope;
}) {
  const storage = getAnalyticsStorage(scope);
  const storageKey = `${analyticsStoragePrefix}:${event}:${key}`;

  try {
    if (storage?.getItem(storageKey)) {
      return;
    }

    storage?.setItem(storageKey, "1");
  } catch {
    // Analytics must never interrupt a plan or gear mutation when storage is unavailable.
  }

  captureAnalyticsEvent(event, properties);
}

export function getAnalyticsPlatform(): AnalyticsPlatform {
  if (typeof window === "undefined") {
    return "web";
  }

  const isNativeApp =
    window.name.startsWith("yamajitaku-native") ||
    document.cookie.split(";").some((cookie) => cookie.trim() === "yj_local_app=1");

  return isNativeApp ? "ios_webview" : "web";
}

function isAnalyticsEnabled() {
  return Boolean(
    process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN && process.env.NEXT_PUBLIC_POSTHOG_HOST
  );
}

function getAnalyticsStorage(scope: AnalyticsStorageScope): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return scope === "persistent" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}
