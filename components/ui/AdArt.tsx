import type { CSSProperties } from "react";
import { metricsFor } from "@/lib/ads/ad-document";
import { motifSvg } from "@/lib/ads/motifs";
import type { Ad } from "@/lib/domain/types";

/**
 * Lightweight static rendering of an ad, for cards, the home page and lessons.
 * It is drawn at the ad's native size and scaled down with a transform, so it matches the
 * sandboxed documents. It is artwork only: interactive behaviour lives in those documents.
 */
export function AdArt({
  ad,
  maxWidth = 320,
  maxHeight = 190,
  className = "",
}: {
  ad: Ad;
  maxWidth?: number;
  maxHeight?: number;
  className?: string;
}) {
  const { width: w, height: h } = ad.size;
  const p = ad.palette;
  const m = metricsFor(ad);
  const svg = motifSvg(ad.motif, p.accent, p.ink);
  const scale = Math.min(maxWidth / w, maxHeight / h, 1.25);

  const native: CSSProperties = {
    position: "relative",
    width: w,
    height: h,
    overflow: "hidden",
    transform: `scale(${scale})`,
    transformOrigin: "0 0",
  };
  const grad: CSSProperties = { background: `linear-gradient(145deg, ${p.from}, ${p.to})`, color: p.ink };

  let inner: React.ReactNode;

  if (ad.format === "native") {
    const row = w / h > 2;
    inner = (
      <div
        className="flex overflow-hidden border border-black/10 bg-[#FFFDF8] text-[#1C1E22]"
        style={{ ...native, alignItems: row ? "center" : undefined, flexDirection: row ? "row" : "column", gap: 14, padding: 14 }}
      >
        <div
          className="grid shrink-0 place-items-center"
          style={{ width: row ? 96 : "100%", height: row ? 96 : "42%", background: `linear-gradient(145deg, ${p.from}, ${p.to})` }}
        >
          <div style={{ width: 64, height: 64 }} dangerouslySetInnerHTML={{ __html: svg }} />
        </div>
        <div className="min-w-0">
          <p className="font-mono uppercase tracking-[0.04em] text-[#6B6A63]" style={{ fontSize: 10 }}>
            Sponsored · {ad.advertiser}
          </p>
          <p className="font-serif font-bold leading-tight" style={{ fontSize: row ? 17 : 21, marginTop: 4 }}>
            {ad.headline}
          </p>
          <p className="font-bold underline underline-offset-2" style={{ fontSize: 13, marginTop: 8 }}>
            {ad.cta} →
          </p>
        </div>
      </div>
    );
  } else if (ad.format === "video") {
    inner = (
      <div style={{ ...native, ...grad }}>
        <div className="absolute inset-0 grid place-items-center" style={{ paddingBottom: 40 }}>
          <div style={{ width: 150, height: 150 }} dangerouslySetInnerHTML={{ __html: svg }} />
        </div>
        <p className="absolute font-extrabold leading-tight" style={{ left: 18, right: 18, bottom: 54, fontSize: 22 }}>
          {ad.headline}
        </p>
        <span
          className="absolute grid place-items-center rounded-full"
          style={{ width: 56, height: 56, left: "50%", top: "42%", marginLeft: -28, marginTop: -28, background: p.accent, color: p.from }}
        >
          <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true">
            <path d="M8 5l11 7-11 7z" />
          </svg>
        </span>
        <div className="absolute inset-x-0 bottom-0 flex items-center bg-black/60" style={{ height: 40, padding: "0 12px", gap: 10 }}>
          <i className="block flex-1 rounded-full bg-white/25" style={{ height: 6 }}>
            <i className="block h-full w-1/3 rounded-full" style={{ background: p.accent }} />
          </i>
          <span className="font-mono font-semibold" style={{ fontSize: 11 }}>
            0:{String(ad.engagement?.videoSec ?? 15).padStart(2, "0")}
          </span>
        </div>
      </div>
    );
  } else if (ad.format === "gamified") {
    inner = (
      <div className="flex flex-col items-center text-center" style={{ ...native, ...grad, padding: "26px 18px 18px" }}>
        <p className="font-extrabold leading-tight" style={{ fontSize: 24 }}>
          {ad.headline}
        </p>
        <div className="flex" style={{ gap: 6, margin: "12px 0" }}>
          {(ad.game ?? []).map((_, i) => (
            <i key={i} className="block rounded-full" style={{ width: 22, height: 5, background: i === 0 ? p.accent : "#ffffff33" }} />
          ))}
        </div>
        <div className="grid flex-1 place-items-center">
          <div style={{ width: 130, height: 130 }} dangerouslySetInnerHTML={{ __html: svg }} />
        </div>
        <span className="font-extrabold" style={{ background: p.accent, color: p.from, padding: "10px 22px", fontSize: 15, borderRadius: 4 }}>
          Play
        </span>
      </div>
    );
  } else {
    // image + clickable share the card layout
    const copy = (
      <div className="relative z-[1]" style={m.layout === "std" ? { maxWidth: "62%" } : undefined}>
        <p className="font-extrabold leading-[1.05]" style={{ fontSize: m.hs }}>
          {ad.headline}
        </p>
        <p className="opacity-85" style={{ fontSize: m.hs * 0.55, marginTop: m.hs * 0.4 }}>
          {ad.body}
        </p>
      </div>
    );
    const cta = (
      <span
        className="relative z-[1] inline-block self-start whitespace-nowrap font-extrabold"
        style={{ background: p.accent, color: p.from, fontSize: m.hs * 0.55, padding: `${m.hs * 0.4}px ${m.hs * 0.8}px`, borderRadius: 3 }}
      >
        {ad.cta}
      </span>
    );
    const artBox: CSSProperties =
      m.layout === "wide"
        ? { right: m.pad, top: "50%", width: m.art, height: m.art, marginTop: -m.art / 2 }
        : { right: m.pad, top: m.pad, width: m.art, height: m.art };

    inner =
      m.layout === "tall" ? (
        <div className="flex flex-col items-center justify-between text-center" style={{ ...native, ...grad, padding: m.pad }}>
          <div style={{ width: m.art, height: m.art }} dangerouslySetInnerHTML={{ __html: svg }} />
          {copy}
          {cta}
        </div>
      ) : (
        <div
          className={`flex ${m.layout === "wide" ? "items-center" : "flex-col justify-between"}`}
          style={{
            ...native,
            ...grad,
            padding: m.pad,
            gap: m.pad,
            paddingRight: m.layout === "wide" ? m.art + m.pad * 2 : undefined,
          }}
        >
          <div className="absolute" style={artBox} dangerouslySetInnerHTML={{ __html: svg }} />
          {m.layout === "wide" ? (
            <>
              <div className="flex-1">{copy}</div>
              {cta}
            </>
          ) : (
            <>
              {copy}
              {cta}
            </>
          )}
        </div>
      );
  }

  return (
    <div
      role="img"
      aria-label={`${ad.title}, ${ad.format} ad preview`}
      className={`relative shrink-0 overflow-hidden ${className}`}
      style={{ width: Math.round(w * scale), height: Math.round(h * scale) }}
    >
      {inner}
    </div>
  );
}
