import posthog from "posthog-js";

const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
const analyticsWindow = window as Window & {
  __yamajitakuPostHogInitialized?: boolean;
};

if (projectToken && host && !analyticsWindow.__yamajitakuPostHogInitialized) {
  posthog.init(projectToken, {
    api_host: host,
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    capture_dead_clicks: false,
    rageclick: false,
    disable_session_recording: true,
    enable_heatmaps: false,
    disable_surveys: true,
    advanced_disable_flags: true,
    mask_all_text: true,
    mask_all_element_attributes: true,
    property_denylist: ["$current_url", "$pathname", "$referrer", "$referring_domain"],
    before_send: (event) => {
      if (!event) {
        return null;
      }

      const allowedEvents = new Set([
        "$identify",
        "plan_generate",
        "gap_view",
        "gear_mark_owned",
        "plan_save",
        "preparation_complete",
        "second_plan_create"
      ]);

      return allowedEvents.has(event.event) ? event : null;
    }
  });
  analyticsWindow.__yamajitakuPostHogInitialized = true;
}
