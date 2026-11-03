import {
  type AdDesign,
  type Background,
  type DesignElement,
  createElement as el,
  getStudioFormat,
  makeIds,
} from "@/lib/studio/model";

export type StudioTemplate = {
  id: string;
  name: string;
  description: string;
  formatId: string;
  /** Pro templates are unlocked by the demo plan switch only. */
  pro: boolean;
  tags: string[];
  /** Swatch used by the picker. */
  swatch: [string, string];
  build: (nextId: () => string) => { background: Background; elements: DesignElement[] };
};

const grad = (from: string, to: string, angle = 145): Background => ({ kind: "gradient", from, to, angle });

export const TEMPLATES: readonly StudioTemplate[] = [
  {
    id: "tpl-spring-sale",
    name: "Spring sale",
    description: "A classic offer unit: badge, headline, supporting line, hero visual and one button.",
    formatId: "300x250",
    pro: false,
    tags: ["Image", "Offer"],
    swatch: ["#2F4A3A", "#16241B"],
    build: (id) => ({
      background: grad("#2F4A3A", "#16241B"),
      elements: [
        el("shape", id(), { name: "Badge", x: 16, y: 16, w: 78, h: 22, fill: "#8FD1A9", radius: 3 }),
        el("text", id(), { name: "Badge text", x: 16, y: 20, w: 78, h: 16, text: "20% OFF", fontSize: 12, weight: 900, color: "#16241B", align: "center", font: "mono" }),
        el("text", id(), { name: "Headline", x: 16, y: 52, w: 170, h: 84, text: "Spring tune-up sale", fontSize: 28, weight: 900, color: "#F3F1EA", font: "sans", lineHeight: 1.05 }),
        el("text", id(), { name: "Support line", x: 16, y: 142, w: 170, h: 40, text: "Hand tools through April.", fontSize: 14, weight: 400, color: "#CFE6D8" }),
        el("image", id(), { name: "Hero visual", x: 188, y: 46, w: 100, h: 100, placeholder: "wrench", tint: "#8FD1A9" }),
        el("button", id(), { name: "CTA", x: 16, y: 196, w: 150, h: 38, label: "Shop the sale", bg: "#8FD1A9", color: "#16241B", radius: 4, fontSize: 14 }),
      ],
    }),
  },
  {
    id: "tpl-leaderboard",
    name: "Leaderboard offer",
    description: "One horizontal read: headline, line, button and a small visual at the end.",
    formatId: "728x90",
    pro: false,
    tags: ["Image", "Header"],
    swatch: ["#5A4414", "#2A2010"],
    build: (id) => ({
      background: grad("#5A4414", "#2A2010", 100),
      elements: [
        el("text", id(), { name: "Headline", x: 22, y: 12, w: 420, h: 38, text: "Roll into winter ready", fontSize: 30, weight: 900, color: "#FBF4DF", font: "display" }),
        el("text", id(), { name: "Support line", x: 22, y: 54, w: 420, h: 24, text: "Free fitting on four tires.", fontSize: 15, weight: 400, color: "#E8D9A8" }),
        el("button", id(), { name: "CTA", x: 470, y: 26, w: 150, h: 38, label: "Get a quote", bg: "#F2B705", color: "#2A2010", radius: 3, fontSize: 15 }),
        el("image", id(), { name: "Hero visual", x: 640, y: 8, w: 74, h: 74, placeholder: "wheel", tint: "#F2B705" }),
      ],
    }),
  },
  {
    id: "tpl-skyscraper",
    name: "Skyscraper",
    description: "A tall sidebar unit with a centered stack: visual, headline, divider, line, button.",
    formatId: "160x600",
    pro: false,
    tags: ["Image", "Sidebar"],
    swatch: ["#3E3E36", "#1B1B17"],
    build: (id) => ({
      background: grad("#3E3E36", "#1B1B17", 160),
      elements: [
        el("image", id(), { name: "Hero visual", x: 30, y: 36, w: 100, h: 100, placeholder: "paint", tint: "#E8E6E1" }),
        el("text", id(), { name: "Headline", x: 12, y: 160, w: 136, h: 120, text: "Finish line for your walls", fontSize: 24, weight: 900, color: "#F7F6F2", align: "center", lineHeight: 1.08 }),
        el("shape", id(), { name: "Divider", x: 62, y: 296, w: 36, h: 4, fill: "#E8E6E1" }),
        el("text", id(), { name: "Support line", x: 12, y: 314, w: 136, h: 56, text: "One coat. Eleven colors.", fontSize: 14, weight: 400, color: "#D4D2CB", align: "center" }),
        el("button", id(), { name: "CTA", x: 18, y: 396, w: 124, h: 40, label: "Find a stockist", bg: "#E8E6E1", color: "#1B1B17", radius: 3, fontSize: 13 }),
      ],
    }),
  },
  {
    id: "tpl-square-promo",
    name: "Square promo",
    description: "A 1:1 social creative with oversized type and a single, thumb-sized button.",
    formatId: "1080x1080",
    pro: false,
    tags: ["Social", "Gamified teaser"],
    swatch: ["#5A4414", "#2A2010"],
    build: (id) => ({
      background: grad("#5A4414", "#2A2010", 160),
      elements: [
        el("image", id(), { name: "Hero visual", x: 690, y: 70, w: 320, h: 320, placeholder: "wheel", tint: "#F2B705" }),
        el("text", id(), { name: "Headline", x: 80, y: 120, w: 600, h: 330, text: "Spin for a free fitting", fontSize: 104, weight: 900, color: "#FBF4DF", font: "display", lineHeight: 1.02 }),
        el("shape", id(), { name: "Divider", x: 80, y: 500, w: 140, h: 12, fill: "#F2B705" }),
        el("text", id(), { name: "Support line", x: 80, y: 540, w: 640, h: 130, text: "One spin per visit. Prizes up to a full set of four.", fontSize: 42, weight: 400, color: "#E8D9A8" }),
        el("button", id(), { name: "CTA", x: 80, y: 820, w: 440, h: 130, label: "Claim my prize", bg: "#F2B705", color: "#2A2010", radius: 14, fontSize: 46 }),
      ],
    }),
  },
  {
    id: "tpl-landscape",
    name: "Landscape link",
    description: "A 1.91:1 link creative that works for feeds and responsive display assets.",
    formatId: "1200x628",
    pro: false,
    tags: ["Social", "Native"],
    swatch: ["#4A3A2E", "#1D1712"],
    build: (id) => ({
      background: grad("#4A3A2E", "#1D1712", 120),
      elements: [
        el("text", id(), { name: "Label", x: 70, y: 80, w: 500, h: 36, text: "Sponsored · Bay 12 Coffee", fontSize: 24, weight: 600, color: "#E0A870", font: "mono", uppercase: true }),
        el("text", id(), { name: "Headline", x: 70, y: 134, w: 700, h: 200, text: "Cold-brew, done properly", fontSize: 76, weight: 900, color: "#F6EEE4", font: "serif", lineHeight: 1.04 }),
        el("text", id(), { name: "Support line", x: 70, y: 354, w: 660, h: 100, text: "Twelve hours, one filter, no shortcuts.", fontSize: 32, weight: 400, color: "#E6D6C2" }),
        el("button", id(), { name: "CTA", x: 70, y: 486, w: 320, h: 80, label: "Read the method", bg: "#E0A870", color: "#1D1712", radius: 6, fontSize: 30 }),
        el("image", id(), { name: "Hero visual", x: 830, y: 120, w: 300, h: 300, placeholder: "cup", tint: "#E0A870" }),
      ],
    }),
  },
  {
    id: "tpl-video-poster",
    name: "Video poster",
    description: "A 16:9 poster frame with a play button, for the thumbnail or companion image of a video ad.",
    formatId: "1280x720",
    pro: true,
    tags: ["Video", "Pro template"],
    swatch: ["#2C4156", "#121B24"],
    build: (id) => ({
      background: grad("#2C4156", "#121B24", 150),
      elements: [
        el("image", id(), { name: "Poster visual", x: 480, y: 70, w: 320, h: 320, placeholder: "gauge", tint: "#7FB5E6" }),
        el("text", id(), { name: "Headline", x: 140, y: 420, w: 1000, h: 90, text: "How a two-post hoist works", fontSize: 66, weight: 900, color: "#EAF2FA", align: "center", font: "display" }),
        el("text", id(), { name: "Support line", x: 140, y: 520, w: 1000, h: 50, text: "Load, lift, lock. Twenty seconds.", fontSize: 30, weight: 400, color: "#BFD6EA", align: "center" }),
        el("button", id(), { name: "Play button", x: 520, y: 600, w: 240, h: 68, label: "▶  Watch", bg: "#7FB5E6", color: "#121B24", radius: 34, fontSize: 28 }),
      ],
    }),
  },
  {
    id: "tpl-story",
    name: "Story vertical",
    description: "A 9:16 full-screen creative with the key message kept inside the safe area.",
    formatId: "1080x1920",
    pro: true,
    tags: ["Social", "Pro template"],
    swatch: ["#5B2A26", "#241110"],
    build: (id) => ({
      background: grad("#5B2A26", "#241110", 170),
      elements: [
        el("image", id(), { name: "Hero visual", x: 290, y: 300, w: 500, h: 500, placeholder: "wrench", tint: "#F08A7E" }),
        el("text", id(), { name: "Headline", x: 90, y: 860, w: 900, h: 330, text: "Winter bundle is back", fontSize: 120, weight: 900, color: "#FBEDEA", align: "center", font: "display", lineHeight: 1.02 }),
        el("text", id(), { name: "Support line", x: 90, y: 1220, w: 900, h: 190, text: "Heater, gloves and a floor mat. One box.", fontSize: 48, weight: 400, color: "#F4CFC9", align: "center" }),
        el("button", id(), { name: "CTA", x: 240, y: 1500, w: 600, h: 140, label: "Shop the bundle", bg: "#F08A7E", color: "#241110", radius: 16, fontSize: 52 }),
      ],
    }),
  },
  {
    id: "tpl-countdown",
    name: "Countdown deal",
    description: "A time-boxed offer with a big mono number to anchor the eye.",
    formatId: "300x250",
    pro: true,
    tags: ["Image", "Pro template"],
    swatch: ["#2C4156", "#121B24"],
    build: (id) => ({
      background: grad("#2C4156", "#121B24", 160),
      elements: [
        el("text", id(), { name: "Label", x: 16, y: 16, w: 200, h: 16, text: "Flash deal", fontSize: 11, weight: 600, color: "#7FB5E6", font: "mono", uppercase: true }),
        el("text", id(), { name: "Countdown", x: 16, y: 40, w: 268, h: 56, text: "24:00:00", fontSize: 50, weight: 900, color: "#EAF2FA", font: "mono" }),
        el("text", id(), { name: "Headline", x: 16, y: 108, w: 268, h: 56, text: "Two-post hoist, 15% off", fontSize: 22, weight: 900, color: "#EAF2FA", lineHeight: 1.1 }),
        el("text", id(), { name: "Support line", x: 16, y: 168, w: 268, h: 22, text: "Ends Friday at midnight.", fontSize: 13, weight: 400, color: "#BFD6EA" }),
        el("button", id(), { name: "CTA", x: 16, y: 200, w: 150, h: 36, label: "Get the deal", bg: "#7FB5E6", color: "#121B24", radius: 3, fontSize: 14 }),
      ],
    }),
  },
  {
    id: "tpl-blank",
    name: "Blank canvas",
    description: "Start from a headline and a button and build everything else yourself.",
    formatId: "300x250",
    pro: false,
    tags: ["Blank"],
    swatch: ["#2A2D33", "#1C1E22"],
    build: (id) => ({
      background: { kind: "solid", from: "#2A2D33", to: "#1C1E22", angle: 145 },
      elements: [
        el("text", id(), { name: "Headline", x: 20, y: 60, w: 260, h: 70, text: "Your headline here", fontSize: 28, weight: 900, color: "#E8E6E1" }),
        el("button", id(), { name: "CTA", x: 20, y: 180, w: 140, h: 40, label: "Learn more", bg: "#F2B705", color: "#1C1E22", radius: 4, fontSize: 15 }),
      ],
    }),
  },
];

export function getTemplate(id: string): StudioTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

/**
 * Builds a design from a template. Pass `id` and `now` explicitly so seed data stays deterministic
 * (server and client must produce identical markup).
 */
export function instantiateTemplate(
  template: StudioTemplate,
  opts: { id: string; name?: string; now: string },
): AdDesign {
  const format = getStudioFormat(template.formatId);
  const built = template.build(makeIds("el"));
  return {
    id: opts.id,
    name: opts.name ?? template.name,
    formatId: format.id,
    width: format.width,
    height: format.height,
    background: built.background,
    elements: built.elements,
    templateId: template.id,
    status: "draft",
    createdAt: opts.now,
    updatedAt: opts.now,
  };
}
