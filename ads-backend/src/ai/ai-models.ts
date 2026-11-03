import type { PlanId } from '../plans/plan-catalog.js';

export type AiKind = 'copy';

export interface AiModel {
  id: string;
  label: string;
  description: string;
  kind: AiKind;
  /** The lowest plan that may use it. */
  minPlan: PlanId;
  /** Credits one request costs. A plan's monthly allowance is measured in these. */
  creditCost: number;
  /** Which provider implementation serves it. */
  provider: 'mock';
}

/**
 * The model catalog. Real model ids, prices and licensing are chosen when a provider is wired in
 * (cost, speed, commercial-use rights and API availability all matter). Until then every entry
 * is served by the deterministic mock provider, so the plan gating and metering are real and the
 * output is not. Image and video models will be new `kind`s here.
 */
export const AI_MODELS: readonly AiModel[] = [
  {
    id: 'garage-draft',
    label: 'Draft',
    description: 'Fast, low-cost copy ideas for headlines and short body text.',
    kind: 'copy',
    minPlan: 'starter',
    creditCost: 1,
    provider: 'mock',
  },
  {
    id: 'garage-studio',
    label: 'Studio',
    description: 'Stronger copy with more variety and tone control.',
    kind: 'copy',
    minPlan: 'pro',
    creditCost: 2,
    provider: 'mock',
  },
  {
    id: 'garage-ultra',
    label: 'Ultra',
    description: 'The most capable copy model, for polished campaign variations.',
    kind: 'copy',
    minPlan: 'ultra',
    creditCost: 4,
    provider: 'mock',
  },
];

export const findModel = (id: string): AiModel | undefined => AI_MODELS.find((m) => m.id === id);

/** Best model the plan may use, which is the default when a request does not name one. */
export function defaultModelFor(planRank: (plan: PlanId) => number, plan: PlanId): AiModel {
  const allowed = AI_MODELS.filter((m) => planRank(m.minPlan) <= planRank(plan));
  return allowed[allowed.length - 1] ?? AI_MODELS[0];
}
