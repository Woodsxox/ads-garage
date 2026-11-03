export const VIEWPORTS = {
  desktop: { id: "desktop", label: "Desktop", width: 1280 },
  tablet: { id: "tablet", label: "Tablet", width: 768 },
  mobile: { id: "mobile", label: "Mobile", width: 375 },
} as const;

export type ViewportId = keyof typeof VIEWPORTS;

export const PLACEMENTS = {
  sidebar: { id: "sidebar", label: "Sidebar" },
  "in-content": { id: "in-content", label: "In-content" },
  header: { id: "header", label: "Header" },
  "sticky-footer": { id: "sticky-footer", label: "Sticky footer" },
} as const;

export type PlacementId = keyof typeof PLACEMENTS;

export type AdFormatKind = "fixed" | "responsive" | "in-article" | "in-feed";

export type AdFormat = {
  id: string;
  label: string;
  kind: AdFormatKind;
  width: number;
  height: number;
  adsenseFormat: string;
  previewLabel: string;
};

/**
 * Rule 5 — only sizes AdSense actually fills.
 * Smallest reliable fixed square is 200×200.
 */
export const AD_FORMATS: readonly AdFormat[] = [
  {
    id: "200x200",
    label: "200×200",
    kind: "fixed",
    width: 200,
    height: 200,
    adsenseFormat: "rectangle",
    previewLabel: "200×200",
  },
  {
    id: "250x250",
    label: "250×250",
    kind: "fixed",
    width: 250,
    height: 250,
    adsenseFormat: "rectangle",
    previewLabel: "250×250",
  },
  {
    id: "300x250",
    label: "300×250",
    kind: "fixed",
    width: 300,
    height: 250,
    adsenseFormat: "rectangle",
    previewLabel: "300×250",
  },
  {
    id: "336x280",
    label: "336×280",
    kind: "fixed",
    width: 336,
    height: 280,
    adsenseFormat: "rectangle",
    previewLabel: "336×280",
  },
  {
    id: "300x600",
    label: "300×600",
    kind: "fixed",
    width: 300,
    height: 600,
    adsenseFormat: "rectangle",
    previewLabel: "300×600",
  },
  {
    id: "320x100",
    label: "320×100",
    kind: "fixed",
    width: 320,
    height: 100,
    adsenseFormat: "rectangle",
    previewLabel: "320×100",
  },
  {
    id: "320x50",
    label: "320×50",
    kind: "fixed",
    width: 320,
    height: 50,
    adsenseFormat: "rectangle",
    previewLabel: "320×50",
  },
  {
    id: "728x90",
    label: "728×90",
    kind: "fixed",
    width: 728,
    height: 90,
    adsenseFormat: "horizontal",
    previewLabel: "728×90",
  },
  {
    id: "970x250",
    label: "970×250",
    kind: "fixed",
    width: 970,
    height: 250,
    adsenseFormat: "horizontal",
    previewLabel: "970×250",
  },
  {
    id: "160x600",
    label: "160×600",
    kind: "fixed",
    width: 160,
    height: 600,
    adsenseFormat: "vertical",
    previewLabel: "160×600",
  },
  {
    id: "responsive",
    label: "Responsive",
    kind: "responsive",
    width: 336,
    height: 280,
    adsenseFormat: "auto",
    previewLabel: "fluid",
  },
  {
    id: "in-article",
    label: "In-article",
    kind: "in-article",
    width: 336,
    height: 280,
    adsenseFormat: "fluid",
    previewLabel: "in-article",
  },
  {
    id: "in-feed",
    label: "In-feed",
    kind: "in-feed",
    width: 300,
    height: 250,
    adsenseFormat: "fluid",
    previewLabel: "in-feed",
  },
] as const;

export const MIN_FIXED_SIDE = 200;

export function getFormat(id: string): AdFormat {
  const found = AD_FORMATS.find((format) => format.id === id);
  if (!found) {
    throw new Error(`Unknown ad format: ${id}`);
  }
  return found;
}

export function isValidFormatId(id: string): boolean {
  return AD_FORMATS.some((format) => format.id === id);
}

export function dimensionString(format: AdFormat): string {
  if (format.kind !== "fixed") {
    return format.previewLabel;
  }
  return `${format.width}×${format.height}`;
}
