import {
  type Background,
  type DesignElement,
  type DesignInput,
  FONT_KEYS,
  type FontKey,
  MOTIF_NAMES,
  type MotifName,
  TEXT_WEIGHTS,
} from './design.types.js';
import { findFormat } from './studio-formats.js';

export const LIMITS = {
  maxElements: 100,
  maxNameLength: 120,
  maxTextLength: 2000,
  maxAltLength: 300,
  maxHrefLength: 2048,
  maxIdLength: 64,
  coordinateRange: 20_000,
  /** One embedded image, as a base64 data URL (about 2 MB of image data). */
  maxImageChars: 2_800_000,
  /** All embedded images in one design. */
  maxTotalImageChars: 6_000_000,
} as const;

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;
// Only raster formats and SVG. SVG is safe here because it is only ever used inside <img>, where scripts do not run.
const IMAGE_DATA_URL = /^data:image\/(?:png|jpeg|webp|svg\+xml);base64,[A-Za-z0-9+/]+={0,2}$/;
// Intentional: control characters in a URL are a known way to smuggle a `javascript:` scheme past a check.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;

export type ValidationResult = { ok: true; value: DesignInput } | { ok: false; errors: string[] };

type Raw = Record<string, unknown>;

const isObject = (value: unknown): value is Raw => typeof value === 'object' && value !== null && !Array.isArray(value);

class Collector {
  readonly errors: string[] = [];
  add(path: string, message: string): void {
    // Cap the list so a hostile payload cannot make the response huge.
    if (this.errors.length < 25) this.errors.push(`${path}: ${message}`);
  }
}

function str(raw: Raw, key: string, path: string, c: Collector, opts: { max: number; min?: number }): string {
  const value = raw[key];
  if (typeof value !== 'string') {
    c.add(`${path}.${key}`, 'must be a string');
    return '';
  }
  if (value.length > opts.max) c.add(`${path}.${key}`, `must be at most ${opts.max} characters`);
  if ((opts.min ?? 0) > 0 && value.trim().length < (opts.min ?? 0)) c.add(`${path}.${key}`, 'must not be empty');
  return value;
}

function num(raw: Raw, key: string, path: string, c: Collector, min: number, max: number): number {
  const value = raw[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    c.add(`${path}.${key}`, 'must be a finite number');
    return min;
  }
  if (value < min || value > max) c.add(`${path}.${key}`, `must be between ${min} and ${max}`);
  return value;
}

function color(raw: Raw, key: string, path: string, c: Collector): string {
  const value = raw[key];
  if (typeof value !== 'string' || !HEX_COLOR.test(value)) {
    c.add(`${path}.${key}`, 'must be a hex color like #1C1E22');
    return '#000000';
  }
  return value.toUpperCase();
}

function oneOf<T extends string | number>(raw: Raw, key: string, path: string, c: Collector, allowed: readonly T[], fallback: T): T {
  const value = raw[key];
  if (!allowed.includes(value as T)) {
    c.add(`${path}.${key}`, `must be one of ${allowed.join(', ')}`);
    return fallback;
  }
  return value as T;
}

function bool(raw: Raw, key: string, path: string, c: Collector): boolean {
  if (typeof raw[key] !== 'boolean') {
    c.add(`${path}.${key}`, 'must be true or false');
    return false;
  }
  return raw[key] as boolean;
}

/** Empty, or an absolute http(s) URL. `javascript:`, `data:` and friends are refused. */
function href(raw: Raw, key: string, path: string, c: Collector): string {
  const value = raw[key];
  if (typeof value !== 'string') {
    c.add(`${path}.${key}`, 'must be a string');
    return '';
  }
  const trimmed = value.trim();
  if (trimmed === '') return '';
  if (trimmed.length > LIMITS.maxHrefLength || CONTROL_CHARS.test(trimmed)) {
    c.add(`${path}.${key}`, 'is not a valid URL');
    return '';
  }
  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      c.add(`${path}.${key}`, 'must start with http:// or https://');
      return '';
    }
    return trimmed;
  } catch {
    c.add(`${path}.${key}`, 'is not a valid URL');
    return '';
  }
}

function parseBackground(value: unknown, c: Collector): Background {
  const fallback: Background = { kind: 'solid', from: '#000000', to: '#000000', angle: 0 };
  if (!isObject(value)) {
    c.add('background', 'must be an object');
    return fallback;
  }
  return {
    kind: oneOf(value, 'kind', 'background', c, ['solid', 'gradient'] as const, 'solid'),
    from: color(value, 'from', 'background', c),
    to: color(value, 'to', 'background', c),
    angle: num(value, 'angle', 'background', c, 0, 360),
  };
}

function parseElement(value: unknown, index: number, c: Collector, seen: Set<string>, imageChars: { total: number }): DesignElement | null {
  const path = `elements[${index}]`;
  if (!isObject(value)) {
    c.add(path, 'must be an object');
    return null;
  }

  const id = str(value, 'id', path, c, { max: LIMITS.maxIdLength, min: 1 });
  if (id) {
    if (seen.has(id)) c.add(`${path}.id`, 'must be unique within the design');
    seen.add(id);
  }
  const R = LIMITS.coordinateRange;
  const base = {
    id,
    name: str(value, 'name', path, c, { max: LIMITS.maxNameLength }),
    x: num(value, 'x', path, c, -R, R),
    y: num(value, 'y', path, c, -R, R),
    w: num(value, 'w', path, c, 1, R),
    h: num(value, 'h', path, c, 1, R),
  };

  switch (value.type) {
    case 'text':
      return {
        ...base,
        type: 'text',
        text: str(value, 'text', path, c, { max: LIMITS.maxTextLength }),
        fontSize: num(value, 'fontSize', path, c, 6, 400),
        weight: oneOf(value, 'weight', path, c, TEXT_WEIGHTS, 400),
        color: color(value, 'color', path, c),
        align: oneOf(value, 'align', path, c, ['left', 'center', 'right'] as const, 'left'),
        font: oneOf<FontKey>(value, 'font', path, c, FONT_KEYS, 'sans'),
        uppercase: bool(value, 'uppercase', path, c),
        lineHeight: num(value, 'lineHeight', path, c, 0.8, 3),
      };
    case 'image': {
      let src: string | null = null;
      if (value.src !== null) {
        if (typeof value.src !== 'string') {
          c.add(`${path}.src`, 'must be an image data URL or null');
        } else if (value.src.length > LIMITS.maxImageChars) {
          c.add(`${path}.src`, 'image is too large. Use an image under about 2 MB');
        } else if (!IMAGE_DATA_URL.test(value.src)) {
          c.add(`${path}.src`, 'must be a base64 data URL for a PNG, JPEG, WebP or SVG image');
        } else {
          src = value.src;
          imageChars.total += src.length;
        }
      }
      return {
        ...base,
        type: 'image',
        src,
        placeholder: oneOf<MotifName>(value, 'placeholder', path, c, MOTIF_NAMES, 'bolt'),
        tint: color(value, 'tint', path, c),
        fit: oneOf(value, 'fit', path, c, ['cover', 'contain'] as const, 'contain'),
        radius: num(value, 'radius', path, c, 0, 1000),
        alt: str(value, 'alt', path, c, { max: LIMITS.maxAltLength }),
      };
    }
    case 'button':
      return {
        ...base,
        type: 'button',
        label: str(value, 'label', path, c, { max: LIMITS.maxNameLength }),
        bg: color(value, 'bg', path, c),
        color: color(value, 'color', path, c),
        radius: num(value, 'radius', path, c, 0, 200),
        fontSize: num(value, 'fontSize', path, c, 6, 200),
        href: href(value, 'href', path, c),
      };
    case 'shape':
      return {
        ...base,
        type: 'shape',
        fill: color(value, 'fill', path, c),
        radius: num(value, 'radius', path, c, 0, 1000),
        opacity: num(value, 'opacity', path, c, 0, 1),
      };
    default:
      c.add(`${path}.type`, 'must be text, image, button or shape');
      return null;
  }
}

/**
 * Checks a design from the client and returns a clean copy that contains only known fields.
 * It never trusts the input: colors are strict hex, links are http(s) only, images are an
 * allow-listed data URL under a size cap, and the canvas must match its named format.
 *
 * Pure and synchronous, so it can be tested without a database and reused by a worker later.
 */
export function validateDesign(input: unknown): ValidationResult {
  const c = new Collector();
  if (!isObject(input)) return { ok: false, errors: ['body: must be a JSON object'] };

  const name = str(input, 'name', 'design', c, { max: LIMITS.maxNameLength, min: 1 }).trim();
  const formatId = typeof input.formatId === 'string' ? input.formatId : '';
  const format = findFormat(formatId);
  if (!format) c.add('design.formatId', 'is not a known format');
  const width = num(input, 'width', 'design', c, 1, 10_000);
  const height = num(input, 'height', 'design', c, 1, 10_000);
  if (format && (width !== format.width || height !== format.height)) {
    c.add('design.width', `${formatId} must be ${format.width}×${format.height}`);
  }

  const status = oneOf(input, 'status', 'design', c, ['draft', 'ready'] as const, 'draft');
  const background = parseBackground(input.background, c);

  let templateId: string | undefined;
  if (input.templateId !== undefined && input.templateId !== null) {
    if (typeof input.templateId !== 'string' || input.templateId.length > LIMITS.maxIdLength) {
      c.add('design.templateId', 'must be a short string');
    } else {
      templateId = input.templateId;
    }
  }

  const elements: DesignElement[] = [];
  if (!Array.isArray(input.elements)) {
    c.add('design.elements', 'must be an array');
  } else if (input.elements.length > LIMITS.maxElements) {
    c.add('design.elements', `can have at most ${LIMITS.maxElements} elements`);
  } else {
    const seen = new Set<string>();
    const imageChars = { total: 0 };
    input.elements.forEach((raw, index) => {
      const element = parseElement(raw, index, c, seen, imageChars);
      if (element) elements.push(element);
    });
    if (imageChars.total > LIMITS.maxTotalImageChars) c.add('design.elements', 'embedded images are too large in total');
  }

  if (c.errors.length > 0) return { ok: false, errors: c.errors };
  return {
    ok: true,
    value: { name, formatId, width, height, background, elements, status, ...(templateId ? { templateId } : {}) },
  };
}
