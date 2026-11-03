export type TrafficUnit = "pageviews" | "sessions" | "none" | "review";

export type AdNetwork = {
  id: string;
  name: string;
  minTraffic: number;
  trafficUnit: TrafficUnit;
  setupFee: number;
  exclusive: boolean;
  exclusiveAfterDays: number | null;
  rpmRange: { low: number; high: number };
  notes: string;
  affiliate: boolean;
};

export const NETWORKS: readonly AdNetwork[] = [
  {
    id: "adsterra",
    name: "Adsterra / Monetag",
    minTraffic: 0,
    trafficUnit: "none",
    setupFee: 0,
    exclusive: false,
    exclusiveAfterDays: null,
    rpmRange: { low: 1, high: 6 },
    notes: "Easiest approval, lowest RPM. Useful while a site is still gathering traffic.",
    affiliate: true,
  },
  {
    id: "adsense",
    name: "Google AdSense",
    minTraffic: 0,
    trafficUnit: "review",
    setupFee: 0,
    exclusive: false,
    exclusiveAfterDays: null,
    rpmRange: { low: 4, high: 16 },
    notes: "No fixed traffic minimum. Site-quality review. Baseline for most publishers.",
    affiliate: false,
  },
  {
    id: "ezoic",
    name: "Ezoic",
    minTraffic: 0,
    trafficUnit: "none",
    setupFee: 0,
    exclusive: false,
    exclusiveAfterDays: null,
    rpmRange: { low: 6, high: 22 },
    notes: "Minimum removed in 2023. Non-exclusive. AI layout testing; 2–4 weeks to optimise.",
    affiliate: true,
  },
  {
    id: "medianet",
    name: "Media.net",
    minTraffic: 0,
    trafficUnit: "review",
    setupFee: 0,
    exclusive: false,
    exclusiveAfterDays: null,
    rpmRange: { low: 5, high: 20 },
    notes: "Traffic plus content review. Contextual. Strongest on US/UK traffic.",
    affiliate: false,
  },
  {
    id: "monumetric",
    name: "Monumetric",
    minTraffic: 10_000,
    trafficUnit: "pageviews",
    setupFee: 99,
    exclusive: true,
    exclusiveAfterDays: 30,
    rpmRange: { low: 10, high: 28 },
    notes: "$99 setup fee on the entry tier. Exclusive after a 30-day trial.",
    affiliate: false,
  },
  {
    id: "mediavine",
    name: "Mediavine",
    minTraffic: 50_000,
    trafficUnit: "sessions",
    setupFee: 0,
    exclusive: true,
    exclusiveAfterDays: 0,
    rpmRange: { low: 18, high: 45 },
    notes: "Exclusive. Premium RPM. Requires 50,000 sessions per month.",
    affiliate: false,
  },
  {
    id: "raptive",
    name: "Raptive",
    minTraffic: 100_000,
    trafficUnit: "pageviews",
    setupFee: 0,
    exclusive: true,
    exclusiveAfterDays: 0,
    rpmRange: { low: 20, high: 50 },
    notes: "Exclusive. US-audience focused. Requires 100,000 pageviews per month.",
    affiliate: false,
  },
];

export type Eligibility = {
  network: AdNetwork;
  eligible: boolean;
  gap: number;
  gapUnit: TrafficUnit;
};

function trafficForNetwork(pageviews: number, network: AdNetwork): number {
  if (network.trafficUnit === "sessions") {
    return Math.round(pageviews * 0.72);
  }
  return pageviews;
}

export function qualifyNetworks(monthlyPageviews: number): Eligibility[] {
  const rows = NETWORKS.map((network) => {
    if (network.trafficUnit === "none" || network.trafficUnit === "review") {
      return {
        network,
        eligible: true,
        gap: 0,
        gapUnit: network.trafficUnit,
      };
    }

    const current = trafficForNetwork(monthlyPageviews, network);
    const eligible = current >= network.minTraffic;
    return {
      network,
      eligible,
      gap: eligible ? 0 : network.minTraffic - current,
      gapUnit: network.trafficUnit,
    };
  });

  return rows.sort((a, b) => {
    if (a.eligible !== b.eligible) return a.eligible ? -1 : 1;
    return a.network.minTraffic - b.network.minTraffic;
  });
}

export function formatTrafficNeed(network: AdNetwork): string {
  if (network.trafficUnit === "none") return "No traffic minimum";
  if (network.trafficUnit === "review") return "Site quality review — no fixed minimum";
  const unit = network.trafficUnit === "sessions" ? "sessions" : "pageviews";
  return `${network.minTraffic.toLocaleString("en-US")} ${unit}/mo`;
}
