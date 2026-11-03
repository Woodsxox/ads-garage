"use client";

import { useEffect, useRef, useState } from "react";
import { AdFrame } from "@/components/sandbox/AdFrame";
import { BrowserFrame } from "@/components/sandbox/BrowserFrame";
import { EngagementPanel } from "@/components/sandbox/EngagementPanel";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { StateBadge } from "@/components/ui/StateBadge";
import { destinationUrl, isAdMessage } from "@/lib/ads/ad-document";
import { canEmbed } from "@/lib/ads/embed";
import { FORMAT_META } from "@/lib/domain/meta";
import type { Ad } from "@/lib/domain/types";

type Page = { kind: "ad" | "landing" | "external"; url: string; title: string };
type Nav = { pages: Page[]; index: number };

const ISOLATION_NOTES = [
  'The ad runs in an <iframe sandbox="allow-scripts">. With no allow-same-origin it gets an opaque origin: it cannot read this page, our cookies or storage.',
  "Forms, popups and top-level navigation are not allowed. The ad cannot send you elsewhere on its own.",
  "The ad document carries a Content-Security-Policy of default-src 'none': it cannot load anything from the network.",
  "The only way out is postMessage. This page accepts only known message shapes from this exact frame.",
  "External destinations load only if reviewed as embeddable and on an allow-list; otherwise you see a fallback. This is client-side, so server headers are a backend-phase task.",
];

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function ExternalPage({ url, embeddable, note }: { url: string; embeddable: boolean; note: string }) {
  const [loaded, setLoaded] = useState(false);
  const [slow, setSlow] = useState(false);
  const host = hostOf(url);

  useEffect(() => {
    if (!embeddable) return;
    const timer = setTimeout(() => setSlow(true), 8000);
    return () => clearTimeout(timer);
  }, [embeddable]);

  if (!embeddable) {
    return (
      <div className="grid min-h-[420px] place-items-center p-6">
        <div className="max-w-md border border-hazard/50 bg-bay-wall p-6 text-center">
          <Icon name="alert" size={28} className="mx-auto text-hazard" />
          <h3 className="mt-3 font-display text-xl tracking-[0.04em]">This site can&apos;t be shown here</h3>
          <p className="mt-2 font-body text-sm leading-6 text-chalk/75">{note}</p>
          <p className="mt-2 font-body text-xs leading-5 text-chalk/55">
            Many sites forbid embedding to prevent clickjacking. Ads Garage respects that and does not try to get
            around it.
          </p>
          <div className="mt-4 flex justify-center">
            <ButtonLink href={url} external>
              Open {host} in a new tab <Icon name="external" size={14} />
            </ButtonLink>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <iframe
        title={`External page: ${host}`}
        src={url}
        sandbox="allow-scripts allow-forms"
        referrerPolicy="no-referrer"
        onLoad={() => setLoaded(true)}
        className="block h-[440px] w-full border-0 bg-white"
      />
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-bay-wall px-3 py-2">
        <p className="font-body text-xs text-chalk/60">
          {slow && !loaded ? "Taking long? The site may refuse to be embedded. " : "Restricted frame. "}
          {note}
        </p>
        <ButtonLink href={url} external variant="ghost" size="sm">
          Open in new tab <Icon name="external" size={12} />
        </ButtonLink>
      </div>
    </div>
  );
}

export function SandboxViewer({ ad, adDoc, landingDoc }: { ad: Ad; adDoc: string; landingDoc: string }) {
  const engagement = ad.engagement;
  const gated = ad.availability === "active" && engagement !== undefined;
  const requirements = gated ? engagement.requirements : [];

  const adPage: Page = { kind: "ad", url: `sandbox://ad-garage/${ad.id}`, title: ad.title };
  const dest = ad.destination;
  const destPage: Page =
    dest.kind === "landing"
      ? { kind: "landing", url: destinationUrl(ad), title: dest.title }
      : { kind: "external", url: dest.url, title: hostOf(dest.url) };

  const [nav, setNav] = useState<Nav>({ pages: [adPage], index: 0 });
  const [reloadKey, setReloadKey] = useState(0);
  const [runId, setRunId] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [timerChoice, setTimerChoice] = useState("default");
  const [pageHidden, setPageHidden] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);

  const total = !gated ? 0 : timerChoice === "default" ? engagement.durationSec : Number(timerChoice);
  const current = nav.pages[nav.index];
  const onAd = current.kind === "ad";

  // Viewing time counts only while the ad itself is showing and this tab is visible.
  useEffect(() => {
    if (total <= 0) return;
    const onVisibility = () => setPageHidden(document.visibilityState !== "visible");
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [total]);

  useEffect(() => {
    if (total <= 0 || !onAd) return;
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.5);
      last = now;
      if (document.visibilityState === "visible") setElapsed((e) => Math.min(total, e + dt));
    }, 200);
    return () => clearInterval(id);
  }, [total, onAd, runId]);

  // The one channel from the ad to this page. Anything else is ignored.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frameRef.current?.contentWindow || !isAdMessage(event.data)) return;
      const { type, key } = event.data;
      if (type === "interaction") {
        setDone((prev) => (prev.includes(key) ? prev : [...prev, key]));
      } else if (type === "navigate") {
        setNav((n) =>
          n.pages[n.index].kind === "ad"
            ? { pages: [...n.pages.slice(0, n.index + 1), destPage], index: n.index + 1 }
            : n,
        );
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
    // destPage is derived from `ad`, which is stable for this page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ad]);

  const timeDone = total <= 0 || elapsed >= total;
  const actionsDone = requirements.every((r) => done.includes(r.key));
  const complete = !gated || (timeDone && actionsDone);

  const restart = () => {
    setNav({ pages: [adPage], index: 0 });
    setDone([]);
    setElapsed(0);
    setRunId((r) => r + 1);
  };

  const changeTimer = (value: string) => {
    setTimerChoice(value);
    setElapsed(0);
  };

  const pausedReason = !onAd ? "you are on the destination page" : pageHidden ? "this tab is in the background" : null;
  const remainingActions = requirements.filter((r) => !done.includes(r.key)).length;
  const lockHint = (() => {
    const parts: string[] = [];
    if (!timeDone) parts.push(`${Math.ceil(total - elapsed)}s of viewing`);
    if (remainingActions > 0) parts.push(`${remainingActions} action${remainingActions === 1 ? "" : "s"}`);
    return parts.join(" and ");
  })();

  const frameKey = `${runId}-${reloadKey}-${nav.index}`;
  const destEmbeddable = dest.kind === "external" && canEmbed(dest);

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StateBadge state={ad.availability} />
            <span className="font-mono text-[10px] uppercase tracking-[0.04em] text-chalk/50">
              {FORMAT_META[ad.format].label} · {ad.size.width}×{ad.size.height}
            </span>
          </div>
          <h1 className="mt-2 font-display text-3xl tracking-[0.04em] sm:text-4xl">{ad.title}</h1>
          <p className="mt-1 max-w-2xl font-body text-sm text-chalk/65">{ad.summary}</p>
        </div>
        <ButtonLink href={`/gallery#ad-${ad.id}`} variant="ghost" size="sm">
          <Icon name="arrowLeft" size={13} /> Gallery
        </ButtonLink>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          <BrowserFrame
            title={current.title}
            url={current.url}
            canBack={nav.index > 0}
            canForward={nav.index < nav.pages.length - 1}
            onBack={() => setNav((n) => ({ ...n, index: Math.max(0, n.index - 1) }))}
            onForward={() => setNav((n) => ({ ...n, index: Math.min(n.pages.length - 1, n.index + 1) }))}
            onReload={() => setReloadKey((k) => k + 1)}
            isolationNotes={ISOLATION_NOTES}
          >
            {current.kind === "ad" ? (
              <div className="grid min-h-[440px] place-items-center overflow-auto p-6">
                <div className="border border-dashed border-hazard/60 p-3">
                  <AdFrame
                    key={frameKey}
                    ref={frameRef}
                    doc={adDoc}
                    title={`${ad.title} — sandboxed ad`}
                    width={ad.size.width}
                    height={ad.size.height}
                  />
                </div>
              </div>
            ) : null}
            {current.kind === "landing" ? (
              <AdFrame key={frameKey} doc={landingDoc} title={`${ad.title} — destination`} width="100%" height={440} />
            ) : null}
            {current.kind === "external" && dest.kind === "external" ? (
              <ExternalPage key={frameKey} url={dest.url} embeddable={destEmbeddable} note={dest.note} />
            ) : null}
          </BrowserFrame>

          <div
            className={`mt-3 flex flex-col gap-3 border p-4 sm:flex-row sm:items-center sm:justify-between ${
              complete ? "border-torque/60 bg-torque/10" : "border-white/10 bg-bay-wall"
            }`}
          >
            <p className="font-body text-sm leading-6 text-chalk/80" role="status" aria-live="polite">
              {!gated ? (
                "Explore freely. Nothing is required here."
              ) : complete ? (
                <>
                  <Icon name="check" size={14} className="mr-1.5 inline text-torque" />
                  Experience complete. Nothing was earned or recorded: this is a demo.
                </>
              ) : (
                <>
                  <Icon name="lock" size={14} className="mr-1.5 inline text-hazard" />
                  Next step unlocks after {lockHint}.
                </>
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              <ButtonLink href={`/gallery#ad-${ad.id}`} variant="ghost">
                Back to gallery
              </ButtonLink>
              <ButtonLink href={`/learn/${ad.lessonSlug}`} disabled={!complete}>
                Continue to the lesson <Icon name="arrowRight" size={14} />
              </ButtonLink>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {gated ? (
            <EngagementPanel
              total={total}
              elapsed={elapsed}
              requirements={requirements}
              done={done}
              pausedReason={pausedReason}
              complete={complete}
              timerChoice={timerChoice}
              onTimerChoice={changeTimer}
              onRestart={restart}
            />
          ) : (
            <section className="rounded-xl bg-bay-wall p-4">
              <h2 className="font-display text-sm tracking-[0.04em]">Free exploration</h2>
              <p className="mt-2 font-body text-sm leading-6 text-chalk/70">
                This ad is a sandbox ad: click, play and follow its destination. The browser controls work: go back,
                forward and reload.
              </p>
              <button
                type="button"
                onClick={restart}
                className="mt-3 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.04em] text-hazard"
              >
                <Icon name="refresh" size={13} /> Restart
              </button>
            </section>
          )}

          <section className="rounded-xl bg-bay-wall p-4">
            <h2 className="font-display text-sm tracking-[0.04em]">Destination</h2>
            <p className="mt-2 break-all font-mono text-xs text-chalk/75">{destinationUrl(ad)}</p>
            <p className="mt-2 font-body text-xs leading-5 text-chalk/55">
              {dest.kind === "landing"
                ? "A mock page on a reserved .example domain. It is served from this app, never from the internet."
                : destEmbeddable
                  ? "A real external page, loaded in a restricted frame."
                  : "A real external page that blocks embedding. The viewer shows a fallback."}
            </p>
            <div className="mt-3 flex flex-wrap gap-4">
              <ButtonLink href={`/learn/${ad.lessonSlug}`} variant="ghost" size="sm" disabled={!complete}>
                <Icon name="book" size={12} /> Lesson
              </ButtonLink>
              <ButtonLink href={`/create?template=${ad.templateId}`} variant="ghost" size="sm">
                <Icon name="layers" size={12} /> Recreate
              </ButtonLink>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
