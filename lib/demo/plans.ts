import type { Plan } from "@/lib/domain/types";

/**
 * Feature status is deliberate and honest:
 * - available: works in this release
 * - preview:   the interface works against mock data; the real behaviour needs the backend phase
 * - planned:   not built
 *
 * No prices are set yet. Pricing is a product decision for the subscription-processing phase.
 * AI models are not chosen: they will be picked on cost, licensing and API availability at
 * implementation time, and tiers map to model lists and usage limits.
 */
export const PLANS: readonly Plan[] = [
  {
    id: "starter",
    name: "Starter",
    tagline: "Learn, experiment and create ads, then publish them yourself.",
    comingSoon: false,
    features: [
      { label: "Gallery, Learning Centre and Sandbox", status: "available" },
      { label: "Ad creation studio with core templates and formats", status: "available" },
      { label: "Live preview, including an in-context page mockup", status: "available" },
      { label: "Export PNG, HTML, JSON and a ZIP bundle", status: "available" },
      { label: "Copy generated HTML or React code", status: "available" },
      { label: "Links to Google Ads, YouTube, TikTok and Meta dashboards", status: "available" },
      { label: "Basic AI models with limited monthly usage", status: "planned", note: "Needs accounts, a model provider and usage metering." },
      { label: "Saved projects in this browser", status: "available", note: "Stored locally in the demo. Account sync arrives with the backend." },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "An integrated workflow: more AI, more formats, and connected publishing.",
    comingSoon: false,
    features: [
      { label: "Everything in Starter", status: "available" },
      { label: "More capable AI models and higher usage limits", status: "planned", note: "Models are chosen on cost, licensing and API availability when this is built." },
      { label: "Additional templates and ad formats", status: "available", note: "Unlocked in the demo with the plan switch below." },
      { label: "Platform validation checks for your design", status: "available" },
      { label: "Connect advertising accounts", status: "preview", note: "Simulated connection. Real OAuth is built in the backend phase." },
      { label: "Campaign creation, review and guided publishing", status: "preview", note: "Mock campaign form and status tracking." },
      { label: "Publishing and campaign management where each platform's API allows it", status: "planned", note: "Depends on API access, approvals and per-platform capability checks." },
      { label: "Saved projects and reusable designs, synced to your account", status: "planned", note: "Needs accounts and a database." },
    ],
  },
  {
    id: "ultra",
    name: "Ultra",
    tagline: "The most advanced creation and campaign tools Ads Garage offers.",
    comingSoon: true,
    features: [
      { label: "Everything in Pro", status: "planned" },
      { label: "The most advanced AI models and the highest usage allowances", status: "planned" },
      { label: "Premium image and video generation", status: "planned" },
      { label: "Advanced interactive and gamified ad creation", status: "planned" },
      { label: "More templates, more integrations and higher project limits", status: "planned" },
      { label: "Multi-platform publishing workflows", status: "planned", note: "Only where the platform supports third-party publishing." },
      { label: "Campaign status and results inside Ads Garage", status: "planned" },
      { label: "Team projects and reusable brand kits", status: "planned" },
    ],
  },
];
