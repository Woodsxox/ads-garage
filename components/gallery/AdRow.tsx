import Link from "next/link";
import { StatePill } from "@/components/gallery/StatePill";
import { AVAILABILITY_META, FORMAT_META, adHref } from "@/lib/domain/meta";
import type { Ad } from "@/lib/domain/types";

const STRETCH =
  "after:absolute after:inset-0 after:content-[''] focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-hazard";

/** One row of the gallery list: title and advertiser, a line about it with tags, and what opening it does. */
export function AdRow({ ad, onInactive }: { ad: Ad; onInactive?: (ad: Ad) => void }) {
  const href = adHref(ad);
  const inactive = ad.availability === "inactive";

  return (
    <li
      id={`ad-${ad.id}`}
      className={`group relative grid scroll-mt-24 gap-4 px-2 py-6 transition-colors hover:bg-white/[0.03] md:grid-cols-[1.2fr_2fr_1fr] md:gap-8 md:px-4 ${inactive ? "opacity-60" : ""}`}
    >
      <div>
        <h3 className="font-display text-2xl font-medium leading-tight transition-colors group-hover:text-hazard sm:text-3xl">
          {href ? (
            <Link href={href} className={STRETCH}>
              {ad.title}
            </Link>
          ) : (
            <button type="button" onClick={() => onInactive?.(ad)} className={`text-left ${STRETCH}`}>
              {ad.title}
            </button>
          )}
        </h3>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.04em] text-chalk/50">{ad.advertiser}</p>
      </div>

      <div>
        <p className="max-w-xl font-body text-sm leading-6 text-chalk/65">{ad.summary}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-white/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.04em] text-chalk/90">
            {FORMAT_META[ad.format].label}
          </span>
          <StatePill state={ad.availability} />
          {ad.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="rounded-full border border-white/15 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.04em] text-chalk/55">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-end justify-between gap-4 md:flex-col md:items-end md:justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.04em] text-chalk/55">
          {ad.size.width}×{ad.size.height}
        </span>
        <span className={`font-mono text-[11px] uppercase tracking-[0.04em] ${inactive ? "text-chalk/50" : "text-hazard"}`}>
          {AVAILABILITY_META[ad.availability].action} →
        </span>
      </div>
    </li>
  );
}
