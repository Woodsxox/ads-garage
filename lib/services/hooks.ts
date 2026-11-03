"use client";

import { useSyncExternalStore } from "react";
import type { Campaign, ConnectedAccount } from "@/lib/domain/types";
import { SEED_CAMPAIGN_LIST } from "@/lib/services/mock/integrations";
import { SEED } from "@/lib/services/mock/projects";
import { STORAGE_KEYS } from "@/lib/storage";
import type { AdDesign } from "@/lib/studio/model";
import { useStored } from "@/lib/use-stored";

export function useProjects(): AdDesign[] {
  return useStored<AdDesign[]>(STORAGE_KEYS.studioProjects, SEED)[0];
}

export function useCampaigns(): Campaign[] {
  return useStored<Campaign[]>(STORAGE_KEYS.campaigns, SEED_CAMPAIGN_LIST)[0];
}

const NO_ACCOUNTS: ConnectedAccount[] = [];
export function useAccounts(): ConnectedAccount[] {
  return useStored<ConnectedAccount[]>(STORAGE_KEYS.connectedAccounts, NO_ACCOUNTS)[0];
}

export type DemoPlan = "starter" | "pro";

/** The demo plan switch. It unlocks UI only; nothing is purchased. */
export function useDemoPlan(): [DemoPlan, (plan: DemoPlan) => void] {
  return useStored<DemoPlan>(STORAGE_KEYS.demoPlan, "starter");
}

const noop = () => () => {};

/** false during server render and hydration, true afterwards. Use to gate browser-only data. */
export function useHydrated(): boolean {
  return useSyncExternalStore(noop, () => true, () => false);
}

/** A clock that ticks every `intervalMs`. Returns 0 on the server so markup stays stable. */
export function useNow(intervalMs: number): number {
  return useSyncExternalStore(
    (onChange) => {
      const id = setInterval(onChange, intervalMs);
      return () => clearInterval(id);
    },
    () => Math.floor(Date.now() / intervalMs) * intervalMs,
    () => 0,
  );
}
