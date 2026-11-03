"use client";

import { MockAd } from "@/components/ads/MockAd";
import { getFormat, type PlacementId } from "@/lib/ad-sizes";

const ARTICLE = {
  title: "Winterizing a single-bay workshop",
  dek: "A Saturday sequence: drain the compressor, oil the vice, and keep the floor from sweating.",
  imageLabel: "FIG. 04 — HOIST RAIL",
  paragraphs: [
    "Start with the air line. If water sits in the tank over a freeze, you are buying a new compressor in March. Open the drain, leave it open while you work the rest of the list, and only close it when the hiss is dry.",
    "The vice gets a wipe of oil, not a bath. Excess drips onto the bench, collects grit, and becomes a paste you will sand off in spring. A thin film on the screw and the jaws is the whole job.",
    "Concrete sweats when the bay is warmer than the slab. A cheap hygrometer on the wall tells you more than a guess. If the reading climbs after you shut the door, run the dehumidifier before you cover the tools.",
    "Extension cords belong off the floor. A frozen puddle under a 12-gauge cable is how a winter shop earns a trip to the breaker panel. Hang them on the same hooks you use in July.",
    "Last: write the date on a tag and hang it on the compressor. Next November you will not remember whether you did this. The tag will.",
  ],
};

type ShowroomCanvasProps = {
  formatId: string;
  placement: PlacementId;
  density: number;
};

export function ShowroomCanvas({ formatId, placement, density }: ShowroomCanvasProps) {
  const format = getFormat(formatId);
  const ads = Array.from({ length: density }, (_, index) => (
    <MockAd key={`${formatId}-${index}`} format={format} index={index} />
  ));

  const headerAd = placement === "header" ? ads[0] : null;
  const footerAd = placement === "sticky-footer" ? ads[0] : null;
  const bodyAds =
    placement === "header" || placement === "sticky-footer" ? ads.slice(1) : ads;

  return (
    <article className="relative bg-[#23262C] text-chalk">
      {headerAd ? (
        <div className="border-b border-white/10 bg-bay-floor px-4 py-3">{headerAd}</div>
      ) : null}

      <div
        className={
          placement === "sidebar"
            ? "grid gap-4 p-4 md:grid-cols-[1fr_minmax(160px,300px)]"
            : "p-4"
        }
      >
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.04em] text-hazard">
            Dummy article · showroom only
          </p>
          <h3 className="mt-2 font-display text-3xl leading-none tracking-[0.04em]">
            {ARTICLE.title}
          </h3>
          <p className="mt-3 font-body text-sm leading-6 text-chalk/75">{ARTICLE.dek}</p>
          <div className="mt-4 flex h-36 items-end border border-white/10 bg-bay-floor p-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.04em] text-chalk/40">
              {ARTICLE.imageLabel}
            </span>
          </div>
          {ARTICLE.paragraphs.map((paragraph, index) => (
            <div key={paragraph}>
              <p className="mt-4 font-body text-sm leading-6 text-chalk/80">{paragraph}</p>
              {placement !== "sidebar" && bodyAds[index] ? (
                <div className="my-4">{bodyAds[index]}</div>
              ) : null}
            </div>
          ))}
          {placement !== "sidebar"
            ? bodyAds.slice(ARTICLE.paragraphs.length).map((ad, index) => (
                <div key={`extra-${index}`} className="my-4">
                  {ad}
                </div>
              ))
            : null}
        </div>
        {placement === "sidebar" ? (
          <aside className="flex flex-col gap-4" aria-label="Sidebar demo slots">
            {bodyAds}
          </aside>
        ) : null}
      </div>

      {footerAd ? (
        <div className="sticky bottom-0 border-t border-hazard/40 bg-bay-floor/95 px-4 py-2">
          {footerAd}
        </div>
      ) : null}
    </article>
  );
}
