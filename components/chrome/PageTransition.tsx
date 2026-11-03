"use client";

import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { drawField, makeField, resolvePalette, type Field, type Mode, type Palette } from "@/components/chrome/transition/pixel-field";

const COVER_MS = 650;
const REVEAL_MS = 1000;
/** If the next page has not appeared by then, reveal anyway rather than leave the screen covered. */
const MAX_WAIT_MS = 4500;

interface TransitionRouter {
  /** Like router.push, but covered by the pixel transition. */
  push: (href: string) => void;
}

const Context = createContext<TransitionRouter | null>(null);

export function useTransitionRouter(): TransitionRouter {
  const value = useContext(Context);
  if (!value) throw new Error("useTransitionRouter must be used inside <PageTransitionProvider>.");
  return value;
}

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const frames = (count: number) =>
  new Promise<void>((resolve) => {
    let left = count;
    const step = () => (left-- <= 0 ? resolve() : requestAnimationFrame(step));
    step();
  });
const here = () => window.location.pathname + window.location.search;
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * The page transition. Going to another page: pixel blocks fill the screen, the page changes
 * underneath, then the blocks dissolve to reveal it. Going back or forward with the browser's
 * buttons: the browser changes the page at once and cannot be delayed, so the blocks snap on and
 * dissolve away, which looks the same minus the fill-in.
 *
 * It listens for clicks on ordinary links, so no link needs changing. Code that navigates by
 * itself should use `useTransitionRouter().push` instead of `router.push`. Same-page links,
 * new-tab clicks, modified clicks, downloads, external links and `data-no-transition` links are
 * left alone, and reduced-motion visitors get no transition at all.
 */
export function PageTransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const canvas = useRef<HTMLCanvasElement>(null);
  const api = useRef<{ go: (href: string) => void } | null>(null);
  /** The path the router has actually rendered. Updated after each commit. */
  const rendered = useRef(pathname);
  useEffect(() => {
    rendered.current = pathname;
  }, [pathname]);

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;

    let field: Field | null = null;
    let palette: Palette | null = null;
    let width = 0;
    let height = 0;
    let busy = false;
    let lastUrl = here();

    const show = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      el.width = Math.round(width * dpr);
      el.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      field = makeField(width, height);
      palette = resolvePalette(getComputedStyle(document.documentElement));
      el.style.display = "block";
      el.style.pointerEvents = "auto"; // clicks must not reach the page mid-transition
    };
    const hide = () => {
      el.style.display = "none";
      el.style.pointerEvents = "none";
      el.dataset.phase = "idle";
    };

    const animate = (mode: Mode, ms: number) =>
      new Promise<void>((resolve) => {
        el.dataset.phase = mode;
        const start = performance.now();
        const step = (now: number) => {
          const t = ms <= 0 ? 1 : Math.min(1, (now - start) / ms);
          drawField(ctx, field!, palette!, width, height, ease(t), mode);
          if (t < 1) requestAnimationFrame(step);
          else resolve();
        };
        if (ms <= 0) step(start);
        else requestAnimationFrame(step);
      });

    /** Keeps the covered screen alive (a few cells flicker) while the next page loads. */
    const startHold = () => {
      el.dataset.phase = "hold";
      let id = 0;
      let last = 0;
      const tick = (now: number) => {
        if (now - last > 110) {
          drawField(ctx, field!, palette!, width, height, 1, "hold");
          last = now;
        }
        id = requestAnimationFrame(tick);
      };
      id = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(id);
    };

    /** Resolves once the router has committed the page we asked for (or the wait runs out). */
    const committed = async (expected: string | null) => {
      const deadline = performance.now() + MAX_WAIT_MS;
      while (performance.now() < deadline) {
        const urlMatches = expected === null || here() === expected;
        if (urlMatches && rendered.current === window.location.pathname) return;
        await wait(40);
      }
    };

    const run = async (opts: { instant: boolean; expected: string | null; navigate?: () => void }) => {
      busy = true;
      try {
        show();
        await animate("cover", opts.instant ? 0 : COVER_MS);
        const stopHold = startHold();
        opts.navigate?.();
        await committed(opts.expected);
        stopHold();
        await frames(2); // let the new page paint underneath before the blocks start to lift
        await animate("reveal", REVEAL_MS);
      } finally {
        hide();
        lastUrl = here();
        busy = false;
      }
    };

    const go = (href: string) => {
      const url = new URL(href, window.location.href);
      const target = url.pathname + url.search;
      if (reducedMotion() || target === here()) {
        router.push(href);
        return;
      }
      if (busy) return;
      void run({ instant: false, expected: target, navigate: () => router.push(href) });
    };
    api.current = { go };

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link || (link.target && link.target !== "_self") || link.hasAttribute("download") || link.hasAttribute("data-no-transition")) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return; // hash jumps and no-ops
      if (reducedMotion()) return;
      // Stop the router's own click handler (it runs later, on the React root) and navigate ourselves.
      event.preventDefault();
      event.stopPropagation();
      go(url.pathname + url.search + url.hash);
    };

    const onPopState = () => {
      const now = here();
      const before = lastUrl;
      lastUrl = now;
      if (reducedMotion() || busy || now === before) return;
      void run({ instant: true, expected: now });
    };

    // Keep `lastUrl` right when anything pushes or replaces history (the router does on every
    // navigation, and the studio does when it saves), so popstate can tell what actually changed.
    const { pushState, replaceState } = window.history;
    const track =
      <A extends unknown[]>(original: (...args: A) => void) =>
      function (this: History, ...args: A) {
        original.apply(this, args);
        lastUrl = here();
      };
    const pushPatched = track(pushState.bind(window.history));
    const replacePatched = track(replaceState.bind(window.history));
    window.history.pushState = pushPatched;
    window.history.replaceState = replacePatched;

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
      if (window.history.pushState === pushPatched) window.history.pushState = pushState;
      if (window.history.replaceState === replacePatched) window.history.replaceState = replaceState;
      api.current = null;
    };
  }, [router]);

  const value = useMemo<TransitionRouter>(() => ({ push: (href) => (api.current ? api.current.go(href) : router.push(href)) }), [router]);

  return (
    <Context.Provider value={value}>
      {children}
      <canvas
        ref={canvas}
        aria-hidden="true"
        data-phase="idle"
        style={{ display: "none", pointerEvents: "none" }}
        className="fixed inset-0 z-[200] h-full w-full"
      />
    </Context.Provider>
  );
}
