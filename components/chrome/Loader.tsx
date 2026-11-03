"use client";

import { useEffect, useRef } from "react";

const FLAG = "ag-loaded";
const MIN_MS = 1100;

/**
 * A once-per-session loading screen: two labels and a thin progress bar along the bottom edge.
 * It is real in the sense that it waits for the page to finish loading and for fonts to be
 * ready, but it never waits longer than a few seconds, and it is skipped entirely for
 * reduced-motion users. The server renders it hidden; a script in <head> turns it on.
 */
export function Loader() {
  const root = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const html = document.documentElement;
    const el = root.current;
    const progress = bar.current;
    if (html.dataset.loader !== "on" || !el || !progress) return;

    const finish = () => {
      try {
        sessionStorage.setItem(FLAG, "1");
      } catch {
        // Private mode: the loader will simply show again next time.
      }
      el.style.transition = "opacity 500ms ease, transform 700ms cubic-bezier(.7,0,.2,1)";
      el.style.opacity = "0";
      el.style.transform = "translateY(-4%)";
      window.setTimeout(() => {
        html.dataset.loader = "off";
        el.removeAttribute("style");
      }, 720);
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      html.dataset.loader = "off";
      return;
    }

    const start = performance.now();
    let ready = document.readyState === "complete";
    let fontsReady = false;
    const onLoad = () => {
      ready = true;
    };
    window.addEventListener("load", onLoad);
    document.fonts?.ready.then(() => {
      fontsReady = true;
    });
    if (!document.fonts) fontsReady = true;

    let frame = 0;
    let done = false;
    const tick = (now: number) => {
      const elapsed = now - start;
      // Ease toward 85% on time alone; the last stretch needs the page to actually be ready.
      const timed = Math.min(1, elapsed / MIN_MS);
      const target = ready && fontsReady ? 1 : Math.min(0.85, timed * 0.85);
      const current = Number(progress.dataset.p ?? 0);
      const next = current + (target - current) * 0.12;
      progress.dataset.p = String(next);
      progress.style.transform = `scaleX(${next})`;
      // Never wait longer than 4 seconds, whatever the network is doing.
      if ((next > 0.995 && elapsed > MIN_MS) || elapsed > 4000) {
        if (!done) {
          done = true;
          progress.style.transform = "scaleX(1)";
          finish();
        }
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("load", onLoad);
    };
  }, []);

  return (
    <div
      ref={root}
      aria-hidden="true"
      className="ag-loader fixed inset-0 z-[100] grid-cols-2 place-items-center bg-black"
    >
      <p className="font-display text-xl uppercase text-chalk sm:text-3xl">Ads Garage®</p>
      <p className="font-display text-xl uppercase text-chalk sm:text-3xl">Ad playground</p>
      <div
        ref={bar}
        data-p="0"
        className="absolute inset-x-0 bottom-0 h-[3px] origin-left bg-hazard"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}
