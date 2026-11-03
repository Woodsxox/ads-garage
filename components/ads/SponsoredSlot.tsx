"use client";

import { RealAd } from "@/components/ads/RealAd";
import { adsenseConfigured } from "@/lib/ads/policy";

const DISPLAY_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_DISPLAY ?? "0000000000";
const SIDE_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDE ?? "0000000002";

/**
 * A labelled placement for real, monetised inventory. It sits outside every card, frame and demo
 * so it can never be mistaken for one, and it never moves: a moving ad invites accidental clicks.
 *
 * - `banner`: a wide unit on its own row (home page, gallery).
 * - `column`: a tall unit that fills the width of a side column (home hero).
 *
 * With no publisher ID it renders nothing, in development as well as production.
 */
export function SponsoredSlot({ variant = "banner", className = "" }: { variant?: "banner" | "column"; className?: string }) {
  const configured = adsenseConfigured();
  const column = variant === "column";

  if (!configured) return null;

  if (column) {
    return (
      <aside aria-label="Sponsored placement" className={`shrink-0 ${className}`}>
        <p className="font-mono text-[10px] uppercase tracking-[0.04em] text-chalk/45">Advertisement</p>
        <div className="mt-1.5 overflow-hidden rounded-sm border border-white/10 bg-bay-wall/50">
          <RealAd slot={SIDE_SLOT} format="vertical" responsive={false} minHeight={250} />
        </div>
      </aside>
    );
  }

  return (
    <aside aria-label="Sponsored placement" className={`mx-auto max-w-[1800px] px-4 sm:px-6 ${className}`}>
      <p className="font-mono text-[10px] uppercase tracking-[0.04em] text-chalk/45">Advertisement</p>
      <div className="mt-2 border border-white/10 bg-bay-wall/50 p-2">
        <RealAd slot={DISPLAY_SLOT} format="horizontal" responsive minHeight={90} />
      </div>
      <p className="mt-2 font-body text-[11px] leading-4 text-chalk/40">
        Sponsored placements are real ads from our ad provider and help keep Ads Garage free. The demo ads in the
        playground are never paid.
      </p>
    </aside>
  );
}
