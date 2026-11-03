"use client";

import { useCallback, useSyncExternalStore } from "react";
import { storage } from "@/lib/storage";

export function useStored<T>(key: string, fallback: T): [T, (value: T) => void] {
  const subscribe = useCallback(
    (onStoreChange: () => void) => storage.subscribe(key, onStoreChange),
    [key],
  );

  const getSnapshot = () => storage.get(key, fallback);
  const value = useSyncExternalStore(subscribe, getSnapshot, () => fallback);

  const setValue = (next: T) => {
    storage.set(key, next);
  };

  return [value, setValue];
}
