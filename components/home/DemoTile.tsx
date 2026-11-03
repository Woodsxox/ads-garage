import Link from "next/link";
import { FitAd } from "@/components/home/FitAd";
import { AdArt } from "@/components/ui/AdArt";
import { FORMAT_META, adHref } from "@/lib/domain/meta";
import type { Ad } from "@/lib/domain/types";

const ROUND = "rounded-[16px]";

/**
 * A demo ad shown on its own: just the artwork with rounded corners, no card or caption. These are
 * fictional advertisers, never paid, and the only kind of ad that ever moves. Opening one goes
 * where the gallery would.
 *
 * - `fit` stretches the ad to the width of its container (a column), up to `height`.
 * - otherwise the ad is scaled to fit within `width` x `height` (a row), keeping its own proportions.
 */
export function DemoTile({
  ad,
  width = 320,
  height,
  fit = false,
  className = "",
}: {
  ad: Ad;
  width?: number;
  height: number;
  fit?: boolean;
  className?: string;
}) {
  const href = adHref(ad);
  const art = fit ? <FitAd ad={ad} maxHeight={height} className={ROUND} /> : <AdArt ad={ad} maxWidth={width} maxHeight={height} className={ROUND} />;
  const base = `block shrink-0 self-center ${className}`;
  return href ? (
    <Link
      href={href}
      aria-label={`${ad.title}, demo ${FORMAT_META[ad.format].label.toLowerCase()} ad`}
      className={`${base} transition-transform duration-300 hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hazard ${ROUND}`}
    >
      {art}
    </Link>
  ) : (
    <div className={base}>{art}</div>
  );
}
