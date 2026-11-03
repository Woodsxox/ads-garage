"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { gsap, ScrollTrigger } from "@/lib/gsap-client";

/**
 * Slow, inertial scrolling for every page, wired into GSAP's ScrollTrigger. `wheelMultiplier`
 * shortens each wheel notch and the low `lerp` stretches the glide. Nested scrollable elements
 * (code panels, the studio canvas) keep native scrolling via `allowNestedScroll`; anything that
 * handles the wheel itself (the gallery wall, modals, the menu) is marked `data-lenis-prevent`.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({ lerp: 0.05, wheelMultiplier: 0.5, smoothWheel: true, allowNestedScroll: true });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  return null;
}
