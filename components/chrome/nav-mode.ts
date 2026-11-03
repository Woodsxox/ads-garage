"use client";

import { STORAGE_KEYS } from "@/lib/storage";
import { useStored } from "@/lib/use-stored";

/** Where the section links live: in the top bar, or in the floating pill at the bottom. */
export type NavMode = "top" | "bottom";

export function useNavMode(): [NavMode, (mode: NavMode) => void] {
  return useStored<NavMode>(STORAGE_KEYS.navMode, "top");
}
