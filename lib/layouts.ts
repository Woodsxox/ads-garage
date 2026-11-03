export type SavedLayout = {
  id: string;
  name: string;
  createdAt: string;
  platform: "wordpress" | "nextjs" | "html" | "shopify";
  formatId: string;
  placement: "sidebar" | "in-content" | "header" | "sticky-footer";
  density: number;
  networkId: string;
  style: {
    align: "left" | "center" | "right";
    maxWidth: "unit" | "container";
    padding: "compact" | "comfortable";
    surface: "transparent" | "panel";
  };
};

export type LayoutRevenuePoint = {
  layoutId: string;
  at: string;
  rpmLow: number;
  rpmHigh: number;
};

export const SANE_DENSITY_MAX = 3;
