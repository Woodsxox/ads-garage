# Ads Garage API

The backend for the Ads Garage web app, built with **NestJS 12**, TypeORM and PostgreSQL. It lives in `ads-backend/` next to the Next.js app and is a separate package: its own `package.json`, its own install, its own tests.

It replaces the browser-storage mocks the web app uses today (`lib/services/mock/*`). The API shapes were chosen so that swap is mechanical. See [Connecting the web app](#connecting-the-web-app).

## Quick start

```bash
cd ads-backend
cp .env.example .env
npm install
npm run start:dev
```

- API: <http://localhost:4000/api/v1> — health check at `/api/v1/health`
- Interactive docs (Swagger): <http://localhost:4000/docs>

With no configuration it uses a local SQLite file (`data/ads-garage.sqlite`) and creates the tables itself, so there is nothing else to install. It needs **Node 22.12 or newer**.

To run on PostgreSQL instead:

```bash
docker compose up -d db
# in .env:  DATABASE_URL=postgres://ads_garage:ads_garage@localhost:5432/ads_garage
npm run start:dev
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run start:dev` | Run with file watching |
| `npm run build` / `npm run start:prod` | Compile to `dist/`, run the compiled app |
| `npm test` | Unit tests (pure logic, no database) |
| `npm run test:e2e` | End-to-end tests: the whole app over HTTP against an in-memory database |
| `npm run lint` / `npm run typecheck` | Oxlint / TypeScript |
| `npm run migration:generate -- src/database/migrations/Name` | Generate a Postgres migration from the entities |
| `npm run migration:run` / `migration:revert` / `migration:show` | Apply, undo, list migrations |

## What is in it

| Module | Routes (all under `/api/v1`) | Notes |
| --- | --- | --- |
| **auth** | `POST /auth/register`, `login`, `refresh`, `logout` | JWT access tokens (15 min) plus single-use rotating refresh tokens |
| **users** | `GET/PATCH/DELETE /users/me` | Delete needs the password and cascades to everything the user owns |
| **plans** | `GET /plans`, `GET /plans/me` | The server-side source of truth for what each plan allows |
| **billing** | `POST /billing/checkout`, `portal`, `webhook` | Stripe, behind a `BillingProvider` interface |
| **projects** | `GET/POST /projects`, `GET/PUT/DELETE /projects/:id`, `POST /projects/:id/duplicate` | Ad designs, strictly validated, private to their owner |
| **learning** | `GET /learning/lessons`, `PUT .../progress`, `POST .../submit`, `GET /learning/badges` | Exercises are graded on the server; passing earns badges |
| **ai** | `GET /ai/models`, `GET /ai/usage`, `POST /ai/copy` | Plan-gated models and monthly credit metering. **The provider is a mock** |
| **integrations** | `GET /integrations/platforms`, `accounts`, `campaigns`, connect/submit | Pro plan. **The connector is a simulation** |
| **health** | `GET /health` | Liveness plus a database round trip |

Every route requires a bearer token unless it is marked `@Public()`. Errors all share one shape: `{ statusCode, error, message, code?, details?, requestId, path, timestamp }`. Branch on `code` (for example `PLAN_REQUIRED`, `PROJECT_LIMIT_REACHED`, `AI_QUOTA_EXCEEDED`), not on message text.

## How the important parts work

**Authentication.** Passwords are hashed with Node's built-in `scrypt` (no native module). Access tokens are short-lived and checked by signature only. Refresh tokens are `id.secret`, stored as a SHA-256 hash, and **single use**: each refresh revokes the old token. Presenting a token that was already used is treated as theft and revokes every session for that user. Login takes the same time and returns the same error whether or not the email exists.

**Plans and entitlements.** `src/plans/plan-catalog.ts` defines Starter, Pro and Ultra and their limits. `EntitlementsService` answers "what may this user do?" from the `subscriptions` table, and a lapsed subscription means Starter. Controllers use `@RequirePlan('pro')`, which re-checks the database on every call. Nothing about a plan is ever read from the client. The numbers in the catalog are **placeholders**: pricing and limits are product decisions that have not been made.

**Billing.** The only thing that changes a user's plan is a **verified payment webhook**. Checkout just returns a URL. The webhook endpoint verifies Stripe's signature against the raw request body, ignores events it has already seen, and ignores events older than what is stored (providers do not guarantee ordering). `past_due` keeps access as a grace period; `canceled` and `unpaid` end it. Without Stripe configured the API still runs: checkout answers `503` and everyone is on Starter.

To try billing locally with the Stripe CLI:

```bash
stripe listen --forward-to localhost:4000/api/v1/billing/webhook   # prints the whsec_ secret
# set STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_PRO in .env
```

**Projects.** The API stores and returns exactly the `AdDesign` shape the editor uses. Every design passes `validateDesign` (`src/projects/design.validator.ts`) before it is stored: hex-only colors, `http(s)`-only button links, an allow-listed image data URL under a size cap, unique element ids, a canvas that matches its named format, and unknown keys stripped. Plans cap the number of saved designs and gate the Pro-only formats on the server. Someone else's project returns `404`, never `403`.

**Learning.** Answer keys live in `src/learning/lesson-catalog.ts` and are never sent to the client. A test compares that file with the web app's `lib/demo/lessons.ts` and fails if they drift.

**AI.** Credits are reserved in a transaction **before** the provider is called and refunded if it fails, so parallel requests cannot overspend and a provider error never costs the user. A test fires 60 parallel requests at a 50-credit allowance and expects exactly 50 to succeed. Swap `MockAiProvider` for a real one in `ai.module.ts`; nothing else changes.

**Integrations.** `PlatformConnector` is the seam to real ad platforms. `MockPlatformConnector` simulates every platform, marks everything `simulated: true`, and never publishes anything. The platform creative specs in `src/integrations/platforms.ts` are **unverified placeholders**, as in the web app.

## Database

PostgreSQL is the real database. SQLite exists so the API starts and tests with no setup, and the entities use only column types both support. **In production** the app refuses SQLite and refuses `DATABASE_SYNCHRONIZE=true`; schema changes go through migrations:

```bash
# once, against a real Postgres (the initial migration)
npm run migration:generate -- src/database/migrations/Init
npm run migration:run
```

Always generate migrations against Postgres, not SQLite: the SQL is different. Add every new entity to `src/database/entities.ts`.

## Configuration

All settings are validated at startup, and a bad configuration fails fast with the full list of problems. See `.env.example` for every variable. The ones that matter most: `JWT_ACCESS_SECRET` (32+ characters, required in production), `DATABASE_URL`, `APP_URL` / `CORS_ORIGINS`, `TRUST_PROXY` (set when behind a proxy), and the three `STRIPE_*` values.

## Testing

- **Unit tests** cover the pure logic: design validation, grading, config, password hashing, platform checks.
- **E2E tests** boot the real app (same pipes, filters and prefix as production) against an in-memory database. They include genuine Stripe signature verification, token-reuse detection, ownership checks and the concurrency test above.

## Connecting the web app

The web app calls its data through two interfaces in `lib/services/contracts.ts`. To switch it to this API:

1. Add a fetch-based `ProjectsRepository` and `IntegrationsApi`, and point `lib/services/index.ts` at them. The project and campaign response shapes match `AdDesign` and `Campaign`. The two contracts are synchronous today and will need to become `async`.
2. Replace `useStored`-backed hooks with data fetching. Plan and entitlement checks must read `GET /plans/me`.
3. Retire the old Stripe routes (`app/api/checkout`, `app/api/billing`) and the query-string tier unlock in `app/pricing/success`. This API replaces them.
4. Store the access token in memory and the refresh token somewhere you are comfortable with. The API returns both in the response body; moving the refresh token to an `HttpOnly` cookie is a reasonable hardening step.

## Not built yet

Be aware of these before launch:

- **Email verification and password reset** (needs an email provider).
- **A real AI provider**, and image/video generation. The metering and gating are real; the model output is not.
- **Real ad-platform connectors** (OAuth, tokens, per-platform APIs). Everything under integrations is simulated.
- **Object storage for images.** Designs embed images as data URLs, capped at about 2 MB each.
- **Admin tools** (the `Roles` guard exists; no admin routes do).
- **Scheduled jobs**, for example `AuthService.purgeExpired()` for old refresh tokens.
- **Optimistic concurrency on design saves.** Two tabs saving the same design: the last write wins.
- **The PostgreSQL path and the Docker files are untested.** Everything was run against SQLite. The Postgres-specific code is the connection options, the user-row lock in AI reservation, and the migration flow.

## Adding a module

Create `src/<name>/` with an entity, a service, a controller and a module. Register the entity in `src/database/entities.ts` and the module in `src/app.module.ts`. Use `@RequirePlan()` for plan-gated routes (import `PlansModule`), `@CurrentUser()` for the caller, and `@Public()` only when a route truly must be open. Add an e2e test that covers the unhappy paths: unauthenticated, someone else's data, over the plan limit.
