import { STORAGE_KEYS, storage } from "@/lib/storage";

export type TierId = "inspector" | "single" | "pro";

export const TIER_COPY = {
  inspector: {
    name: "Inspector",
    price: "Free",
    blurb: "Full showroom, full guide, unlimited previews. No export.",
  },
  single: {
    name: "Single Export",
    price: "$7.99",
    blurb: "One deployable layout bundle. Primary revenue line.",
  },
  pro: {
    name: "Garage Pro",
    price: "$24/mo",
    blurb: "Unlimited exports, saved layouts, A/B inside one network.",
  },
} as const;

export function getTier(): TierId {
  return storage.get<TierId>(STORAGE_KEYS.tier, "inspector");
}

export function setTier(tier: TierId): void {
  storage.set(STORAGE_KEYS.tier, tier);
}

export function getExportCount(): number {
  return storage.get<number>(STORAGE_KEYS.exportCount, 0);
}

export function recordExport(): void {
  storage.set(STORAGE_KEYS.exportCount, getExportCount() + 1);
}

export function canExport(): { ok: true } | { ok: false; reason: string } {
  const tier = getTier();
  if (tier === "pro") return { ok: true };
  if (tier === "single") {
    if (getExportCount() >= 1) {
      return {
        ok: false,
        reason: "Single Export is used. Upgrade to Garage Pro for unlimited exports.",
      };
    }
    return { ok: true };
  }
  return {
    ok: false,
    reason: "Inspector includes previews only. Unlock a Single Export to download the bundle.",
  };
}

export function isPro(): boolean {
  return getTier() === "pro";
}
