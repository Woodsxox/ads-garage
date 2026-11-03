"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AdFrame } from "@/components/sandbox/AdFrame";
import { ButtonLink } from "@/components/ui/Button";
import { CopyButton } from "@/components/ui/CopyButton";
import { Icon } from "@/components/ui/Icon";
import { Pill } from "@/components/ui/Pill";
import { StateBadge } from "@/components/ui/StateBadge";
import { Tabs, tabIds } from "@/components/ui/Tabs";
import { destinationUrl, isAdMessage } from "@/lib/ads/ad-document";
import { AVAILABILITY_META, FORMAT_META } from "@/lib/domain/meta";
import type { Ad } from "@/lib/domain/types";

const TABS = [
  { id: "anatomy", label: "Anatomy" },
  { id: "notes", label: "Design notes" },
  { id: "code", label: "Code" },
  { id: "specs", label: "Specs" },
] as const;
type TabId = (typeof TABS)[number]["id"];

type LogEntry = { n: number; text: string };

export function PreviewDetail({ ad, doc }: { ad: Ad; doc: string }) {
  const [tab, setTab] = useState<TabId>("anatomy");
  const [log, setLog] = useState<LogEntry[]>([]);
  const frame = useRef<HTMLIFrameElement>(null);
  const counter = useRef(0);

  // Show the messages the ad sends out. This is the whole contract between ad and page.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow || !isAdMessage(event.data)) return;
      const { type, key } = event.data;
      const text =
        type === "navigate"
          ? `navigate → ${destinationUrl(ad)} (not followed on this page)`
          : `interaction: ${key}`;
      counter.current += 1;
      setLog((prev) => [{ n: counter.current, text }, ...prev].slice(0, 6));
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [ad]);

  const meta = AVAILABILITY_META[ad.availability];
  const inSandbox = ad.availability === "sandbox" || ad.availability === "active";

  return (
    <div className="mx-auto max-w-[1800px] px-4 pb-8 pt-10 sm:px-6">
      <nav aria-label="Breadcrumb" className="font-mono text-[11px] uppercase tracking-[0.04em] text-chalk/60">
        <Link href="/gallery" className="hover:text-hazard">
          Gallery
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="text-chalk">{ad.title}</span>
      </nav>

      <header className="mt-8 flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <StateBadge state={ad.availability} />
            <Pill>{FORMAT_META[ad.format].label}</Pill>
            <Pill outline>
              {ad.size.width}×{ad.size.height}
            </Pill>
          </div>
          <h1 className="mt-4 font-display text-[clamp(2.4rem,6vw,5rem)] font-medium leading-[0.98]">{ad.title}</h1>
          <p className="mt-3 font-body text-sm text-chalk/60">
            {ad.advertiser} · {meta.short}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {inSandbox ? (
            <ButtonLink href={`/sandbox/${ad.id}`}>
              Open in sandbox <Icon name="arrowRight" size={14} />
            </ButtonLink>
          ) : null}
          <ButtonLink href={`/learn/${ad.lessonSlug}`} variant={inSandbox ? "ghost" : "primary"}>
            <Icon name="book" size={14} /> Learn how it&apos;s built
          </ButtonLink>
          <ButtonLink href={`/create?template=${ad.templateId}`} variant="ghost">
            <Icon name="layers" size={14} /> Recreate in studio
          </ButtonLink>
        </div>
      </header>

      <div className="mt-10 grid hairlines lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)]">
        <section aria-label="Preview" className="min-w-0 bg-bay-floor p-5">
          <div className="overflow-auto rounded-lg bg-black/40 [background-image:radial-gradient(rgba(232,230,225,0.08)_1px,transparent_1px)] [background-size:16px_16px]">
            <div className="grid min-h-[420px] place-items-center p-6">
              <div className="rounded-sm border border-dashed border-hazard/50 p-3">
                <AdFrame doc={doc} title={`${ad.title} — live demo`} width={ad.size.width} height={ad.size.height} ref={frame} />
              </div>
            </div>
          </div>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.04em] text-chalk/50">
            Demo ad · sandboxed frame · try it, click it, nothing leaves this page
          </p>

          <div className="mt-4 border border-white/10 bg-bay-wall p-4" aria-live="polite">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.04em] text-hazard">Messages from the ad</h2>
            {log.length === 0 ? (
              <p className="mt-2 font-body text-sm text-chalk/55">
                Interact with the ad above. Each action it reports to the page appears here.
              </p>
            ) : (
              <ol className="mt-2 flex flex-col gap-1 font-mono text-xs text-chalk/80">
                {log.map((entry) => (
                  <li key={entry.n}>
                    <span className="text-chalk/40">#{entry.n}</span> {entry.text}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </section>

        <section aria-label="Details" className="min-w-0 bg-bay-floor p-5">
          <Tabs items={TABS} value={tab} onChange={setTab} label="Ad details" idPrefix="detail" />
          <div role="tabpanel" id={tabIds("detail", tab).panel} aria-labelledby={tabIds("detail", tab).tab} className="pt-4">
            {tab === "anatomy" ? (
              <ol className="flex flex-col gap-3">
                {ad.anatomy.map((part, index) => (
                  <li key={part.label} className="flex gap-3">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/10 font-mono text-[11px] text-hazard">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-display text-base font-medium">{part.label}</p>
                      <p className="mt-0.5 font-body text-sm leading-6 text-chalk/70">{part.note}</p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : null}

            {tab === "notes" ? (
              <ul className="flex list-disc flex-col gap-2 pl-5 font-body text-sm leading-6 text-chalk/75 marker:text-hazard">
                {ad.designNotes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            ) : null}

            {tab === "code" ? (
              <div>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-body text-xs leading-5 text-chalk/60">
                    The exact document loaded into the frame, including its CSP and script.
                  </p>
                  <CopyButton text={doc} label="Copy HTML" />
                </div>
                <pre className="mt-3 max-h-[420px] overflow-auto rounded-lg bg-black/40 p-3 font-mono text-[11px] leading-5 text-chalk/85">
                  <code>{doc}</code>
                </pre>
              </div>
            ) : null}

            {tab === "specs" ? (
              <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-2 font-body text-sm">
                <dt className="font-mono text-[11px] uppercase tracking-[0.04em] text-chalk/50">Format</dt>
                <dd>{FORMAT_META[ad.format].label}</dd>
                <dt className="font-mono text-[11px] uppercase tracking-[0.04em] text-chalk/50">Size</dt>
                <dd>
                  {ad.size.width}×{ad.size.height}
                </dd>
                <dt className="font-mono text-[11px] uppercase tracking-[0.04em] text-chalk/50">Destination</dt>
                <dd className="break-all">{destinationUrl(ad)}</dd>
                <dt className="font-mono text-[11px] uppercase tracking-[0.04em] text-chalk/50">Frame</dt>
                <dd>
                  <code className="font-mono text-xs">sandbox=&quot;allow-scripts&quot;</code>, CSP{" "}
                  <code className="font-mono text-xs">default-src &apos;none&apos;</code>
                </dd>
                <dt className="font-mono text-[11px] uppercase tracking-[0.04em] text-chalk/50">Tags</dt>
                <dd>{ad.tags.join(", ")}</dd>
              </dl>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
