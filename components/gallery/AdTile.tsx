import Link from "next/link";
import { StatePill } from "@/components/gallery/StatePill";
import { AdArt } from "@/components/ui/AdArt";
import { FORMAT_META, adHref } from "@/lib/domain/meta";
import type { Ad } from "@/lib/domain/types";

const STRETCH =
  "after:absolute after:inset-0 after:content-[''] focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-hazard";

/**
 * One tile of the gallery wall: advertiser top-left, title top-right, the ad in the middle, tags
 * and size at the bottom. The whole tile is one focus target (a stretched link), and what opening
 * it does depends on the ad's state.
 */
export function AdTile({ ad, onInactive, note }: { ad: Ad; onInactive?: (ad: Ad) => void; note?: string }) {
  const href = adHref(ad);
  const inactive = ad.availability === "inactive";

  return (
    <article
      id={`ad-${ad.id}`}
      className="group relative flex aspect-[4/5] min-h-[360px] w-full scroll-mt-24 flex-col bg-bay-floor p-4 transition-colors hover:bg-bay-wall"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="font-display text-[15px] font-semibold leading-tight text-chalk">{ad.advertiser}</p>
        <h3 className="max-w-[55%] text-right font-mono text-[10px] font-normal uppercase leading-[1.5] tracking-[0.04em] text-chalk/70">
          {href ? (
            <Link href={href} className={STRETCH}>
              {ad.title}
            </Link>
          ) : (
            <button type="button" onClick={() => onInactive?.(ad)} className={`text-right uppercase ${STRETCH}`}>
              {ad.title}
            </button>
          )}
        </h3>
      </div>

      <div className={`grid flex-1 place-items-center overflow-hidden py-4 transition-transform duration-500 group-hover:scale-[1.04] ${inactive ? "opacity-40 saturate-50" : ""}`}>
        <AdArt ad={ad} maxWidth={280} maxHeight={250} />
      </div>

      {note ? <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.04em] text-hazard">{note}</p> : null}
      <div className="flex items-end justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-white/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.04em] text-chalk/90">
            {FORMAT_META[ad.format].label}
          </span>
          <StatePill state={ad.availability} />
        </div>
        <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.04em] text-chalk/55">
          {ad.size.width}×{ad.size.height}
        </span>
      </div>
    </article>
  );
}
