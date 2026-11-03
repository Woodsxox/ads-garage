import { getTemplate, instantiateTemplate } from "@/lib/demo/templates";
import type { AdDesign } from "@/lib/studio/model";

/** Seed projects shown on first visit. Ids and dates are fixed so SSR and client agree. */
function seed(templateId: string, id: string, name: string, now: string, status: AdDesign["status"]): AdDesign {
  const template = getTemplate(templateId);
  if (!template) throw new Error(`Unknown template ${templateId}`);
  return { ...instantiateTemplate(template, { id, name, now }), status };
}

export const SEED_PROJECTS: readonly AdDesign[] = [
  seed("tpl-spring-sale", "seed-spring-sale", "Spring tune-up — medium rectangle", "2026-09-12T10:00:00.000Z", "ready"),
  seed("tpl-leaderboard", "seed-winter-leaderboard", "Winter tires — leaderboard", "2026-09-08T14:30:00.000Z", "ready"),
  seed("tpl-landscape", "seed-cold-brew", "Cold-brew — landscape link", "2026-09-03T09:15:00.000Z", "draft"),
  seed("tpl-square-promo", "seed-spin-promo", "Spin to win — square", "2026-08-27T16:45:00.000Z", "draft"),
];
