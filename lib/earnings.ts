import { getFormat, type PlacementId } from "@/lib/ad-sizes";

const FORMAT_RPM: Record<string, { low: number; high: number }> = {
  "200x200": { low: 3, high: 10 },
  "250x250": { low: 4, high: 12 },
  "300x250": { low: 6, high: 18 },
  "336x280": { low: 7, high: 20 },
  "300x600": { low: 8, high: 22 },
  "320x100": { low: 3, high: 10 },
  "320x50": { low: 2, high: 8 },
  "728x90": { low: 4, high: 12 },
  "970x250": { low: 8, high: 24 },
  "160x600": { low: 5, high: 14 },
  responsive: { low: 5, high: 16 },
  "in-article": { low: 8, high: 25 },
  "in-feed": { low: 6, high: 20 },
};

const PLACEMENT_FACTOR: Record<PlacementId, number> = {
  sidebar: 0.85,
  "in-content": 1,
  header: 0.9,
  "sticky-footer": 0.7,
};

export const ESTIMATE_PAGEVIEWS = 50_000;

export type EarningsRange = {
  low: number;
  high: number;
  pageviews: number;
};

export function estimateMonthlyRevenue(input: {
  formatId: string;
  placement: PlacementId;
  density: number;
  pageviews?: number;
}): EarningsRange {
  const pageviews = input.pageviews ?? ESTIMATE_PAGEVIEWS;
  const format = getFormat(input.formatId);
  const rpm = FORMAT_RPM[format.id] ?? { low: 4, high: 12 };
  const placement = PLACEMENT_FACTOR[input.placement];
  const density = Math.min(5, Math.max(1, input.density));
  const diminishing = 1 + (density - 1) * 0.55;
  const thousands = pageviews / 1000;

  return {
    low: Math.round(rpm.low * thousands * placement * diminishing),
    high: Math.round(rpm.high * thousands * placement * diminishing),
    pageviews,
  };
}

export function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
