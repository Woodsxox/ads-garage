import type { MotifName } from "@/lib/domain/types";

/* ───────────── formats ───────────── */

export type StudioFormat = {
  id: string;
  label: string;
  width: number;
  height: number;
  group: "Display" | "Social" | "Video";
  /** Extra formats are gated behind the (demo) Pro plan. */
  pro: boolean;
};

export const STUDIO_FORMATS: readonly StudioFormat[] = [
  { id: "300x250", label: "Medium rectangle", width: 300, height: 250, group: "Display", pro: false },
  { id: "336x280", label: "Large rectangle", width: 336, height: 280, group: "Display", pro: false },
  { id: "728x90", label: "Leaderboard", width: 728, height: 90, group: "Display", pro: false },
  { id: "160x600", label: "Wide skyscraper", width: 160, height: 600, group: "Display", pro: false },
  { id: "320x100", label: "Large mobile banner", width: 320, height: 100, group: "Display", pro: false },
  { id: "300x600", label: "Half page", width: 300, height: 600, group: "Display", pro: true },
  { id: "970x250", label: "Billboard", width: 970, height: 250, group: "Display", pro: true },
  { id: "1080x1080", label: "Square", width: 1080, height: 1080, group: "Social", pro: false },
  { id: "1200x628", label: "Landscape link", width: 1200, height: 628, group: "Social", pro: false },
  { id: "1080x1920", label: "Story / vertical", width: 1080, height: 1920, group: "Social", pro: true },
  { id: "1280x720", label: "Video poster", width: 1280, height: 720, group: "Video", pro: true },
];

export function getStudioFormat(id: string): StudioFormat {
  return STUDIO_FORMATS.find((f) => f.id === id) ?? STUDIO_FORMATS[0];
}

/* ───────────── fonts ───────────── */

export type FontKey = "sans" | "serif" | "mono" | "display";

/** System stacks only, so canvas export, HTML export and the editor render the same. */
export const FONT_STACKS: Record<FontKey, string> = {
  sans: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
  mono: 'ui-monospace, Menlo, Consolas, monospace',
  display: 'Impact, "Arial Black", "Haettenschweiler", sans-serif',
};

export const FONT_LABELS: Record<FontKey, string> = {
  sans: "Sans",
  serif: "Serif",
  mono: "Mono",
  display: "Display",
};

/* ───────────── elements ───────────── */

type Base = { id: string; name: string; x: number; y: number; w: number; h: number };

export type TextEl = Base & {
  type: "text";
  text: string;
  fontSize: number;
  weight: 400 | 600 | 700 | 900;
  color: string;
  align: "left" | "center" | "right";
  font: FontKey;
  uppercase: boolean;
  lineHeight: number;
};

export type ImageEl = Base & {
  type: "image";
  /** Data URL of an uploaded image, or null to show the motif placeholder. */
  src: string | null;
  placeholder: MotifName;
  tint: string;
  fit: "cover" | "contain";
  radius: number;
  alt: string;
};

export type ButtonEl = Base & {
  type: "button";
  label: string;
  bg: string;
  color: string;
  radius: number;
  fontSize: number;
  href: string;
};

export type ShapeEl = Base & {
  type: "shape";
  fill: string;
  radius: number;
  opacity: number;
};

export type DesignElement = TextEl | ImageEl | ButtonEl | ShapeEl;
export type ElementType = DesignElement["type"];

export type Background = {
  kind: "solid" | "gradient";
  from: string;
  to: string;
  angle: number;
};

export type AdDesign = {
  id: string;
  name: string;
  formatId: string;
  width: number;
  height: number;
  background: Background;
  elements: DesignElement[];
  templateId?: string;
  status: "draft" | "ready";
  createdAt: string;
  updatedAt: string;
};

/* ───────────── factories ───────────── */

export function makeIds(prefix: string): () => string {
  let n = 0;
  return () => `${prefix}-${++n}`;
}

type Geometry = { x: number; y: number; w: number; h: number };

export function createElement(
  type: "text",
  id: string,
  over: Geometry & Partial<Omit<TextEl, "type" | "id">>,
): TextEl;
export function createElement(
  type: "image",
  id: string,
  over: Geometry & Partial<Omit<ImageEl, "type" | "id">>,
): ImageEl;
export function createElement(
  type: "button",
  id: string,
  over: Geometry & Partial<Omit<ButtonEl, "type" | "id">>,
): ButtonEl;
export function createElement(
  type: "shape",
  id: string,
  over: Geometry & Partial<Omit<ShapeEl, "type" | "id">>,
): ShapeEl;
export function createElement(
  type: ElementType,
  id: string,
  over: Geometry & Record<string, unknown>,
): DesignElement {
  switch (type) {
    case "text":
      return {
        type,
        id,
        name: "Text",
        text: "Your text",
        fontSize: 20,
        weight: 700,
        color: "#FFFFFF",
        align: "left",
        font: "sans",
        uppercase: false,
        lineHeight: 1.15,
        ...over,
      } as TextEl;
    case "image":
      return {
        type,
        id,
        name: "Image",
        src: null,
        placeholder: "bolt",
        tint: "#F2B705",
        fit: "contain",
        radius: 0,
        alt: "",
        ...over,
      } as ImageEl;
    case "button":
      return {
        type,
        id,
        name: "Button",
        label: "Learn more",
        bg: "#F2B705",
        color: "#1C1E22",
        radius: 4,
        fontSize: 16,
        href: "https://example.com",
        ...over,
      } as ButtonEl;
    case "shape":
      return {
        type,
        id,
        name: "Shape",
        fill: "#F2B705",
        radius: 0,
        opacity: 1,
        ...over,
      } as ShapeEl;
  }
}

/** Default geometry for an element added from the toolbar, scaled to the canvas. */
export function defaultsForNewElement(
  type: ElementType,
  canvas: { width: number; height: number },
): { x: number; y: number; w: number; h: number } & Record<string, unknown> {
  const unit = Math.min(canvas.width, canvas.height * 1.4);
  const w = Math.round(unit * 0.5);
  const x = Math.round((canvas.width - w) / 2);
  switch (type) {
    case "text":
      return { x, y: Math.round(canvas.height * 0.4), w, h: Math.round(unit * 0.16), fontSize: Math.max(12, Math.round(unit * 0.07)) };
    case "image": {
      const s = Math.round(Math.min(canvas.width, canvas.height) * 0.35);
      return { x: Math.round((canvas.width - s) / 2), y: Math.round((canvas.height - s) / 2), w: s, h: s };
    }
    case "button":
      return {
        x,
        y: Math.round(canvas.height * 0.72),
        w: Math.round(unit * 0.42),
        h: Math.round(unit * 0.14),
        fontSize: Math.max(11, Math.round(unit * 0.055)),
      };
    case "shape":
      return { x, y: Math.round(canvas.height * 0.2), w, h: Math.round(unit * 0.12) };
  }
}

/** Builds a new element from the toolbar, with colors that read against the current background. */
export function makeElement(type: ElementType, id: string, design: AdDesign): DesignElement {
  const geo = defaultsForNewElement(type, design);
  const dark = design.background.from;
  const light = parseInt(dark.slice(1, 3), 16) * 0.299 + parseInt(dark.slice(3, 5), 16) * 0.587 + parseInt(dark.slice(5, 7), 16) * 0.114 > 150;
  switch (type) {
    case "text":
      return createElement("text", id, { ...geo, color: light ? "#1C1E22" : "#FFFFFF" } as Geometry & Partial<Omit<TextEl, "type" | "id">>);
    case "image":
      return createElement("image", id, geo as Geometry & Partial<Omit<ImageEl, "type" | "id">>);
    case "button":
      return createElement("button", id, geo as Geometry & Partial<Omit<ButtonEl, "type" | "id">>);
    case "shape":
      return createElement("shape", id, geo as Geometry & Partial<Omit<ShapeEl, "type" | "id">>);
  }
}

export function newDesignId(): string {
  return `design-${crypto.randomUUID()}`;
}

export function newElementId(): string {
  return `el-${crypto.randomUUID().slice(0, 8)}`;
}

export function cloneDesign(design: AdDesign): AdDesign {
  return JSON.parse(JSON.stringify(design)) as AdDesign;
}

export function backgroundCss(bg: Background): string {
  return bg.kind === "solid" ? bg.from : `linear-gradient(${bg.angle}deg, ${bg.from}, ${bg.to})`;
}

export function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "ad-design";
}
