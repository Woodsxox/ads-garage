import Link from "next/link";
import { SponsoredSlot } from "@/components/ads/SponsoredSlot";
import { DemoTile } from "@/components/home/DemoTile";
import { Faq } from "@/components/home/Faq";
import { HeroStage, type HeroItem } from "@/components/home/HeroStage";
import { Marquee } from "@/components/home/Marquee";
import { RevealText } from "@/components/home/RevealText";
import { ButtonLink } from "@/components/ui/Button";
import { AdArt } from "@/components/ui/AdArt";
import { Icon } from "@/components/ui/Icon";
import { FeatureStatusTag } from "@/components/ui/StateBadge";
import { buildAdDocument } from "@/lib/ads/ad-document";
import { ADS, getAd } from "@/lib/demo/ads";
import { LESSONS } from "@/lib/demo/lessons";
import { PLANS } from "@/lib/demo/plans";
import { TEMPLATES } from "@/lib/demo/templates";
import { FORMAT_META, FORMAT_ORDER, adHref } from "@/lib/domain/meta";
import type { Ad, AdFormat, FeatureStatus } from "@/lib/domain/types";

function need(id: string): Ad {
  const ad = getAd(id);
  if (!ad) throw new Error(`Missing demo ad ${id}`);
  return ad;
}

const HERO: { id: string; tab: string; hint: string }[] = [
  { id: "northwind-spring-sale", tab: "Image", hint: "Click the button. Nothing leaves this page." },
  { id: "bay12-brew-story", tab: "Video", hint: "Press play. It is a simulated 12-second video." },
  { id: "northwind-hover-cta", tab: "Clickable", hint: "Hover the card, then click it." },
  { id: "tire-spin", tab: "Game", hint: "Tap the wheel to spin it." },
];

const FORMAT_EXAMPLE: Record<AdFormat, string> = {
  image: "northwind-spring-sale",
  banner: "amberline-leaderboard",
  video: "bay12-brew-story",
  clickable: "northwind-hover-cta",
  carousel: "northwind-tool-carousel",
  gamified: "tire-spin",
  native: "bay12-in-feed",
};

const JOURNEY: { step: string; href: string; note: string; status: FeatureStatus }[] = [
  { step: "Discover", href: "/gallery", note: "Browse ads in every format.", status: "available" },
  { step: "Explore", href: "/gallery", note: "Open any ad and see how it is built.", status: "available" },
  { step: "Learn", href: "/learn", note: "Interactive lessons and exercises.", status: "available" },
  { step: "Experiment", href: "/sandbox", note: "Play with ads in an isolated sandbox.", status: "available" },
  { step: "Create", href: "/create", note: "Templates and a visual editor. AI help is planned.", status: "available" },
  { step: "Test", href: "/create", note: "Preview in context and run design checks.", status: "available" },
  { step: "Export or publish", href: "/integrations", note: "Download now. Platform publishing is a demo.", status: "preview" },
  { step: "Manage", href: "/integrations", note: "Campaign status tracking is a demo.", status: "preview" },
];

const AD_KINDS: { title: string; body: string; tag: string }[] = [
  {
    title: "Real advertising",
    body: "Genuine inventory from our ad provider, in labelled placements on the home page, gallery and articles. It can earn revenue under the provider's own rules. It never appears inside the sandbox, studio or lessons, and it never moves.",
    tag: "May earn revenue",
  },
  {
    title: "Demo ads",
    body: "Fictional advertisers built for learning and experimenting. Click them, play them, take them apart. They are never paid and nothing you do with them is recorded.",
    tag: "Never paid",
  },
  {
    title: "Your ads",
    body: "Ads you create in the studio. They become real campaigns only when you publish them through an advertising platform. Until then they are drafts on your device.",
    tag: "Yours to publish",
  },
];

const FAQ = [
  {
    q: "Is Ads Garage free?",
    a: "Browsing, the lessons, the sandbox and the studio's core tools are free. Ads Garage is supported by clearly labelled advertising and by paid plans. Plans are not on sale yet: pricing is decided at launch.",
  },
  {
    q: "Are the ads real?",
    a: "The ads in the gallery and sandbox are demos from fictional advertisers. They are never paid and nothing you do with them is recorded. Real ads, where shown, sit in labelled \"Advertisement\" placements away from the demos, served by an ad provider under its own rules.",
  },
  {
    q: "What is the sandbox?",
    a: "Each ad runs in an isolated frame. It cannot read the page, your cookies or your storage, cannot open pop-ups or send you elsewhere on its own, and can only report a few known events back to the page.",
  },
  {
    q: "Can I publish what I make?",
    a: "Today you can export a PNG, HTML, JSON or a ZIP bundle and upload it yourself. Publishing through ad platforms, Google Ads first, is a demo preview. Real publishing depends on API access and approval from each platform.",
  },
  {
    q: "Is the AI built yet?",
    a: "Not yet. AI-assisted creation is planned, starting with headlines and copy inside the editor you can use today. The plans page shows which parts are available now, which are previews and which are planned.",
  },
  {
    q: "Where is my work saved?",
    a: "In this browser, for now. Accounts and syncing across devices arrive when the web app is connected to the API.",
  },
] as const;

/** One side column of the hero: a still, labelled slot for real ads on top, moving demo tiles below. */
function HeroColumn({ tiles, duration, reverse = false }: { tiles: Ad[]; duration: number; reverse?: boolean }) {
  return (
    <div className="hidden h-[calc(100svh-10rem)] w-[17vw] min-w-[190px] max-w-[330px] flex-col gap-3 self-center md:flex">
      <SponsoredSlot variant="column" />
      <Marquee axis="y" reverse={reverse} duration={duration} className="min-h-0 flex-1">
        {tiles.map((ad) => (
          <DemoTile key={ad.id} ad={ad} fit height={320} className="w-full" />
        ))}
      </Marquee>
    </div>
  );
}

export default function HomePage() {
  const heroItems: HeroItem[] = HERO.map((h) => {
    const ad = need(h.id);
    return {
      id: ad.id,
      tab: h.tab,
      title: ad.title,
      doc: buildAdDocument(ad),
      width: ad.size.width,
      height: ad.size.height,
      state: ad.availability,
      href: adHref(ad) ?? "/gallery",
      hint: h.hint,
    };
  });

  // Tiles that open somewhere. Split between the two hero columns so they do not repeat side by side.
  const openable = ADS.filter((ad) => adHref(ad) !== null);
  const left = openable.filter((_, i) => i % 2 === 0);
  const right = openable.filter((_, i) => i % 2 === 1);

  const stats = [
    { value: ADS.length, label: "demo ads to open and take apart" },
    { value: FORMAT_ORDER.length, label: "ad formats, from banners to carousels" },
    { value: LESSONS.length, label: "interactive lessons with graded exercises" },
    { value: TEMPLATES.length, label: "templates to start a design from" },
  ];

  return (
    <>

      {/* Hero: a centred headline between two columns. Real ads sit still on top; demo tiles move below. */}
      <section aria-labelledby="hero-heading" className="relative -mt-20 flex min-h-svh gap-3 px-3 pb-24 pt-28 sm:px-4">
        <HeroColumn tiles={left} duration={90} />

        <div className="flex min-w-0 flex-1 flex-col items-center justify-center py-10 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.04em] text-chalk/60">Ads Garage · the ad playground</p>
          <RevealText
            as="h1"
            immediate
            className="mt-6 max-w-[14ch] font-display text-[clamp(2.6rem,6.2vw,6rem)] font-medium leading-[0.98] sm:max-w-[16ch]"
          >
            Discover, learn, create and publish ads
          </RevealText>
          <p id="hero-heading" className="sr-only">
            Discover, learn, create and publish ads
          </p>
          <p className="mt-7 max-w-md font-body text-base leading-7 text-chalk/70">
            Explore how digital ads work, take them apart in a safe sandbox, learn the craft, then build your own and
            take it to the platforms that run ads.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/gallery">
              Explore the gallery <Icon name="arrowRight" size={15} />
            </ButtonLink>
            <ButtonLink href="/create" variant="secondary">
              Create an ad
            </ButtonLink>
          </div>
          <ul className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 font-mono text-[10px] uppercase tracking-[0.04em] text-chalk/50">
            <li>Free to browse</li>
            <li>Demo ads are never paid</li>
            <li>Sponsored slots are labelled</li>
          </ul>

          {/* On phones the side columns do not fit, so the demos run as a strip instead. */}
          <Marquee axis="x" duration={50} className="mt-12 w-full md:hidden">
            {openable.map((ad) => (
              <DemoTile key={ad.id} ad={ad} width={240} height={180} />
            ))}
          </Marquee>
        </div>

        <HeroColumn tiles={right} duration={110} reverse />
      </section>

      {/* Statement: one large paragraph, revealed line by line. */}
      <section className="mx-auto max-w-[1800px] px-4 py-28 sm:px-6 lg:py-40" aria-label="About Ads Garage">
        <div className="grid gap-8 md:grid-cols-[1fr_3fr]">
          <p className="font-mono text-[11px] uppercase tracking-[0.04em] text-chalk/60">About</p>
          <RevealText
            as="p"
            className="font-display text-[clamp(1.9rem,4.4vw,4.4rem)] font-medium leading-[1.08]"
          >
            Ads Garage is where digital ads are taken apart and put back together. Open any ad, see how it works,
            learn the craft in a safe sandbox, then build your own and take it to the platforms that run them.
          </RevealText>
        </div>
      </section>

      {/* The gallery in motion. Demo only, so it is free to move. */}
      <section aria-labelledby="strip-heading" className="pb-24">
        <div className="mx-auto flex max-w-[1800px] items-end justify-between gap-4 px-4 pb-6 sm:px-6">
          <h2 id="strip-heading" className="font-display text-3xl font-medium sm:text-4xl">
            The gallery, in motion
          </h2>
          <ButtonLink href="/gallery" variant="ghost" size="sm">
            Open the gallery <Icon name="arrowRight" size={13} />
          </ButtonLink>
        </div>
        <Marquee axis="x" duration={90} gap={10} className="px-0">
          {ADS.map((ad) => (
            <DemoTile key={ad.id} ad={ad} width={380} height={300} />
          ))}
        </Marquee>
      </section>

      {/* Try one for real: the same isolated frames the sandbox uses. */}
      <section className="border-y border-white/10 bg-bay-wall/40" aria-labelledby="try-heading">
        <div className="mx-auto grid max-w-[1800px] items-center gap-12 px-4 py-24 sm:px-6 lg:grid-cols-[1fr_1fr]">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.04em] text-hazard">Try one</p>
            <RevealText as="h2" className="mt-3 max-w-[14ch] font-display text-[clamp(2rem,4vw,3.8rem)] font-medium leading-[1.04]">
              This ad is live, and it is isolated
            </RevealText>
            <p id="try-heading" className="sr-only">
              Try a live, isolated demo ad
            </p>
            <p className="mt-5 max-w-md font-body text-base leading-7 text-chalk/70">
              Pick a format and use it. The page reports what the ad sent, because that message channel is the only
              way out of the frame.
            </p>
          </div>
          <HeroStage items={heroItems} />
        </div>
      </section>

      {/* Journey */}
      <section className="mx-auto max-w-[1800px] px-4 py-28 sm:px-6" aria-labelledby="journey-heading">
        <p className="font-mono text-[11px] uppercase tracking-[0.04em] text-hazard">One connected workflow</p>
        <h2 id="journey-heading" className="mt-3 max-w-[22ch] font-display text-[clamp(2rem,4vw,3.8rem)] font-medium leading-[1.04]">
          From &ldquo;how does this ad work?&rdquo; to your own campaign
        </h2>
        <ol className="mt-12 grid hairlines sm:grid-cols-2 lg:grid-cols-4">
          {JOURNEY.map((item, i) => (
            <li key={item.step} className="relative flex min-h-[170px] flex-col gap-3 bg-bay-floor p-5 transition-colors hover:bg-bay-wall">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.04em] text-chalk/50">{String(i + 1).padStart(2, "0")}</span>
                <FeatureStatusTag status={item.status} />
              </div>
              <h3 className="mt-auto font-display text-2xl font-medium">
                <Link href={item.href} className="after:absolute after:inset-0 after:content-['']">
                  {item.step}
                </Link>
              </h3>
              <p className="font-body text-sm leading-6 text-chalk/60">{item.note}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Formats */}
      <section className="mx-auto max-w-[1800px] px-4 pb-28 sm:px-6" aria-labelledby="formats-heading">
        <p className="font-mono text-[11px] uppercase tracking-[0.04em] text-hazard">Formats</p>
        <h2 id="formats-heading" className="mt-3 max-w-[22ch] font-display text-[clamp(2rem,4vw,3.8rem)] font-medium leading-[1.04]">
          Seven ways to put a message in front of someone
        </h2>
        <ul className="mt-12 grid hairlines sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {FORMAT_ORDER.map((format) => {
            const ad = need(FORMAT_EXAMPLE[format]);
            return (
              <li key={format} className="relative flex flex-col bg-bay-floor transition-colors hover:bg-bay-wall">
                <div className="grid h-48 place-items-center p-4">
                  <AdArt ad={ad} maxWidth={165} maxHeight={150} />
                </div>
                <div className="flex flex-1 flex-col gap-1.5 border-t border-white/10 p-4">
                  <h3 className="font-display text-xl font-medium">
                    <Link href={`/gallery?format=${format}`} className="after:absolute after:inset-0 after:content-['']">
                      {FORMAT_META[format].label}
                    </Link>
                  </h3>
                  <p className="font-body text-xs leading-5 text-chalk/60">{FORMAT_META[format].blurb}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <SponsoredSlot />

      {/* Real, demo and yours */}
      <section className="mx-auto max-w-[1800px] px-4 py-28 sm:px-6" aria-labelledby="kinds-heading">
        <p className="font-mono text-[11px] uppercase tracking-[0.04em] text-hazard">Know what you are looking at</p>
        <h2 id="kinds-heading" className="mt-3 max-w-[22ch] font-display text-[clamp(2rem,4vw,3.8rem)] font-medium leading-[1.04]">
          Real ads, demo ads and yours
        </h2>
        <ul className="mt-12 grid hairlines md:grid-cols-3">
          {AD_KINDS.map((kind) => (
            <li key={kind.title} className="flex flex-col gap-4 bg-bay-floor p-7">
              <span className="self-start rounded-full border border-hazard/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.04em] text-hazard">
                {kind.tag}
              </span>
              <h3 className="font-display text-3xl font-medium">{kind.title}</h3>
              <p className="font-body text-sm leading-6 text-chalk/65">{kind.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Numbers, counted from what is actually in the build. */}
      <section className="border-y border-white/10" aria-labelledby="count-heading">
        <div className="mx-auto max-w-[1800px] px-4 py-24 sm:px-6">
          <h2 id="count-heading" className="font-mono text-[11px] uppercase tracking-[0.04em] text-chalk/60">
            By the numbers · counted from this build
          </h2>
          <dl className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dt className="font-display text-[clamp(4rem,9vw,8rem)] font-medium leading-none">{stat.value}</dt>
                <dd className="mt-3 max-w-[22ch] font-body text-sm leading-6 text-chalk/60">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* AI Studio: planned, and labelled that way. */}
      <section className="mx-auto max-w-[1800px] px-4 py-28 sm:px-6" aria-labelledby="ai-heading">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.04em] text-hazard">AI Studio</p>
              <FeatureStatusTag status="planned" />
            </div>
            <h2 id="ai-heading" className="mt-3 max-w-[16ch] font-display text-[clamp(2rem,4vw,3.8rem)] font-medium leading-[1.04]">
              Describe the ad. Then make it yours.
            </h2>
            <p className="mt-5 max-w-md font-body text-base leading-7 text-chalk/70">
              AI-assisted creation is not built yet. The plan is for headlines, copy, images and variations to be
              generated from a short description and land in the same editor you can use today, still fully editable.
              Which models you can use will depend on your plan.
            </p>
            <div className="mt-7">
              <ButtonLink href="/plans" variant="secondary">
                See what each plan will include <Icon name="arrowRight" size={14} />
              </ButtonLink>
            </div>
          </div>
          <ol className="grid grid-cols-2 gap-px self-center bg-white/10 sm:grid-cols-3">
            {["Generate", "Preview", "Edit", "Improve", "Test", "Export or publish"].map((label, i) => (
              <li key={label} className="flex min-h-[110px] flex-col justify-between bg-bay-floor p-5">
                <span className="font-mono text-[10px] uppercase tracking-[0.04em] text-chalk/45">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-display text-xl font-medium">{label}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Plans */}
      <section className="border-t border-white/10 bg-bay-wall/40" aria-labelledby="plans-heading">
        <div className="mx-auto max-w-[1800px] px-4 py-28 sm:px-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.04em] text-hazard">Plans</p>
          <h2 id="plans-heading" className="mt-3 max-w-[20ch] font-display text-[clamp(2rem,4vw,3.8rem)] font-medium leading-[1.04]">
            Start free. Grow into the integrations.
          </h2>
          <ul className="mt-12 grid hairlines md:grid-cols-3">
            {PLANS.map((plan) => (
              <li key={plan.id} className="flex flex-col bg-bay-floor p-7">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-3xl font-medium">{plan.name}</h3>
                  {plan.comingSoon ? (
                    <span className="rounded-full border border-flag/70 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.04em] text-flag">Coming soon</span>
                  ) : null}
                </div>
                <p className="mt-3 font-body text-sm leading-6 text-chalk/65">{plan.tagline}</p>
                <ul className="mt-6 flex flex-col gap-3">
                  {plan.features.slice(0, 4).map((f) => (
                    <li key={f.label} className="flex items-start justify-between gap-3 font-body text-[13px] leading-5 text-chalk/75">
                      <span>{f.label}</span>
                      <FeatureStatusTag status={f.status} />
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <ButtonLink href="/plans" variant="secondary">
              Compare plans <Icon name="arrowRight" size={14} />
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-[1800px] px-4 py-28 sm:px-6" aria-labelledby="faq-heading">
        <div className="grid gap-10 md:grid-cols-[1fr_2fr]">
          <h2 id="faq-heading" className="font-display text-[clamp(2rem,4vw,3.8rem)] font-medium leading-[1.04]">
            Your questions, answered
          </h2>
          <Faq items={FAQ} />
        </div>
      </section>

      <section className="mx-auto max-w-[1800px] px-4 pb-8 sm:px-6">
        <div className="flex flex-col items-start gap-6 rounded-sm border border-white/15 p-8 sm:p-12 md:flex-row md:items-center md:justify-between">
          <h2 className="max-w-[18ch] font-display text-[clamp(2rem,4vw,3.6rem)] font-medium leading-[1.04]">Open an ad, learn why it works, then build your own.</h2>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/gallery">Browse the gallery</ButtonLink>
            <ButtonLink href="/create" variant="secondary">
              Open the studio
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
