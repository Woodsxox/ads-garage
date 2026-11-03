"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useTransitionRouter } from "@/components/chrome/PageTransition";
import { useReducedMotion } from "framer-motion";
import { AdRow } from "@/components/gallery/AdRow";
import { AdTile } from "@/components/gallery/AdTile";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { StateBadge } from "@/components/ui/StateBadge";
import { ADS } from "@/lib/demo/ads";
import { AVAILABILITY_META, AVAILABILITY_ORDER, FORMAT_META, FORMAT_ORDER, adHref } from "@/lib/domain/meta";
import type { Ad, AdAvailability, AdFormat } from "@/lib/domain/types";
import { useHydrated } from "@/lib/services/hooks";
import { STORAGE_KEYS } from "@/lib/storage";
import { useStored } from "@/lib/use-stored";

export type GalleryFilters = { q: string; format: AdFormat | "all"; state: AdAvailability | "all" };
export const DEFAULT_FILTERS: GalleryFilters = { q: "", format: "all", state: "all" };

type View = "wall" | "grid" | "list";

/** Three.js is only fetched when the wall is shown, so the other pages never pay for it. */
const GalleryWall = dynamic(() => import("@/components/gallery/GalleryWall").then((m) => m.GalleryWall), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 grid place-items-center font-mono text-[11px] uppercase tracking-[0.04em] text-chalk/50">Loading the wall…</div>
  ),
});

function matches(ad: Ad, f: GalleryFilters): boolean {
  if (f.format !== "all" && ad.format !== f.format) return false;
  if (f.state !== "all" && ad.availability !== f.state) return false;
  const q = f.q.trim().toLowerCase();
  if (!q) return true;
  return [ad.title, ad.advertiser, ad.summary, ...ad.tags].some((t) => t.toLowerCase().includes(q));
}

const chip = (selected: boolean) =>
  `rounded-full border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.04em] transition-colors ${
    selected ? "border-chalk bg-chalk text-bay-floor" : "border-white/20 text-chalk/80 hover:border-chalk/60"
  }`;

/** The view switch, as a pill with a white active segment. The wall is left out when it cannot run. */
function ViewToggle({ view, onChange, wall }: { view: View; onChange: (view: View) => void; wall: boolean }) {
  const option = (value: View, label: string, icon: "wall" | "grid" | "menu") => (
    <button
      type="button"
      aria-pressed={view === value}
      aria-label={label}
      title={label}
      onClick={() => onChange(value)}
      className={`grid h-10 w-10 place-items-center rounded-full transition-colors ${view === value ? "bg-chalk text-bay-floor" : "text-chalk/80 hover:text-hazard"}`}
    >
      <Icon name={icon} size={17} />
    </button>
  );
  return (
    <div role="group" aria-label="View" className="flex gap-0.5 rounded-full bg-white/10 p-1 backdrop-blur-xl">
      {wall ? option("wall", "Wall view", "wall") : null}
      {option("grid", "Grid view", "grid")}
      {option("list", "List view", "menu")}
    </div>
  );
}

function FilterButton({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup="dialog"
      className="inline-flex h-12 items-center gap-2 rounded-full bg-white/10 px-6 font-display text-[15px] font-medium text-chalk backdrop-blur-xl transition-colors hover:bg-white/20"
    >
      Filter
      {count > 0 ? (
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-hazard px-1 font-mono text-[10px] text-bay-floor">{count}</span>
      ) : null}
    </button>
  );
}

/** `slot` is a labelled sponsored placement supplied by the page; the gallery itself holds only demo ads. */
export function GalleryView({ initial, slot }: { initial: Partial<GalleryFilters> | null; slot?: ReactNode }) {
  const [stored, setStored] = useStored<GalleryFilters>(STORAGE_KEYS.galleryFilters, DEFAULT_FILTERS);
  const [view, setView] = useStored<View>(STORAGE_KEYS.galleryView, "wall");
  const router = useTransitionRouter();
  // `reduced` is null until the browser has answered, and the stored view is only known after
  // hydration. Until both are known the wall's slot renders as an empty dark screen, so the server
  // and the first client render agree and a reduced-motion visitor never sees the wall mount.
  const reduced = useReducedMotion();
  const hydrated = useHydrated();
  const [wallBroken, setWallBroken] = useState(false);
  const wallAvailable = reduced === false && !wallBroken;
  const pending = view === "wall" && (!hydrated || reduced === null);
  const shown: View = view === "wall" && !wallAvailable ? "grid" : view;
  const wallMode = shown === "wall";

  // The wall owns the whole screen, so the page behind it must not scroll.
  useEffect(() => {
    if (!wallMode) return;
    const html = document.documentElement;
    const before = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = before;
    };
  }, [wallMode]);
  // Filters arriving from a link (e.g. ?format=video) win until the visitor changes something.
  const [fromLink, setFromLink] = useState<GalleryFilters | null>(initial ? { ...DEFAULT_FILTERS, ...initial } : null);
  const filters = fromLink ?? stored;
  const [inactiveAd, setInactiveAd] = useState<Ad | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const update = (patch: Partial<GalleryFilters>) => {
    const next = { ...filters, ...patch };
    setFromLink(null);
    setStored(next);
  };

  const visible = useMemo(() => ADS.filter((ad) => matches(ad, filters)), [filters]);
  const groups = useMemo(
    () =>
      FORMAT_ORDER.map((format) => ({ format, ads: visible.filter((ad) => ad.format === format) })).filter((group) => group.ads.length > 0),
    [visible],
  );
  const activeFilters = (filters.q.trim() ? 1 : 0) + (filters.format !== "all" ? 1 : 0) + (filters.state !== "all" ? 1 : 0);
  const similar = inactiveAd
    ? ADS.filter((ad) => ad.format === inactiveAd.format && adHref(ad) && ad.id !== inactiveAd.id).slice(0, 3)
    : [];

  const open = (ad: Ad) => {
    const href = adHref(ad);
    if (href) router.push(href);
    else setInactiveAd(ad);
  };

  const filterSheet = (
    <Modal open={filterOpen} onClose={() => setFilterOpen(false)} title="Filter" size="md">
      <div className="flex flex-col gap-7">
        <label className="relative block">
          <span className="sr-only">Search ads</span>
          <Icon name="search" size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-chalk/50" />
          <input
            type="search"
            value={filters.q}
            onChange={(event) => update({ q: event.target.value })}
            placeholder="Search ads, brands, tags"
            className="w-full rounded-full border border-white/15 bg-bay-floor py-3 pl-11 pr-4 font-body text-sm text-chalk placeholder:text-chalk/40"
          />
        </label>

        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.04em] text-chalk/55">Format</p>
          <div role="group" aria-label="Filter by format" className="mt-3 flex flex-wrap gap-2">
            <button type="button" aria-pressed={filters.format === "all"} onClick={() => update({ format: "all" })} className={chip(filters.format === "all")}>
              All
            </button>
            {FORMAT_ORDER.map((format) => (
              <button
                key={format}
                type="button"
                aria-pressed={filters.format === format}
                onClick={() => update({ format: filters.format === format ? "all" : format })}
                className={chip(filters.format === format)}
              >
                {FORMAT_META[format].label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.04em] text-chalk/55">What opening it does</p>
          <div role="group" aria-label="Filter by state" className="mt-3 grid gap-2 sm:grid-cols-2">
            {AVAILABILITY_ORDER.map((state) => {
              const selected = filters.state === state;
              return (
                <button
                  key={state}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => update({ state: selected ? "all" : state })}
                  className={`rounded-md border p-3 text-left transition-colors ${selected ? "border-chalk bg-white/10" : "border-white/15 hover:border-chalk/50"}`}
                >
                  <StateBadge state={state} />
                  <span className="mt-2 block font-body text-xs leading-5 text-chalk/60">{AVAILABILITY_META[state].description}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-5">
          <Button variant="ghost" onClick={() => update(DEFAULT_FILTERS)} disabled={activeFilters === 0}>
            Clear
          </Button>
          <Button onClick={() => setFilterOpen(false)}>
            Show {visible.length} {visible.length === 1 ? "ad" : "ads"}
          </Button>
        </div>
      </div>
    </Modal>
  );

  const inactiveSheet = (
    <Modal open={inactiveAd !== null} onClose={() => setInactiveAd(null)} title="Why is this inactive?" size="sm">
      {inactiveAd ? (
        <div className="flex flex-col gap-4">
          <div>
            <StateBadge state="inactive" />
            <p className="mt-3 font-display text-xl font-medium">{inactiveAd.title}</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.04em] text-chalk/50">{inactiveAd.advertiser}</p>
          </div>
          <p className="font-body text-sm leading-6 text-chalk/75">{inactiveAd.inactiveReason}</p>
          {similar.length > 0 ? (
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.04em] text-hazard">
                Try a {FORMAT_META[inactiveAd.format].label.toLowerCase()} ad that is enabled
              </p>
              <ul className="mt-2 flex flex-col gap-1">
                {similar.map((ad) => (
                  <li key={ad.id}>
                    <Link href={adHref(ad) ?? "/gallery"} className="inline-flex items-center gap-2 font-body text-sm text-chalk underline-offset-2 hover:text-hazard hover:underline">
                      {ad.title}
                      <Icon name="arrowRight" size={13} />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <Button variant="ghost" onClick={() => setInactiveAd(null)}>
            Close
          </Button>
        </div>
      ) : null}
    </Modal>
  );

  if (pending) {
    return (
      <>
        <h1 className="sr-only">Gallery</h1>
        <div className="fixed inset-0 z-0 bg-bay-floor" aria-hidden="true" />
      </>
    );
  }

  if (wallMode) {
    return (
      <>
        <h1 className="sr-only">Gallery</h1>
        <div className="fixed inset-0 z-0 bg-bay-floor">
          {visible.length > 0 ? (
            <GalleryWall ads={visible} reducedMotion={false} onOpen={open} onInactive={setInactiveAd} onUnsupported={() => setWallBroken(true)} />
          ) : (
            <div className="grid h-full place-items-center">
              <div className="text-center">
                <p className="font-display text-3xl font-medium">Nothing here</p>
                <p className="mt-2 font-body text-sm text-chalk/60">No ads match those filters.</p>
                <Button className="mt-5" onClick={() => update(DEFAULT_FILTERS)}>
                  Show all ads
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* The same ads as links, for screen readers and anyone who cannot use a canvas. */}
        <ul className="sr-only">
          {visible.map((ad) => {
            const href = adHref(ad);
            return <li key={ad.id}>{href ? <Link href={href}>{ad.title}, {ad.advertiser}</Link> : `${ad.title}, ${ad.advertiser} (inactive)`}</li>;
          })}
        </ul>

        <p
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed bottom-[5.5rem] left-1/2 z-30 -translate-x-1/2 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.04em] text-chalk/60 max-lg:sr-only"
        >
          {activeFilters > 0 ? `${visible.length} of ${ADS.length} ads` : `All ads · ${ADS.length} ads`} · drag to explore · click to open
        </p>

        <div className="pointer-events-none fixed inset-x-4 bottom-[4.75rem] z-30 flex items-center justify-between lg:bottom-4">
          <div className="pointer-events-auto">
            <ViewToggle view={shown} onChange={setView} wall={wallAvailable} />
          </div>
          <div className="pointer-events-auto">
            <FilterButton count={activeFilters} onClick={() => setFilterOpen(true)} />
          </div>
        </div>

        {filterSheet}
        {inactiveSheet}
      </>
    );
  }

  return (
    <div className="mx-auto max-w-[1800px] px-4 pb-8 pt-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.04em] text-chalk/60" role="status" aria-live="polite">
            {activeFilters > 0 ? `${visible.length} of ${ADS.length} ads` : `All ads · ${ADS.length} ads`}
          </p>
          <h1 className="mt-3 font-display text-[clamp(3rem,9vw,8rem)] font-medium leading-[0.92]">Gallery</h1>
        </div>
        <p className="max-w-md font-body text-sm leading-6 text-chalk/60">
          Every ad here is a demonstration: fictional advertisers, never paid. Open one to see how it works. Any real
          advertisement on the page sits in its own labelled placement, away from the demos.
        </p>
      </div>

      {/* On smaller screens the controls sit here; on large ones they float at the bottom corners. */}
      <div className="mt-8 flex items-center justify-between gap-3 lg:hidden">
        <ViewToggle view={shown} onChange={setView} wall={wallAvailable} />
        <FilterButton count={activeFilters} onClick={() => setFilterOpen(true)} />
      </div>
      <div className="pointer-events-none fixed inset-x-4 bottom-4 z-30 hidden items-center justify-between lg:flex">
        <div className="pointer-events-auto">
          <ViewToggle view={shown} onChange={setView} wall={wallAvailable} />
        </div>
        <div className="pointer-events-auto">
          <FilterButton count={activeFilters} onClick={() => setFilterOpen(true)} />
        </div>
      </div>

      {slot ? <div className="-mx-4 mt-8 sm:-mx-6">{slot}</div> : null}

      {visible.length === 0 ? (
        <div className="mt-12 border border-dashed border-white/20 p-12 text-center">
          <p className="font-display text-2xl font-medium">Nothing here</p>
          <p className="mt-2 font-body text-sm text-chalk/60">No ads match those filters.</p>
          <Button className="mt-5" onClick={() => update(DEFAULT_FILTERS)}>
            Show all ads
          </Button>
        </div>
      ) : shown === "grid" ? (
        <ul className="mt-10 grid hairlines sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {visible.map((ad) => (
            <li key={ad.id} className="flex bg-bay-floor">
              <div className="flex w-full">
                <AdTile ad={ad} onInactive={setInactiveAd} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-10 flex flex-col gap-12">
          {groups.map((group) => (
            <section key={group.format} aria-label={FORMAT_META[group.format].label}>
              <h2 className="flex items-baseline gap-3 border-b border-white/15 pb-3 font-mono text-[11px] font-normal uppercase tracking-[0.04em] text-chalk/70">
                <span className="text-chalk">{FORMAT_META[group.format].label}</span>
                <span>
                  {group.ads.length} {group.ads.length === 1 ? "ad" : "ads"}
                </span>
              </h2>
              <ul className="divide-y divide-white/10">
                {group.ads.map((ad) => (
                  <AdRow key={ad.id} ad={ad} onInactive={setInactiveAd} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {filterSheet}
      {inactiveSheet}
    </div>
  );
}
