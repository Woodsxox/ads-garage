import { randomUUID } from 'node:crypto';
import { type CampaignStatus, type CampaignSubmission, type ConnectedAccountInfo, PlatformConnector } from './platform-connector.js';
import type { PlatformId } from './platforms.js';

const DEMO_ACCOUNTS: Record<PlatformId, ConnectedAccountInfo> = {
  'google-ads': { accountId: '482-190-7731', accountName: 'Garage Demo Advertiser' },
  youtube: { accountId: 'UC-demo-0412', accountName: 'Garage Demo Channel' },
  tiktok: { accountId: '7312-0099-41', accountName: 'Garage Demo Business' },
  meta: { accountId: 'act_1048829105', accountName: 'Garage Demo Ad Account' },
};

/** Simulated review timeline, matching the web app's demo: in review, then approved, then running. */
export const REVIEW_MS = 8_000;
export const APPROVED_MS = 16_000;

/** Pretends to be every platform. No network, no real account, nothing is ever published. */
export class MockPlatformConnector extends PlatformConnector {
  readonly simulated = true;

  async connect(_userId: string, platformId: PlatformId): Promise<ConnectedAccountInfo> {
    return DEMO_ACCOUNTS[platformId];
  }

  async submitCampaign(_input: CampaignSubmission): Promise<{ externalId: string }> {
    return { externalId: `mock-${randomUUID().slice(0, 8)}` };
  }

  statusOf(campaign: { submittedAt: Date; status: CampaignStatus }, now: Date): CampaignStatus {
    const elapsed = now.getTime() - campaign.submittedAt.getTime();
    if (elapsed < REVIEW_MS) return 'in_review';
    if (elapsed < APPROVED_MS) return 'approved';
    return 'running';
  }
}
