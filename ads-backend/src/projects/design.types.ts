/**
 * The shape of an ad design. This mirrors `lib/studio/model.ts` in the web app: the API stores and
 * returns exactly what the editor works with, so swapping the browser-storage repository for a
 * fetch-based one needs no translation layer.
 */

export const FONT_KEYS = ['sans', 'serif', 'mono', 'display'] as const;
export type FontKey = (typeof FONT_KEYS)[number];

export const MOTIF_NAMES = ['wheel', 'cup', 'wrench', 'paint', 'bolt', 'gauge'] as const;
export type MotifName = (typeof MOTIF_NAMES)[number];

export const TEXT_WEIGHTS = [400, 600, 700, 900] as const;

interface ElementBase {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TextElement extends ElementBase {
  type: 'text';
  text: string;
  fontSize: number;
  weight: 400 | 600 | 700 | 900;
  color: string;
  align: 'left' | 'center' | 'right';
  font: FontKey;
  uppercase: boolean;
  lineHeight: number;
}

export interface ImageElement extends ElementBase {
  type: 'image';
  /** A base64 image data URL, or null to show the motif placeholder. */
  src: string | null;
  placeholder: MotifName;
  tint: string;
  fit: 'cover' | 'contain';
  radius: number;
  alt: string;
}

export interface ButtonElement extends ElementBase {
  type: 'button';
  label: string;
  bg: string;
  color: string;
  radius: number;
  fontSize: number;
  /** Empty, or an absolute http(s) URL. */
  href: string;
}

export interface ShapeElement extends ElementBase {
  type: 'shape';
  fill: string;
  radius: number;
  opacity: number;
}

export type DesignElement = TextElement | ImageElement | ButtonElement | ShapeElement;

export interface Background {
  kind: 'solid' | 'gradient';
  from: string;
  to: string;
  angle: number;
}

export type DesignStatus = 'draft' | 'ready';

/** The editable part of a design: everything the client may send. Server-owned fields are not here. */
export interface DesignInput {
  name: string;
  formatId: string;
  width: number;
  height: number;
  background: Background;
  elements: DesignElement[];
  templateId?: string;
  status: DesignStatus;
}
