"use client";

import { useId, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { dimensionString, type AdFormat } from "@/lib/ad-sizes";
import { gsap, useGSAP } from "@/lib/gsap-client";

const CREATIVES = [
  { brand: "NORTHWIND TOOLS", cta: "Open a ticket", from: "#3A4A3C", to: "#1E2620" },
  { brand: "AMBERLINE TIRES", cta: "Get a quote", from: "#4A3C18", to: "#2A2416" },
  { brand: "BAY 12 COFFEE", cta: "Order a bag", from: "#3A332C", to: "#1C1A18" },
  { brand: "HOIST & CO.", cta: "See the spec", from: "#2C3A48", to: "#161C22" },
  { brand: "CHALKLINE PAINT", cta: "Find a stockist", from: "#3A3A32", to: "#1A1A16" },
] as const;

type MockAdProps = {
  format: AdFormat;
  index?: number;
};

export function MockAd({ format, index = 0 }: MockAdProps) {
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const creative = CREATIVES[index % CREATIVES.length];
  const labelId = useId();
  const dim = dimensionString(format);

  useGSAP(
    () => {
      if (!rootRef.current) return;
      if (reduce) {
        gsap.set(rootRef.current, { autoAlpha: 1, y: 0, rotateY: 0 });
        return;
      }
      gsap.fromTo(
        rootRef.current,
        { autoAlpha: 0, y: 12, rotateY: -75 },
        {
          autoAlpha: 1,
          y: 0,
          rotateY: 0,
          duration: 0.45,
          ease: "power2.out",
        },
      );
    },
    { dependencies: [format.id, reduce], scope: rootRef, revertOnUpdate: true },
  );

  const onEnter = () => {
    if (reduce || !rootRef.current) return;
    gsap.to(rootRef.current, { y: -6, duration: 0.25, ease: "power2.out" });
  };

  const onLeave = () => {
    if (reduce || !rootRef.current) return;
    gsap.to(rootRef.current, { y: 0, duration: 0.25, ease: "power2.out" });
  };

  return (
    <div
      ref={rootRef}
      role="img"
      aria-labelledby={labelId}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className="relative mx-auto overflow-hidden border border-dashed border-hazard bg-[#16181C]"
      style={{
        width: format.width,
        height: format.height,
        maxWidth: "100%",
        perspective: 800,
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(145deg, ${creative.from}, ${creative.to})`,
        }}
      />
      <div className="absolute inset-0 opacity-30 [background-image:repeating-linear-gradient(90deg,transparent,transparent_11px,rgba(242,183,5,0.12)_11px,rgba(242,183,5,0.12)_12px)]" />
      <div className="relative flex h-full flex-col justify-between p-3">
        <div className="flex items-start justify-between gap-2">
          <span
            id={labelId}
            className="font-mono text-[10px] uppercase tracking-[0.04em] text-hazard"
          >
            {dim}
          </span>
          <span className="border border-hazard/80 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.04em] text-hazard">
            Demo — not a live ad
          </span>
        </div>
        <div>
          <p className="font-display text-lg leading-none tracking-[0.04em] text-chalk sm:text-xl">
            {creative.brand}
          </p>
          <p className="mt-2 inline-block border border-chalk/40 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.04em] text-chalk">
            {creative.cta}
          </p>
        </div>
      </div>
    </div>
  );
}
