export const FTC_DISCLOSURE =
  "Some links on this page are affiliate referrals. If you apply through them, Ads Garage may earn a commission at no extra cost to you. This does not change the recommendation order, which is gated by your traffic numbers.";

export type AffiliateConfig = {
  networkId: string;
  label: string;
  href: string;
};

/**
 * Google AdSense does not operate a referral programme — never add an AdSense link here.
 * Replace placeholder hrefs with your live referral URLs before launch.
 */
export const AFFILIATES: readonly AffiliateConfig[] = [
  {
    networkId: "ezoic",
    label: "Apply to Ezoic",
    href: "https://www.ezoic.com/?ref=ADGARAGE_TODO",
  },
  {
    networkId: "adsterra",
    label: "Apply to Adsterra / Monetag",
    href: "https://www.adsterra.com/?ref=ADGARAGE_TODO",
  },
];

export function affiliateFor(networkId: string): AffiliateConfig | undefined {
  return AFFILIATES.find((entry) => entry.networkId === networkId);
}
