# Ad Garage

**Frontend demo phase.** Ad Garage is now an ad playground: a gallery of ad formats, a sandboxed viewer, lessons, a creation studio, saved projects, an integrations preview and plans. Everything runs on mock data in the browser. See [docs/frontend-phase-handoff.md](docs/frontend-phase-handoff.md) for the route map, architecture and what the backend phase needs.

The original publisher tooling is still here: a Next.js service bay for ad layouts: a **showroom** of mock formats, a **creator** that exports deployable snippets, and **editorial** routes that are the only place live AdSense units may appear.

## Backend

The NestJS API lives in [`ads-backend/`](ads-backend/README.md): auth, plans and Stripe billing, saved designs, server-graded lessons, plan-gated AI credits (mock provider) and simulated integrations. It is a separate package with its own install and tests. The web app does not call it yet; `ads-backend/README.md` explains how to connect them.

```bash
cd ads-backend && cp .env.example .env && npm install && npm run start:dev   # http://localhost:4000/docs
```

## Design system

The UI is dark and minimal, after the two reference sites (a dark home with side columns and big type; a tile-wall gallery with mono labels and pill controls). Everything hangs off a few tokens in `app/globals.css`: `bay-floor` (page), `bay-wall` (raised surface), `chalk` (text), `hazard` (the accent, currently green), `torque` (positive), `flag` (warning). Change a value there and the whole site follows. Fonts are free stand-ins for the references' licensed ones: Inter Tight and Geist Mono (`app/layout.tsx`). Controls are pills (`components/ui/Button.tsx`); the shell is `components/chrome/` (top bar, floating pill nav, menu overlay, once-per-session loader, footer).

The gallery's default view is a 3D wall (`components/gallery/GalleryWall.tsx`, Three.js): an endless, fisheye-curved grid of tiles you drag, with inertia, hover and click-to-open. Each tile is a canvas texture; ads in the animated formats (video, carousel, gamified) play a recorded loop on the few tiles nearest the centre. The posters and loops live in `public/gallery/` and are generated, not hand-made: with the site running, `npm run gallery:assets` drives every demo ad through its real behaviour in headless Chromium and records it (rerun it, and commit the output, when ads change; for clean output run it against a production build started with `ASSET_RENDER=1`, since the dev server draws a corner badge). Reduced-motion visitors and browsers without WebGL get the grid instead. `next.config.ts` hides Next's dev corner badge because it sat on top of the gallery's floating controls; remove that line to get it back.

Page transitions (`components/chrome/PageTransition.tsx`): moving between pages runs a pixel-block glitch. Blocks fill the screen, the page changes underneath, then the blocks dissolve to reveal it. It listens for clicks on ordinary links, so no link needs changing; code that navigates by itself must use `useTransitionRouter().push` instead of `router.push`. The browser's back and forward buttons also run it, but the browser swaps the page at once and cannot be delayed, so there the blocks snap on and then dissolve. It skips same-page and hash links, new-tab and modified clicks, downloads, external links and anything marked `data-no-transition`, and does nothing for reduced-motion visitors. The blocks use the site's own colours, read from the colour tokens in `globals.css` when a transition starts (greys mixed toward the page background, and a deep green from the accent), so changing the tokens changes the transition. Cell size and block mix live in `components/chrome/transition/pixel-field.ts`, and the timing in the two `*_MS` constants at the top of `PageTransition.tsx`.

Motion: GSAP (`lib/gsap-client.ts`) for text reveals, Lenis for slow, smooth scroll on every page (`components/chrome/SmoothScroll.tsx`; wheel-driven widgets carry `data-lenis-prevent`), and CSS-only marquees (`components/home/Marquee.tsx`). All of it stops for `prefers-reduced-motion`.

## Rules this repo enforces

1. Live ads are real inventory and appear only on the routes in `lib/ads/policy.ts`: `/`, `/gallery`, `/guide`, `/blog`. Never in the sandbox, studio, lessons, `/gallery/[id]`, `/garage` or `/build`.
2. On `/` and `/gallery` a live ad sits in `SponsoredSlot`, a labelled placement outside every card and demo (the home page has two still side-column slots and a banner; on the gallery it shows in the grid and list views, and the 3D wall carries none, because an ad is an iframe and cannot be drawn into a WebGL scene). Real ads never move; only demo tiles do, and they are always labelled "Demo". Demo ads are never paid.
3. Only the files listed in `scripts/check-ad-isolation.mjs` may import `RealAd`, `SponsoredSlot` or `AdSenseLoader`. `npm run check:ads` and ESLint both enforce it, and the script also fails if `adsbygoogle` appears in any demo or creation code.
4. `RealAd` throws in development if mounted off-policy. It is never animated.
5. The adsbygoogle script is loaded by `AdSenseLoader`, mounted once in `app/layout.tsx`, and only on policy routes once a real publisher ID is set. Keep **Auto ads turned off** in the AdSense account: a loaded script stays loaded during client-side navigation.
6. Smallest fixed square offered is 200×200.

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Paste a real `NEXT_PUBLIC_ADSENSE_CLIENT` before expecting units to fill on `/`, `/gallery`, `/guide` and `/blog`. Until then no ad script loads and no unit renders. Leave the showroom alone — it must stay mock.

Stripe: create a $7.99 one-time price and a $24/mo price, then set `STRIPE_SECRET_KEY`, `STRIPE_PRICE_EXPORT`, and `STRIPE_PRICE_PRO`. Until those exist, `/pricing` returns a 501 from Checkout; in development the page also has test unlocks.

## Scripts

- `npm run dev` — local server
- `npm run build` — production build
- `npm run lint` — ESLint plus the ad-isolation check
- `npm run check:ads` — isolation check only
