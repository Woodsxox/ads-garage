# Frontend phase: handoff

Status of the Ads Garage frontend demo, how it is built, and what the backend phase must supply.

Everything below runs on mock data in the browser. No account, payment, OAuth or ad-platform call exists yet.

## Route map

| Route | Section | What it does |
| --- | --- | --- |
| `/` | Home | Hero with four live sandboxed ads, format strip, state explainer, previews of each bay, plans teaser |
| `/gallery` | Gallery | 18 demo ads in 7 formats (image, banner, video, clickable, carousel, gamified, native), plus one labelled sponsored slot; filter by format, state, search; filters persist. Deep links: `?format=`, `?state=`, `?q=` |
| `/gallery/[id]` | Preview (learning ads) | Sandboxed live demo, anatomy, design notes, source, specs, message log |
| `/sandbox` | Sandbox lobby | Sandbox and active ads, plus how the isolation works |
| `/sandbox/[id]` | Viewer | Browser-style viewer with history, timer, required actions, gated next step |
| `/learn`, `/learn/[slug]` | Learn | 5 lessons: explain, explore (interactive), exercise (feedback). Progress persists |
| `/create` | Create Ad | Template picker, then the editor. `?template=` and `?project=` deep links |
| `/projects` | My Ads | Saved designs: search, filter, sort, edit, duplicate, export, delete, reset |
| `/integrations` | Integrations | Platform cards, simulated connect, 5-step publish wizard, campaign status table |
| `/plans` | Plans | Starter / Pro / Ultra with Available / Demo preview / Planned labels |
| `/pricing` | (redirect) | Redirects to `/plans` |

Existing routes `/garage`, `/build`, `/guide`, `/blog` are unchanged and linked from the footer under "Publisher tools".

## How an ad is handled by state

`lib/domain/meta.ts` (`adHref`) is the single place that decides what opening an ad does:

- **learning** opens `/gallery/[id]` (inspect and learn)
- **sandbox** opens `/sandbox/[id]` (free play)
- **active** opens `/sandbox/[id]` with a duration and required actions; the lesson button stays locked until both are met
- **inactive** opens an explainer modal; direct URLs redirect to `/gallery`

## The sandbox is real isolation

Each ad is a self-contained HTML document (`lib/ads/ad-document.ts`) loaded with
`<iframe sandbox="allow-scripts" srcdoc>` and **no** `allow-same-origin`. Verified in Chrome:

- the ad's origin is `null`; reading `window.parent.document` throws a `SecurityError`
- `localStorage` access throws; `fetch()` is refused by the document's `default-src 'none'` CSP
- the only channel out is `postMessage`; the viewer accepts only messages from that exact frame and only the shape in `isAdMessage`
- destinations are handled by the viewer, never by the ad. Mock landing pages use the reserved `.example` TLD
- external pages load only if flagged `embeddable`, on `https`, and on the host allow-list in `lib/ads/embed.ts`, with `sandbox="allow-scripts allow-forms"` and `referrerpolicy="no-referrer"`. Otherwise the viewer shows a fallback and an "open in new tab" link. The viewer does not try to detect `X-Frame-Options`; embeddability is decided by review, not probing

Viewing time counts only while the ad itself is showing and the tab is visible. The demo timer can be changed or skipped for review. The UI states that nothing here is a paid impression and no revenue is shown.

## Where mock ends and backend begins

```
lib/domain/    types and display metadata (no data, no I/O)
lib/demo/      fixtures: ads, lessons, templates, platforms, plans, campaigns, seed projects
lib/services/
  contracts.ts   ProjectsRepository, IntegrationsApi (what the backend must implement)
  mock/          browser-storage implementations
  index.ts       THE wiring file: swap mock for real here
  hooks.ts       React bindings (useProjects, useCampaigns, useAccounts, useDemoPlan, ...)
lib/studio/    pure logic: model, codegen, raster (PNG), validate, color
```

Backend phase: implement the two contracts, change the two exports in `lib/services/index.ts`, and replace the localStorage-backed hooks with fetch-backed ones. Components call services and hooks, not storage.

## Remaining dependencies (needed before the next phase)

**Product decisions**
- Pricing for Starter and Pro (the UI says "Pricing at launch"). Ultra stays "Coming soon".
- Whether `/pricing/success` and the old Stripe tiers (`lib/tier.ts`, `/api/checkout`, `/api/billing`, `components/pricing/PricingTiers.tsx`) are retired or rebuilt for Starter/Pro. They are now unreachable from the UI but still in the repo.
- Reference images / design files: none were in the repository, so the work follows the existing "service bay" design language. Share the references and I will reconcile.

**Backend**
- Accounts and a database (projects, plan, connected accounts, campaigns).
- Subscription processing and server-side entitlement. The old success page unlocked tiers from a query string; do not carry that over.
- Server-side header enforcement for the viewer (CSP `frame-src`, `frame-ancestors`) and a server-held embed allow-list.
- Image upload moves from data URLs in localStorage to object storage with size and type validation.

**Advertising platforms (must be verified, not assumed)**
- The creative specs and capability levels in `lib/demo/platforms.ts` are illustrative placeholders. Verify each against the platform's current API docs before any Pro/Ultra claim.
- Typical prerequisites to plan for: developer/API access approval, OAuth consent from the advertiser, billing on the advertiser account, app review for some platforms. Video platforms need the video file prepared and uploaded outside the studio.
- Decide per platform what is genuinely publishable by a third-party app. The Integrations UI labels capability as Likely / Limited / Unverified for this reason.

## Known limitations of this phase

- Saved designs, lesson progress, connections and campaigns live in this browser only. Storage-full is detected and surfaced in the studio.
- Studio: system fonts only; no custom sizes; no inline canvas text editing (edit in the inspector); no video upload (video templates are poster frames).
- The simulated campaign review runs on a timer (8s in review, 16s approved, then running).
- The existing root layout loads the AdSense script on every route (see below).

## Live ads: resolved policy

Resolved in the product-definition update. `lib/ads/policy.ts` lists where live units may appear (`/`, `/gallery`, `/guide`, `/blog`). `AdSenseLoader` loads `adsbygoogle.js` only there and only once a real publisher ID is set; `SponsoredSlot` is the labelled placement on the home page and gallery; `RealAd` throws in development off-policy. `scripts/check-ad-isolation.mjs` and ESLint restrict which files may import these, and the script fails if `adsbygoogle` appears in demo or creation code (now including `components/**`).

Still to do outside the code: turn **Auto ads off** in the AdSense account (a loaded script stays loaded across client-side navigation), and review AdSense program policies for placements next to ad-like demo content before launch. Neither has been verified here.

## UI redesign

The whole UI was restyled to a dark, minimal system (see "Design system" in the README): new tokens and fonts, a top bar with a floating pill nav and menu overlay, a once-per-session loader, a new home page and a tile-wall gallery with grid and list views and a filter sheet. Pages not redesigned individually (studio, lessons, plans, integrations, the publisher tools) re-skin through the tokens and were checked for layout at desktop and phone widths.

The gallery's default view is now the **3D curved wall** (phantom-style, built with Three.js), with grid and list views alongside. Its curvature and drag feel were tuned from a screenshot and the reference site's code, not from the reference videos, which never arrived, so treat the exact feel as a first pass. Real ads stay in still, labelled 2D slots and can never be part of a WebGL scene, so the wall view has no sponsored slot; the grid and list views do. Inner pages (sandbox, learn, create, projects, integrations, plans, notes, ad preview) share one tile language: hairline grids, pill tags and large page titles.

## Backend: now started

A NestJS API now exists in `ads-backend/` (see `ads-backend/README.md`). It implements the two contracts in `lib/services/contracts.ts` as HTTP endpoints, plus server-side entitlements, Stripe billing with verified webhooks, strict design validation, server-graded lessons, plan-gated AI credit metering (mock provider) and simulated integrations. **The web app is not connected to it yet.** The remaining front-end work is a fetch-based `ProjectsRepository`/`IntegrationsApi`, making those contracts `async`, replacing the `useStored` hooks, and retiring the old Stripe routes and query-string tier unlock.

## Not built yet (from the product definition)

A real AI provider (the API has gated, metered endpoints backed by a mock); email verification and password reset; connecting the web app to the API; lesson scoring UI, badges UI and voice narration (the API grades and awards); Sandbox Demo/Live project modes; video and interactive elements in the studio; real platform integrations and campaign management; partner revenue.

## Verification

Run against a production build in Chrome:
- 16 routes render with no console or hydration errors; redirects and 404s behave
- 59 interaction checks: gallery filters and per-state behaviour, sandbox gating (time alone does not unlock; the required click does), video and game completion, external embed and fallback, lesson flow, studio edit / drag / undo / save / reload / export (PNG, HTML, JSON, ZIP), projects CRUD, integration wizard and status progression, plans and the demo switch
- No horizontal overflow at 390px on any route

`npm run lint`, `tsc --noEmit` and `next build` pass.
