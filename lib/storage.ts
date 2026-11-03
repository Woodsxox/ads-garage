/**
 * Persistence seam. In-memory fallback + localStorage.
 * Swap `memory` / `browser` for a database adapter without touching callers.
 */

export type StorageAdapter = {
  get<T>(key: string, fallback: T): T;
  /** Returns true when the value reached durable browser storage. */
  set<T>(key: string, value: T): boolean;
  remove(key: string): void;
  subscribe(key: string, listener: () => void): () => void;
};

const memory = new Map<string, string>();
const parsed = new Map<string, unknown>();
const listeners = new Map<string, Set<() => void>>();

function emit(key: string) {
  const set = listeners.get(key);
  if (!set) return;
  for (const listener of set) listener();
}

function readRaw(key: string): string | null {
  if (typeof window === "undefined") {
    return memory.get(key) ?? null;
  }
  try {
    const fromBrowser = window.localStorage.getItem(key);
    if (fromBrowser !== null) return fromBrowser;
    return memory.get(key) ?? null;
  } catch {
    return memory.get(key) ?? null;
  }
}

/** Returns false when only the in-memory copy could be kept (quota / private mode). */
function writeRaw(key: string, value: string): boolean {
  memory.set(key, value);
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    // Private mode / quota — memory still holds the value for this session.
    return false;
  }
}

export const storage: StorageAdapter = {
  get<T>(key: string, fallback: T): T {
    if (parsed.has(key)) return parsed.get(key) as T;
    const raw = readRaw(key);
    if (raw === null) return fallback;
    try {
      const value = JSON.parse(raw) as T;
      parsed.set(key, value);
      return value;
    } catch {
      return fallback;
    }
  },
  set<T>(key: string, value: T): boolean {
    parsed.set(key, value);
    const durable = writeRaw(key, JSON.stringify(value));
    emit(key);
    return durable;
  },
  remove(key: string): void {
    parsed.delete(key);
    memory.delete(key);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // ignore
      }
    }
    emit(key);
  },
  subscribe(key: string, listener: () => void) {
    let set = listeners.get(key);
    if (!set) {
      set = new Set();
      listeners.set(key, set);
    }
    set.add(listener);
    return () => {
      set.delete(listener);
    };
  },
};

export const STORAGE_KEYS = {
  garageConfig: "ad-garage:garage-config",
  guidePageviews: "ad-garage:guide-pageviews",
  buildDraft: "ad-garage:build-draft",
  tier: "ad-garage:tier",
  exportCount: "ad-garage:export-count",
  layoutLibrary: "ad-garage:layout-library",
  layoutRevenue: "ad-garage:layout-revenue",
  galleryFilters: "ad-garage:gallery-filters",
  galleryView: "ad-garage:gallery-view",
  lessonProgress: "ad-garage:lesson-progress",
  studioProjects: "ad-garage:studio-projects",
  demoPlan: "ad-garage:demo-plan",
  connectedAccounts: "ad-garage:connected-accounts",
  campaigns: "ad-garage:campaigns",
  waitlist: "ad-garage:waitlist",
  navMode: "ad-garage:nav-mode",
} as const;
