import type { Metadata } from "next";
import { AdTile } from "@/components/gallery/AdTile";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";
import { TILE_GRID } from "@/components/ui/tile";
import { ADS } from "@/lib/demo/ads";

export const metadata: Metadata = {
  title: "Sandbox",
  description: "Open ads in a controlled, browser-style viewer. Explore freely or complete a timed experience.",
};

const FACTS = [
  {
    title: "A real sandbox",
    body: "Each ad runs in an iframe with the sandbox attribute and no same-origin access, so it cannot read this page or its storage.",
  },
  {
    title: "No network",
    body: "The ad document ships its own Content-Security-Policy that blocks every request. It can only talk to the viewer by message.",
  },
  {
    title: "Honest fallbacks",
    body: "Real external pages load only when reviewed as embeddable. Everything else shows a clear fallback instead of a broken frame.",
  },
];

function engagementLine(ad: (typeof ADS)[number]): string | undefined {
  if (ad.availability !== "active" || !ad.engagement) return undefined;
  const actions = ad.engagement.requirements.length;
  return `${ad.engagement.durationSec}s view · ${actions} required action${actions === 1 ? "" : "s"}`;
}

export default function SandboxLobbyPage() {
  const sandbox = ADS.filter((ad) => ad.availability === "sandbox");
  const active = ADS.filter((ad) => ad.availability === "active");

  return (
    <div className="mx-auto max-w-[1800px] px-4 pb-8 pt-10 sm:px-6">
      <PageHeader eyebrow={`Sandbox · ${active.length + sandbox.length} ads to play with`} title="Sandbox">
        Open an ad inside a browser-style viewer without leaving Ads Garage. Sandbox ads are free play. Active
        experiences add a viewing time and required actions before the next step unlocks.
      </PageHeader>

      <ul className={`${TILE_GRID} md:grid-cols-3`}>
        {FACTS.map((fact, i) => (
          <li key={fact.title} className="flex flex-col gap-3 bg-bay-floor p-6">
            <span className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.04em] text-chalk/50">
              {String(i + 1).padStart(2, "0")}
              <Icon name="shield" size={15} className="text-torque" />
            </span>
            <h2 className="mt-6 font-display text-2xl font-medium">{fact.title}</h2>
            <p className="font-body text-sm leading-6 text-chalk/60">{fact.body}</p>
          </li>
        ))}
      </ul>

      <section className="mt-20" aria-labelledby="active-heading">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/15 pb-4">
          <h2 id="active-heading" className="font-display text-3xl font-medium">
            Active experiences
          </h2>
          <p className="max-w-md font-body text-sm text-chalk/55">
            Timed viewing, video playback and required steps. Time spent here is a demo: it is never a paid impression.
          </p>
        </div>
        <ul className={`${TILE_GRID} mt-px sm:grid-cols-2 xl:grid-cols-4`}>
          {active.map((ad) => (
            <li key={ad.id} className="flex bg-bay-floor">
              <AdTile ad={ad} note={engagementLine(ad)} />
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-20" aria-labelledby="free-heading">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/15 pb-4">
          <h2 id="free-heading" className="font-display text-3xl font-medium">
            Free play
          </h2>
          <p className="max-w-md font-body text-sm text-chalk/55">Click, play and follow the destination. Nothing is required.</p>
        </div>
        <ul className={`${TILE_GRID} mt-px sm:grid-cols-2 xl:grid-cols-4`}>
          {sandbox.map((ad) => (
            <li key={ad.id} className="flex bg-bay-floor">
              <AdTile ad={ad} />
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-16">
        <ButtonLink href="/gallery" variant="ghost">
          Browse the full gallery <Icon name="arrowRight" size={14} />
        </ButtonLink>
      </div>
    </div>
  );
}
