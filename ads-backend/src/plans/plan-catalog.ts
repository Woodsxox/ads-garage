export type PlanId = 'starter' | 'pro' | 'ultra';

export const PLAN_IDS: readonly PlanId[] = ['starter', 'pro', 'ultra'];

export interface PlanLimits {
  /** Saved ad designs. */
  maxProjects: number;
  /** Studio formats flagged `pro` (half page, billboard, story, video poster). */
  proFormats: boolean;
  /** AI credits per calendar month. One credit is roughly one cheap text generation. */
  aiCreditsPerMonth: number;
  /** May connect ad platforms and submit campaigns. */
  publishing: boolean;
  maxConnectedAccounts: number;
}

export interface PlanDefinition {
  id: PlanId;
  name: string;
  /** Higher means more access. Used for "this plan or better" checks. */
  rank: number;
  /** Shown as "coming soon" in the web app until it can be purchased. */
  comingSoon: boolean;
  limits: PlanLimits;
}

/**
 * The server-side source of truth for what each plan allows. The web app's plan page
 * (`lib/demo/plans.ts`) is marketing copy; this file is what is actually enforced.
 *
 * The numbers are placeholders: pricing and limits are product decisions still to be made.
 */
export const PLAN_CATALOG: Record<PlanId, PlanDefinition> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    rank: 0,
    comingSoon: false,
    limits: { maxProjects: 10, proFormats: false, aiCreditsPerMonth: 50, publishing: false, maxConnectedAccounts: 0 },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    rank: 1,
    comingSoon: false,
    limits: { maxProjects: 100, proFormats: true, aiCreditsPerMonth: 500, publishing: true, maxConnectedAccounts: 4 },
  },
  ultra: {
    id: 'ultra',
    name: 'Ultra',
    rank: 2,
    comingSoon: true,
    limits: { maxProjects: 1000, proFormats: true, aiCreditsPerMonth: 5000, publishing: true, maxConnectedAccounts: 10 },
  },
};

export const isPlanId = (value: unknown): value is PlanId =>
  typeof value === 'string' && (PLAN_IDS as readonly string[]).includes(value);

/** True when `plan` is `required` or a higher tier. */
export const planAtLeast = (plan: PlanId, required: PlanId): boolean =>
  PLAN_CATALOG[plan].rank >= PLAN_CATALOG[required].rank;
