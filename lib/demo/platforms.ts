import type { Platform } from "@/lib/domain/types";

/**
 * Illustrative platform profiles for the demo validator and the Integrations UI.
 *
 * IMPORTANT: sizes, character limits and capability levels below are placeholders to demonstrate
 * the workflow. They have NOT been verified against each platform's current API documentation.
 * Verifying them is a named task in the backend phase (see docs/frontend-phase-handoff.md).
 */
export const PLATFORMS: readonly Platform[] = [
  {
    id: "google-ads",
    name: "Google Ads",
    blurb: "Display and image ads across Google's network.",
    accent: "#7FB5E6",
    dashboardUrl: "https://ads.google.com/",
    dashboardLabel: "Open Google Ads",
    specs: {
      sizes: [
        { width: 300, height: 250 },
        { width: 336, height: 280 },
        { width: 728, height: 90 },
        { width: 160, height: 600 },
        { width: 300, height: 600 },
        { width: 320, height: 100 },
        { width: 970, height: 250 },
      ],
      ratios: [
        { label: "1.91:1 landscape", value: 1.91 },
        { label: "1:1 square", value: 1 },
      ],
      maxHeadlineChars: 30,
      notes: "Image and responsive display creatives. Final accepted sizes are confirmed per campaign type.",
    },
    capabilities: [
      { label: "Image / display ads", level: "likely", note: "Programmatic campaign and ad creation is generally offered to approved API users." },
      { label: "Search ads", level: "limited", note: "Text-only, so it does not use the visual studio." },
      { label: "Campaign status reporting", level: "likely", note: "Status and metrics are normally readable through the reporting endpoints." },
    ],
    prerequisites: [
      "Developer access approved by the platform",
      "OAuth consent from the user's ad account",
      "Billing set up on the advertiser account",
    ],
  },
  {
    id: "youtube",
    name: "YouTube Ads",
    blurb: "Video campaigns. The video lives on YouTube; Ads Garage prepares the surrounding creative.",
    accent: "#F08A7E",
    dashboardUrl: "https://www.youtube.com/ads/",
    dashboardLabel: "Open YouTube Ads",
    specs: {
      sizes: [{ width: 1280, height: 720 }],
      ratios: [{ label: "16:9 poster", value: 16 / 9 }],
      maxHeadlineChars: 40,
      notes: "A design here is a poster or companion image. The video itself must already be uploaded to YouTube.",
    },
    capabilities: [
      { label: "Video campaigns", level: "limited", note: "Typically managed through the Google Ads account; the video file is not uploaded by Ads Garage." },
      { label: "Poster / companion creative", level: "likely", note: "Image assets can accompany a video campaign." },
    ],
    prerequisites: [
      "A video already published on the user's YouTube channel",
      "YouTube channel linked to the Google Ads account",
      "Same developer access and OAuth consent as Google Ads",
    ],
  },
  {
    id: "tiktok",
    name: "TikTok Ads",
    blurb: "Vertical video and image creative for in-feed placements.",
    accent: "#8FD1A9",
    dashboardUrl: "https://ads.tiktok.com/",
    dashboardLabel: "Open TikTok Ads",
    specs: {
      sizes: [
        { width: 1080, height: 1920 },
        { width: 1080, height: 1080 },
      ],
      ratios: [
        { label: "9:16 vertical", value: 9 / 16 },
        { label: "1:1 square", value: 1 },
      ],
      maxHeadlineChars: 100,
      notes: "Vertical formats lead. Image ad availability depends on placement and region.",
    },
    capabilities: [
      { label: "Video ads", level: "unverified", note: "Needs a review of the current marketing API creative-upload rules." },
      { label: "Image ads", level: "limited", note: "Offered for some placements only." },
    ],
    prerequisites: [
      "Marketing API app approved by the platform",
      "Business account authorization from the user",
      "Region and category policy checks",
    ],
  },
  {
    id: "meta",
    name: "Meta Ads",
    blurb: "Facebook and Instagram feed, story and link placements.",
    accent: "#E0A870",
    dashboardUrl: "https://adsmanager.facebook.com/",
    dashboardLabel: "Open Ads Manager",
    specs: {
      sizes: [
        { width: 1080, height: 1080 },
        { width: 1200, height: 628 },
        { width: 1080, height: 1920 },
      ],
      ratios: [
        { label: "1:1 square", value: 1 },
        { label: "1.91:1 landscape", value: 1.91 },
        { label: "9:16 story", value: 9 / 16 },
      ],
      maxHeadlineChars: 40,
      notes: "Feed, story and reel placements accept different ratios.",
    },
    capabilities: [
      { label: "Image and link ads", level: "likely", note: "Generally available through the marketing API once the app is approved." },
      { label: "Story / reel creatives", level: "unverified", note: "Needs confirmation of per-placement requirements." },
    ],
    prerequisites: [
      "App review for ad-management permissions",
      "Business verification on the advertiser's side",
      "Connected payment method on the ad account",
    ],
  },
];

export function getPlatform(id: string): Platform | undefined {
  return PLATFORMS.find((p) => p.id === id);
}
