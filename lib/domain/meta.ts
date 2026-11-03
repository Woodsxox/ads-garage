import type { Ad, AdAvailability, AdFormat } from "@/lib/domain/types";

export const FORMAT_META: Record<AdFormat, { label: string; blurb: string }> = {
  image: { label: "Image", blurb: "A static creative: one message, one call to action." },
  banner: { label: "Banner", blurb: "Standard display sizes like the leaderboard and skyscraper, built to fit a page slot." },
  video: { label: "Video", blurb: "Motion with a hook in the first seconds and a clear end card." },
  clickable: { label: "Clickable", blurb: "Built around the click: hover states, destination, follow-through." },
  carousel: { label: "Carousel", blurb: "Several cards in one unit. The viewer swipes or taps through, one idea per card." },
  gamified: { label: "Gamified", blurb: "Short interactions the viewer completes step by step." },
  native: { label: "Native", blurb: "Matches the page around it: in-feed cards and in-article units." },
};

export const FORMAT_ORDER: AdFormat[] = ["image", "banner", "video", "clickable", "carousel", "gamified", "native"];

export const AVAILABILITY_META: Record<
  AdAvailability,
  { label: string; short: string; description: string; action: string; tone: "chalk" | "torque" | "hazard" | "flag" }
> = {
  learning: {
    label: "Learning demo",
    short: "Inspect and learn",
    description:
      "Open a dedicated preview page: examine the design, see its anatomy and read how it is implemented.",
    action: "Open preview",
    tone: "chalk",
  },
  sandbox: {
    label: "Sandbox",
    short: "Interact freely",
    description:
      "Opens in the Ads Garage viewer. Click and explore every element without leaving the platform.",
    action: "Open in sandbox",
    tone: "torque",
  },
  active: {
    label: "Active experience",
    short: "Timed or required steps",
    description:
      "A defined engagement: a viewing duration, video playback or required interactions unlock the next action.",
    action: "Start experience",
    tone: "hazard",
  },
  inactive: {
    label: "Inactive",
    short: "Not enabled",
    description: "Listed for reference. This ad is paused, retired or waiting on a capability that is not built yet.",
    action: "Why inactive?",
    tone: "flag",
  },
};

export const AVAILABILITY_ORDER: AdAvailability[] = ["learning", "sandbox", "active", "inactive"];

/** Where clicking a gallery item goes. Depends on availability, never on format alone. */
export function adHref(ad: Ad): string | null {
  switch (ad.availability) {
    case "learning":
      return `/gallery/${ad.id}`;
    case "sandbox":
    case "active":
      return `/sandbox/${ad.id}`;
    case "inactive":
      return null;
  }
}
