/**
 * Domain types shared by UI, demo fixtures and (later) the backend layer.
 * Nothing in this file knows where data comes from.
 */

/* ───────────── Gallery / sandbox ───────────── */

export type AdFormat = "image" | "banner" | "video" | "clickable" | "carousel" | "gamified" | "native";

/**
 * Availability decides what clicking a gallery card does:
 * - learning: opens the dedicated preview page (inspect + learn how it is built)
 * - sandbox:  opens the in-app browser-style viewer, free exploration
 * - active:   opens the viewer with a configured duration / required interactions
 * - inactive: visible but not enabled; explains why
 */
export type AdAvailability = "learning" | "sandbox" | "active" | "inactive";

export type MotifName = "wheel" | "cup" | "wrench" | "paint" | "bolt" | "gauge";

export type Palette = { from: string; to: string; accent: string; ink: string };

export type GameStep =
  | { kind: "choice"; prompt: string; options: string[] }
  | { kind: "tap"; prompt: string; taps: number }
  | { kind: "spin"; prompt: string; prizes: string[] }
  | { kind: "reveal"; prompt: string; reward: string };

/** One card of a carousel ad. */
export type CarouselSlide = { headline: string; body: string; motif: MotifName };

/** What must happen inside the ad before the next action unlocks. */
export type Requirement = { key: string; label: string };

export type Engagement = {
  /** Default minimum viewing time in seconds (reviewers can override in the demo). */
  durationSec: number;
  requirements: Requirement[];
  /** Length of the simulated video, for video formats. */
  videoSec?: number;
};

export type Destination =
  | { kind: "landing"; host: string; path: string; title: string; blurb: string }
  | { kind: "external"; url: string; embeddable: boolean; note: string };

export type Ad = {
  id: string;
  title: string;
  advertiser: string;
  format: AdFormat;
  availability: AdAvailability;
  summary: string;
  tags: string[];
  size: { width: number; height: number };
  palette: Palette;
  motif: MotifName;
  headline: string;
  body: string;
  cta: string;
  game?: GameStep[];
  /** Cards for the carousel format. `headline`, `body` and `motif` above describe the first card. */
  slides?: CarouselSlide[];
  destination: Destination;
  engagement?: Engagement;
  lessonSlug: string;
  templateId: string;
  anatomy: { label: string; note: string }[];
  designNotes: string[];
  inactiveReason?: string;
};

/* ───────────── Learning ───────────── */

export type ExploreControl = "headline" | "contrast" | "cta" | "layout";

export type LessonStep =
  | {
      kind: "explain";
      title: string;
      body: string[];
      previewAdId?: string;
      callouts?: { label: string; note: string }[];
    }
  | { kind: "explore"; title: string; body: string[]; control: ExploreControl }
  | {
      kind: "exercise";
      title: string;
      prompt: string;
      options: { id: string; label: string; correct: boolean; feedback: string }[];
    };

export type Lesson = {
  slug: string;
  title: string;
  summary: string;
  level: "Beginner" | "Intermediate";
  minutes: number;
  format: AdFormat;
  relatedAdId: string;
  templateId: string;
  steps: LessonStep[];
};

/* ───────────── Plans ───────────── */

export type PlanId = "starter" | "pro" | "ultra";

/**
 * available — works in this release
 * preview   — the UI works against mock data; real behaviour needs the backend phase
 * planned   — not built yet
 */
export type FeatureStatus = "available" | "preview" | "planned";

export type PlanFeature = { label: string; status: FeatureStatus; note?: string };

export type Plan = {
  id: PlanId;
  name: string;
  tagline: string;
  comingSoon: boolean;
  features: PlanFeature[];
};

/* ───────────── Integrations ───────────── */

export type PlatformId = "google-ads" | "youtube" | "tiktok" | "meta";

export type CapabilityLevel = "likely" | "limited" | "unverified";

export type Platform = {
  id: PlatformId;
  name: string;
  blurb: string;
  accent: string;
  dashboardUrl: string;
  dashboardLabel: string;
  /** Illustrative creative specs used by the demo validator. Confirm before launch. */
  specs: {
    sizes: { width: number; height: number }[];
    ratios: { label: string; value: number }[];
    maxHeadlineChars: number;
    notes: string;
  };
  capabilities: { label: string; level: CapabilityLevel; note: string }[];
  prerequisites: string[];
};

export type ConnectedAccount = {
  platformId: PlatformId;
  accountName: string;
  accountId: string;
  connectedAt: string;
};

export type CheckResult = { id: string; label: string; status: "pass" | "warn" | "fail"; detail: string };

export type CampaignStatus = "draft" | "in_review" | "approved" | "running" | "paused";

export type Campaign = {
  id: string;
  name: string;
  platformId: PlatformId;
  designId: string;
  designName: string;
  objective: "traffic" | "awareness" | "conversions";
  dailyBudget: number;
  startDate: string;
  endDate: string;
  audience: string;
  status: CampaignStatus;
  submittedAt: string | null;
  /** Fixture campaigns carry a fixed status; submitted demo campaigns progress with time. */
  simulated: boolean;
};
