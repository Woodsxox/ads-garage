import type { PlatformId } from './platforms.js';

export type CampaignStatus = 'draft' | 'in_review' | 'approved' | 'running' | 'paused';

export interface ConnectedAccountInfo {
  accountId: string;
  accountName: string;
}

export interface CampaignSubmission {
  platformId: PlatformId;
  accountId: string;
  name: string;
  objective: string;
  dailyBudgetCents: number;
  startDate: string;
  endDate: string;
  audience: string;
}

/**
 * The seam to a real advertising platform. A real connector needs OAuth (redirect out, callback
 * back), stored tokens, and each platform's API, which differ a lot and need developer approval.
 * Those flows will change `connect` into a two-step authorize/callback pair; the mock keeps it one
 * call so everything downstream (limits, validation, storage, status) can be built and tested now.
 */
export abstract class PlatformConnector {
  /** True while this connector is a simulation. Shown to the user, never hidden. */
  abstract readonly simulated: boolean;
  abstract connect(userId: string, platformId: PlatformId): Promise<ConnectedAccountInfo>;
  abstract submitCampaign(input: CampaignSubmission): Promise<{ externalId: string }>;
  /** Current status. A real connector asks the platform; the mock derives it from elapsed time. */
  abstract statusOf(campaign: { submittedAt: Date; status: CampaignStatus }, now: Date): CampaignStatus;
}
