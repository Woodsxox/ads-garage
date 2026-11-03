import type { Campaign, ConnectedAccount, PlatformId } from "@/lib/domain/types";
import type { AdDesign } from "@/lib/studio/model";

/**
 * The seam between the UI and "wherever data lives".
 *
 * The frontend phase wires these to browser-storage mocks (`lib/services/mock/*`). The backend
 * phase replaces the wiring in `lib/services/index.ts` with real implementations; no component
 * should need to change.
 */

export interface ProjectsRepository {
  list(): AdDesign[];
  get(id: string): AdDesign | undefined;
  /** Resolves to false when the save only reached memory (storage full or unavailable). */
  save(design: AdDesign): boolean;
  remove(id: string): void;
  duplicate(id: string): AdDesign | undefined;
  /** Demo only: restore the seed projects. */
  reset(): void;
}

export type CampaignInput = {
  design: AdDesign;
  platformId: PlatformId;
  name: string;
  objective: Campaign["objective"];
  dailyBudget: number;
  startDate: string;
  endDate: string;
  audience: string;
};

export interface IntegrationsApi {
  /** Real implementation: OAuth consent against the platform, tokens stored server-side. */
  connect(platformId: PlatformId): Promise<ConnectedAccount>;
  disconnect(platformId: PlatformId): Promise<void>;
  /** Real implementation: validate, create the campaign through the platform API, return its state. */
  submitCampaign(input: CampaignInput): Promise<Campaign>;
  /** Demo only: clear connections and submitted campaigns. */
  reset(): void;
}
