"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { adsenseClient, adsenseConfigured, isLiveAdRoute } from "@/lib/ads/policy";

/**
 * Loads adsbygoogle.js, and only on routes where live units are allowed and only once a real
 * publisher ID is configured. Mounted once, in the root layout.
 *
 * A script that has loaded stays loaded during client-side navigation, so keep Auto ads turned
 * off in the AdSense account: otherwise Google could place units on routes that never asked for one.
 */
export function AdSenseLoader() {
  const pathname = usePathname();
  if (!adsenseConfigured() || !isLiveAdRoute(pathname)) return null;

  return (
    <Script
      async
      strategy="afterInteractive"
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient()}`}
    />
  );
}
