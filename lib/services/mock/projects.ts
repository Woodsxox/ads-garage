import { SEED_PROJECTS } from "@/lib/demo/projects";
import type { ProjectsRepository } from "@/lib/services/contracts";
import { STORAGE_KEYS, storage } from "@/lib/storage";
import { type AdDesign, cloneDesign, newDesignId } from "@/lib/studio/model";

export const SEED: AdDesign[] = [...SEED_PROJECTS];

function read(): AdDesign[] {
  return storage.get<AdDesign[]>(STORAGE_KEYS.studioProjects, SEED);
}

export const localProjects: ProjectsRepository = {
  list: read,
  get: (id) => read().find((p) => p.id === id),
  save(design) {
    const next = { ...design, updatedAt: new Date().toISOString() };
    const list = read();
    const exists = list.some((p) => p.id === next.id);
    return storage.set(
      STORAGE_KEYS.studioProjects,
      exists ? list.map((p) => (p.id === next.id ? next : p)) : [next, ...list],
    );
  },
  remove(id) {
    storage.set(
      STORAGE_KEYS.studioProjects,
      read().filter((p) => p.id !== id),
    );
  },
  duplicate(id) {
    const source = read().find((p) => p.id === id);
    if (!source) return undefined;
    const now = new Date().toISOString();
    const copy: AdDesign = {
      ...cloneDesign(source),
      id: newDesignId(),
      name: `${source.name} (copy)`,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    };
    storage.set(STORAGE_KEYS.studioProjects, [copy, ...read()]);
    return copy;
  },
  reset() {
    storage.remove(STORAGE_KEYS.studioProjects);
  },
};
