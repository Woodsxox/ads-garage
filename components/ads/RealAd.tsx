"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { adsenseClient, adsenseConfigured, isLiveAdRoute } from "@/lib/ads/policy";

type RealAdFormat = "auto" | "rectangle" | "horizontal" | "vertical" | "fluid";

type RealAdProps = {
  slot: string;
  format?: RealAdFormat;
  responsive?: boolean;
  layout?: "in-article";
  className?: string;
  minHeight?: number;
};

/**
 * Live AdSense unit. Allowed routes are listed in `lib/ads/policy.ts`.
 * Do not pass an animate prop — it does not exist and must not exist.
 * Renders nothing until a real publisher ID is configured.
 */
export function RealAd({
  slot,
  format = "auto",
  responsive = true,
  layout,
  className,
  minHeight = 280,
}: RealAdProps) {
  const pathname = usePathname();
  const pushed = useRef(false);
  const allowed = isLiveAdRoute(pathname);
  const configured = adsenseConfigured();

  useEffect(() => {
    if (!allowed || !configured) return;
    if (pushed.current) return;
    pushed.current = true;
    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
    } catch {
      // A thrown adsbygoogle error must never break the page.
    }
  }, [allowed, configured]);

  if (!allowed) {
    if (process.env.NODE_ENV !== "production") {
      throw new Error(
        `RealAd mounted on ${pathname}. Live ads are only allowed on the routes in lib/ads/policy.ts. Use a demo ad here.`,
      );
    }
    return null;
  }

  if (!configured) return null;

  return (
    <div className={className} style={{ minHeight }}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={adsenseClient()}
        data-ad-slot={slot}
        data-ad-format={format}
        {...(layout ? { "data-ad-layout": layout } : {})}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  );
}
