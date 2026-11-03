import { SEED_CAMPAIGNS } from "@/lib/demo/campaigns";
import { getPlatform } from "@/lib/demo/platforms";
import type { Campaign, CampaignStatus, ConnectedAccount, PlatformId } from "@/lib/domain/types";
import type { CampaignInput, IntegrationsApi } from "@/lib/services/contracts";
import { STORAGE_KEYS, storage } from "@/lib/storage";

export const SEED_CAMPAIGN_LIST: Campaign[] = [...SEED_CAMPAIGNS];

const FAKE_ACCOUNTS: Record<PlatformId, { id: string; name: string }> = {
  "google-ads": { id: "482-190-7731", name: "Garage Demo Advertiser" },
  youtube: { id: "UC-demo-0412", name: "Garage Demo Channel" },
  tiktok: { id: "7312-0099-41", name: "Garage Demo Business" },
  meta: { id: "act_1048829105", name: "Garage Demo Ad Account" },
};

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Simulated review timeline for campaigns submitted in the demo. */
const REVIEW_MS = 8000;
const APPROVED_MS = 16000;

export function deriveStatus(campaign: Campaign, nowMs: number): CampaignStatus {
  if (!campaign.simulated || !campaign.submittedAt) return campaign.status;
  const elapsed = nowMs - Date.parse(campaign.submittedAt);
  if (elapsed < REVIEW_MS) return "in_review";
  if (elapsed < APPROVED_MS) return "approved";
  return "running";
}

export const mockIntegrations: IntegrationsApi = {
  async connect(platformId) {
    await wait(900);
    const platform = getPlatform(platformId);
    if (!platform) throw new Error(`Unknown platform ${platformId}`);
    const fake = FAKE_ACCOUNTS[platformId];
    const account: ConnectedAccount = {
      platformId,
      accountName: fake.name,
      accountId: fake.id,
      connectedAt: new Date().toISOString(),
    };
    const rest = storage.get<ConnectedAccount[]>(STORAGE_KEYS.connectedAccounts, []).filter((a) => a.platformId !== platformId);
    storage.set(STORAGE_KEYS.connectedAccounts, [account, ...rest]);
    return account;
  },
  async disconnect(platformId) {
    await wait(300);
    storage.set(
      STORAGE_KEYS.connectedAccounts,
      storage.get<ConnectedAccount[]>(STORAGE_KEYS.connectedAccounts, []).filter((a) => a.platformId !== platformId),
    );
  },
  async submitCampaign(input: CampaignInput) {
    await wait(1200);
    const campaign: Campaign = {
      id: `cmp-${crypto.randomUUID().slice(0, 8)}`,
      name: input.name,
      platformId: input.platformId,
      designId: input.design.id,
      designName: input.design.name,
      objective: input.objective,
      dailyBudget: input.dailyBudget,
      startDate: input.startDate,
      endDate: input.endDate,
      audience: input.audience,
      status: "in_review",
      submittedAt: new Date().toISOString(),
      simulated: true,
    };
    storage.set(STORAGE_KEYS.campaigns, [campaign, ...storage.get<Campaign[]>(STORAGE_KEYS.campaigns, SEED_CAMPAIGN_LIST)]);
    return campaign;
  },
  reset() {
    storage.remove(STORAGE_KEYS.connectedAccounts);
    storage.remove(STORAGE_KEYS.campaigns);
  },
};
