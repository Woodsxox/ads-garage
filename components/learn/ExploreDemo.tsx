"use client";

import { useState } from "react";
import { motifSvg } from "@/lib/ads/motifs";
import type { ExploreControl } from "@/lib/domain/types";
import { contrastRatio, normalizeHex } from "@/lib/studio/color";

type Layout = "top" | "beside" | "overlay";

type MiniAdProps = {
  headline: string;
  cta: string;
  bg: string;
  fg: string;
  ctaBg: string;
  ctaFg: string;
  layout: Layout;
};

function MiniAd({ headline, cta, bg, fg, ctaBg, ctaFg, layout }: MiniAdProps) {
  const art = motifSvg("wrench", "#8FD1A9", "#F3F1EA");
  const button = (
    <span
      className="inline-block self-start px-3 py-1.5 text-[12px] font-extrabold"
      style={{ background: ctaBg, color: ctaFg, borderRadius: 3 }}
    >
      {cta || "Button"}
    </span>
  );
  const text = (
    <p className="text-[19px] font-extrabold leading-[1.1]" style={{ color: fg }}>
      {headline || "Your headline"}
    </p>
  );
  return (
    <div
      className="relative flex h-[250px] w-[300px] max-w-full flex-col overflow-hidden p-4"
      style={{ background: bg }}
      role="img"
      aria-label="Ad preview"
    >
      {layout === "top" ? (
        <>
          <div className="mx-auto h-[84px] w-[84px]" dangerouslySetInnerHTML={{ __html: art }} />
          <div className="mt-2 flex flex-1 flex-col justify-between gap-2">
            {text}
            {button}
          </div>
        </>
      ) : null}
      {layout === "beside" ? (
        <div className="flex flex-1 gap-3">
          <div className="flex flex-1 flex-col justify-between gap-2">
            {text}
            {button}
          </div>
          <div className="mt-1 h-[96px] w-[96px] shrink-0" dangerouslySetInnerHTML={{ __html: art }} />
        </div>
      ) : null}
      {layout === "overlay" ? (
        <>
          <div className="absolute inset-0 opacity-25" dangerouslySetInnerHTML={{ __html: art }} />
          <div className="relative flex flex-1 flex-col justify-between gap-2">
            {text}
            {button}
          </div>
        </>
      ) : null}
    </div>
  );
}

function Verdict({ ok, warn, children }: { ok: boolean; warn?: boolean; children: React.ReactNode }) {
  const tone = ok ? "border-torque text-torque" : warn ? "border-hazard text-hazard" : "border-flag text-flag";
  return (
    <p className={`mt-3 border-l-2 pl-3 font-body text-sm leading-6 ${tone}`} role="status" aria-live="polite">
      {children}
    </p>
  );
}

const chipClass = (selected: boolean) =>
  `border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.04em] ${
    selected ? "border-hazard bg-hazard text-bay-floor" : "border-white/20 text-chalk/80 hover:border-chalk/50"
  }`;

export function ExploreDemo({ control }: { control: ExploreControl }) {
  const [headline, setHeadline] = useState("Spring tune-up sale: twenty percent off every hand tool in the shop");
  const [textColor, setTextColor] = useState("#7A7A72");
  const [ctaLabel, setCtaLabel] = useState("Click here");
  const [ctaBg, setCtaBg] = useState("#8FD1A9");
  const [layout, setLayout] = useState<Layout>("top");

  const base = { headline: "Spring tune-up sale", cta: "Shop the sale", bg: "#2F4A3A", fg: "#F3F1EA", ctaBg: "#8FD1A9", ctaFg: "#16241B", layout: "beside" as Layout };

  if (control === "headline") {
    const words = headline.trim() === "" ? 0 : headline.trim().split(/\s+/).length;
    return (
      <div className="grid gap-5 md:grid-cols-[1fr_auto]">
        <div>
          <label htmlFor="ex-headline" className="font-mono text-[11px] uppercase tracking-[0.04em] text-chalk/60">
            Headline
          </label>
          <textarea
            id="ex-headline"
            rows={3}
            value={headline}
            onChange={(event) => setHeadline(event.target.value)}
            className="mt-1.5 w-full border border-white/15 bg-bay-floor p-3 font-body text-sm text-chalk"
          />
          <p className="mt-1 font-mono text-[11px] text-chalk/60">
            {words} word{words === 1 ? "" : "s"} · {headline.length} characters
          </p>
          {words <= 6 ? (
            <Verdict ok>Short enough to read at a glance. This is the target.</Verdict>
          ) : words <= 10 ? (
            <Verdict ok={false} warn>Getting long. Try cutting the qualifiers.</Verdict>
          ) : (
            <Verdict ok={false}>Too long: viewers will skip it. Keep the offer, drop the rest.</Verdict>
          )}
        </div>
        <MiniAd {...base} headline={headline} />
      </div>
    );
  }

  if (control === "contrast") {
    const hex = normalizeHex(textColor) ?? "#000000";
    const ratio = contrastRatio(hex, "#2F4A3A");
    return (
      <div className="grid gap-5 md:grid-cols-[1fr_auto]">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.04em] text-chalk/60">Text color</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <input
              type="color"
              aria-label="Text color"
              value={hex.toLowerCase()}
              onChange={(event) => setTextColor(event.target.value)}
              className="h-9 w-12 border border-white/15 bg-bay-floor"
            />
            {[
              ["Chalk", "#F3F1EA"],
              ["Hazard", "#F2B705"],
              ["Mid grey", "#7A7A72"],
            ].map(([label, value]) => (
              <button key={label} type="button" onClick={() => setTextColor(value)} className={chipClass(hex === value.toUpperCase())}>
                {label}
              </button>
            ))}
          </div>
          <p className="mt-3 font-mono text-2xl text-hazard">{ratio.toFixed(1)}:1</p>
          {ratio >= 4.5 ? (
            <Verdict ok>Passes the 4.5:1 guideline for body-size text.</Verdict>
          ) : ratio >= 3 ? (
            <Verdict ok={false} warn>Only enough for very large text. Brighten the color or darken the background.</Verdict>
          ) : (
            <Verdict ok={false}>Too low. On a bright phone screen this will disappear.</Verdict>
          )}
        </div>
        <MiniAd {...base} fg={hex} />
      </div>
    );
  }

  if (control === "cta") {
    const ratio = contrastRatio("#16241B", ctaBg);
    return (
      <div className="grid gap-5 md:grid-cols-[1fr_auto]">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.04em] text-chalk/60">Button label</p>
          <div className="mt-1.5 flex flex-wrap gap-2" role="group" aria-label="Button label">
            {["Click here", "Shop the sale", "Get 20% off"].map((label) => (
              <button key={label} type="button" aria-pressed={ctaLabel === label} onClick={() => setCtaLabel(label)} className={chipClass(ctaLabel === label)}>
                {label}
              </button>
            ))}
          </div>
          <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.04em] text-chalk/60">Button color</p>
          <div className="mt-1.5 flex flex-wrap gap-2" role="group" aria-label="Button color">
            {[
              ["Mint", "#8FD1A9"],
              ["Hazard", "#F2B705"],
              ["Slate", "#4A5560"],
            ].map(([label, value]) => (
              <button key={label} type="button" aria-pressed={ctaBg === value} onClick={() => setCtaBg(value)} className={chipClass(ctaBg === value)}>
                {label}
              </button>
            ))}
          </div>
          {ctaLabel === "Click here" ? (
            <Verdict ok={false} warn>“Click here” says nothing about what happens next. Name the action.</Verdict>
          ) : (
            <Verdict ok>A verb plus the offer: viewers know what they get.</Verdict>
          )}
          <p className={`mt-2 font-mono text-[11px] ${ratio >= 4.5 ? "text-torque" : "text-flag"}`}>
            Label contrast {ratio.toFixed(1)}:1 {ratio >= 4.5 ? "· readable" : "· too low, pick a lighter button"}
          </p>
        </div>
        <MiniAd {...base} cta={ctaLabel} ctaBg={ctaBg} />
      </div>
    );
  }

  const advice: Record<Layout, string> = {
    top: "Visual first, text below. Reads top to bottom, works in tall and square units.",
    beside: "Text left, visual right. The eye lands on the headline first. Best in wide and medium units.",
    overlay: "Text over the visual. Striking, but keep the visual faint or the headline becomes hard to read.",
  };
  return (
    <div className="grid gap-5 md:grid-cols-[1fr_auto]">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.04em] text-chalk/60">Layout</p>
        <div className="mt-1.5 flex flex-wrap gap-2" role="group" aria-label="Layout">
          {(
            [
              ["top", "Visual on top"],
              ["beside", "Visual beside"],
              ["overlay", "Text over visual"],
            ] as const
          ).map(([value, label]) => (
            <button key={value} type="button" aria-pressed={layout === value} onClick={() => setLayout(value)} className={chipClass(layout === value)}>
              {label}
            </button>
          ))}
        </div>
        <Verdict ok>{advice[layout]}</Verdict>
      </div>
      <MiniAd {...base} layout={layout} />
    </div>
  );
}
