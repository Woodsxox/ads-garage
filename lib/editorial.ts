export type EditorialKind = "guide" | "blog";

export type EditorialDoc = {
  slug: string;
  kind: EditorialKind;
  title: string;
  description: string;
  minutes: number;
  kicker: string;
  paragraphs: string[];
};

export const EDITORIAL: readonly EditorialDoc[] = [
  {
    slug: "how-adsense-approval-works",
    kind: "guide",
    title: "How AdSense approval actually works",
    description:
      "What Google reviews on a new publisher site, why traffic volume is the wrong obsession, and how to fail a review without knowing it.",
    minutes: 9,
    kicker: "Guide",
    paragraphs: [
      "Google does not publish a traffic quota for AdSense. Sites get approved with a few hundred visits and sites with tens of thousands get rejected. The review is about whether the page is a destination a person would search for, land on, and read — not whether it is a rack for ad units.",
      "The reviewer (and the automated systems around them) looks at original writing, navigation that goes somewhere, an about page that names a person or a company, and content that would still make sense if every ad was stripped out. A site whose only job is demonstrating ad sizes fails that test on purpose. That is why Ad Garage keeps live units off the showroom.",
      "Thin pages, spun listicles, and doorway sites fail because there is nothing to read between the units. If a visitor’s first scroll is three ads and a 60-word paragraph, the page is an ad page. Ad pages are not what AdSense pays for, and they are not what the program wants in the network.",
      "Policy pages are not decoration. A working privacy policy, a clear contact method, and copyright that belongs to you are part of the quality signal. Copied “Lorem privacy” templates with another company’s name still in them are a common, avoidable rejection.",
      "Navigation should describe content, not inventory. “Home, Guides, About” tells a reviewer what the site is. “Ads, Demos, Formats” tells them the site exists to display ads. That distinction is the same one this product enforces in software: live code only sits inside articles.",
      "If you have been rejected, do not re-apply the same day with a new header color. Add two or three articles that answer a real query, wait until they are indexed, and apply again. Re-applying into the same thin site trains the review on a no.",
      "Once approved, the job changes from “look like a site” to “stay a site.” Invalid clicks, accidental double-loads of adsbygoogle.js, and layouts that shove units against buttons are how approved accounts get limited. The rest of this guide is about not doing that.",
      "Treat the first month after approval as a burn-in. Do not change every template. Do not add five new units. Do not send a group chat asking friends to “click the ads to help.” Read your own articles on a phone, confirm the ads are labeled quietly, and leave the account alone.",
    ],
  },
  {
    slug: "ad-density-and-layout-quality",
    kind: "guide",
    title: "Ad density and layout quality",
    description:
      "How many units a page can carry before reading falls apart — and why “more slots” is a weak earnings strategy.",
    minutes: 8,
    kicker: "Guide",
    paragraphs: [
      "A page can only hold so many ads before it stops being a page. Readers bounce, viewability on the remaining units drops, and you have trained both Google and your audience that the site is hostile. Density is a quality setting, not a volume knob.",
      "A workable starting layout for a long article is one unit near the top (not glued to the logo), one in-article unit after the second or third heading, and one at the natural end of the piece. That is three. It is enough to learn from. It is rarely what gets a site limited.",
      "Sidebar stacks look productive in a desktop inspector and disappear on a phone, where most sessions happen. If your “five-ad layout” is four skyscrapers in a rail the mobile template drops, you do not have five ads. You have a desktop fantasy and a cramped article.",
      "In-article units work when the prose around them is real. If you insert a unit every 80 words, you are not placing ads in content. You are slicing content to justify ads. Viewers notice. So do the systems that score layout quality.",
      "Sticky footers earn on some sites and wreck others. They compete with cookie banners, app install bars, and the primary call to action. If a reader cannot tap “next chapter” without grazing an ad, you will collect accidental clicks — the kind that look like fraud because they are.",
      "Viewability is not the same as attention. A unit can be 100% on screen and still be invisible in the sense that matters: the reader is fighting the layout. High viewability plus high bounce is a diagnostic. It usually means the unit is covering the thing they came to do.",
      "When you test layouts, change one placement at a time and keep the article text identical. If earnings move, you learned something about the layout. If you change copy, images, and ad count together, you learned nothing you can ship again.",
      "A sane density also leaves room for the network you might join later. Mediavine, Raptive, and Monumetric will rebuild ad layout for you. Shipping a page that is already saturated makes their job harder and can slow the lift you wanted from switching.",
    ],
  },
  {
    slug: "exclusive-vs-non-exclusive-networks",
    kind: "guide",
    title: "Exclusive vs non-exclusive ad networks",
    description:
      "What exclusivity actually forbids, which networks enforce it, and why “just run both for a month” is how publishers get banned.",
    minutes: 10,
    kicker: "Guide",
    paragraphs: [
      "An exclusive network is not a marketing adjective. It is a contract: while you are in the program, their code is the only ad code on the site. Running AdSense, a second header bidder, or a leftover Ezoic script alongside them is treated as a violation, not a clever test.",
      "Mediavine and Raptive are exclusive from day one. Monumetric is exclusive after a 30-day trial. Those three pay more because they are selling a clean site to advertisers. They detect other ad tags. They do not send a friendly reminder. They remove the publisher.",
      "Non-exclusive networks (AdSense, Ezoic, Media.net, Adsterra) can coexist with each other in some configurations, and still cannot be mixed casually. Two competing wrappers fighting over the same slot create blank units, duplicate bids, and policy flags that look like fraud.",
      "The dangerous moment is the switch. You get accepted to an exclusive network and leave the old script in the footer “just in case the new one is slow.” That leftover tag is enough. Remove the old code, purge the cache, load the site logged out, and view source before you celebrate.",
      "Exclusivity also forbids rotating a page between networks on a timer. That tactic shows up in product pitches as “automatic optimisation across all networks.” It is a ban. Layout testing inside one network is allowed. Cross-network rotation is not.",
      "Read the traffic unit on the application. Mediavine counts sessions, not pageviews. A site with 50,000 pageviews and a 1.4 pages-per-session rate does not have 50,000 sessions. Applying early wastes a review cycle and can leave a rejection on the file.",
      "Setup fees are not a quality signal by themselves, but they change the exit cost. Monumetric’s entry fee is real money. Combine that with exclusivity after the trial and you should be sure the site can live inside one network before you pay.",
      "If you are below every exclusive threshold, that is not a failure. Ship articles, keep density sane, and run a non-exclusive network. Crossing 10k, 50k, or 100k with a clean site is a better story than scraping in with three tag managers and a history of invalid clicks.",
    ],
  },
  {
    slug: "why-invalid-traffic-kills-publisher-accounts",
    kind: "blog",
    title: "Why invalid traffic kills publisher accounts",
    description:
      "How Google decides a click was worthless, the habits that create those clicks, and why “just testing the ad” is the most expensive sentence in publishing.",
    minutes: 8,
    kicker: "Note",
    paragraphs: [
      "Invalid traffic is any impression or click that did not come from a person with genuine interest in the advertiser. The definition is wider than bots. It includes accidental taps, stimulated clicks, and traffic you sent to a page in order to look at the ads.",
      "That last case is why a showroom cannot carry live ads. If someone opens a page to inspect a 300×250, resizes it, and clicks to see the landing page, the advertiser paid for a click with zero purchase intent. Do that at scale and the publisher account is not warned. It is closed, and unpaid earnings can be reversed.",
      "Publishers also generate invalid clicks without meaning to. A unit placed against a mobile menu, a sticky ad covering a paragraph the reader is trying to highlight, or a refresh that reloads the same ads while a user is still on the page all produce the same pattern: clicks that do not match engagement on the advertiser’s site.",
      "Asking readers to “support us by clicking an ad” is a policy violation even when it is phrased as a joke. So is clicking your own units from the office, from a VPN, or from a second device “to make sure they work.” Use the showroom for that. Use AdSense’s preview tools. Never the live unit.",
      "Auto-refresh is its own category. Reloading an ad without a new pageview manufactures impressions. Networks treat it as a form of invalid traffic. Product features that promise to “refresh underperforming units” are selling you a ban. Do not buy them. Do not build them.",
      "When Google limits an account, the public reason is often vague. The useful diagnostic is recent layout changes: new sticky units, a tag added twice, a WordPress plugin that injects extra adsbygoogle.js, a “click to test” habit during a redesign. Roll those back before you write a support thread.",
      "The commercial lesson is dull and valuable. Earnings come from readers who came for the article and happened to see an ad. Anything you do to manufacture the seeing or the clicking is a short-term number and a long-term hole. Build pages people finish. Put quiet units in conventional places. Leave them still.",
    ],
  },
  {
    slug: "choosing-ad-sizes-that-actually-fill",
    kind: "blog",
    title: "Choosing ad sizes that actually fill",
    description:
      "The fixed sizes AdSense still serves reliably, why tiny squares stay empty, and how to pick a unit from the inventory you can see.",
    minutes: 7,
    kicker: "Note",
    paragraphs: [
      "Not every rectangle in an old spec sheet still fills. The smallest fixed square that AdSense reliably serves is 200×200. Anything smaller looks tidy in a mockup and renders empty in production. Empty units train you to distrust the whole setup, so they should never be offered as an option.",
      "The sizes that still behave like inventory are 200×200, 250×250, 300×250, 336×280, 300×600, 320×100, 320×50, 728×90, 970×250, and 160×600, plus the responsive, in-article, and in-feed native formats. If a template asks for something else, change the template.",
      "300×250 remains the general-purpose in-content unit because advertisers still buy it and readers still recognize it as an ad. 336×280 is the same idea with a little more room. 728×90 is a header on desktop and a problem on a 375-pixel phone unless you let the network serve a responsive stand-in.",
      "Skyscrapers (160×600, 300×600) need a real sidebar and a long article. On a short page they push the footer off into space or get clipped. If your mobile template stacks the sidebar under the article, that skyscraper becomes a giant gap after the comments. Check the phone layout before you congratulate the desktop one.",
      "Responsive units reduce the number of decisions, which is good, and hide the number of decisions, which is not. You should still know the minimum height you reserved. Layout shift from an unreserved slot is a Core Web Vital hit and a reader hit. Reserve min-height even when the width is fluid.",
      "In-article and in-feed formats are not “extra 300×250s.” They are native layouts that expect to sit in a stream of prose or cards. Put an in-article unit in a sidebar and it will look broken. Put it between two related sections of an essay and it will look like part of the page — which is the point, as long as it is still labeled.",
      "Pick one primary size per placement and live with it long enough to learn. Swapping 728×90 for 970×250 every afternoon because a forum thread said so produces noise, not a finding. The showroom exists so you can see the shape before you touch the live site.",
    ],
  },
];

export function docsByKind(kind: EditorialKind): EditorialDoc[] {
  return EDITORIAL.filter((doc) => doc.kind === kind);
}

export function getDoc(kind: EditorialKind, slug: string): EditorialDoc | undefined {
  return EDITORIAL.find((doc) => doc.kind === kind && doc.slug === slug);
}
