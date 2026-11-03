/**
 * The pixel-block field behind the page transition: a grid of square cells that fill the screen in
 * a random, clumpy order, and later empty out in a different order. Pure maths and drawing, no
 * React, so it can be reasoned about on its own.
 */

/**
 * The block colours, all mixed toward the dark page background so nothing glares: a mid grey, a
 * graphite step up from the page, a lighter grey for the odd bright block, and a deep green from
 * the accent. They are read from the site's colour tokens when a transition starts, so changing
 * the tokens in globals.css changes the transition with them.
 */
export interface Palette {
  colors: readonly string[];
  /** `r,g,b` of the soft glow that swells mid-transition. */
  glow: string;
}

const FALLBACK = { floor: "#0b0b0b", chalk: "#f2f2ef", accent: "#1eff66" } as const;

function parseHex(value: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(value.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const toHex = (rgb: [number, number, number]) => `#${rgb.map((v) => v.toString(16).padStart(2, "0")).join("")}`;

/** `t` of the way from colour `a` to colour `b`, as a hex string. */
function mix(a: [number, number, number], b: [number, number, number], t: number): string {
  return toHex([0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * t)) as [number, number, number]);
}

export function resolvePalette(styles: CSSStyleDeclaration): Palette {
  const read = (name: string, fallback: string) => parseHex(styles.getPropertyValue(name)) ?? parseHex(fallback)!;
  const floor = read("--bay-floor", FALLBACK.floor);
  const chalk = read("--chalk", FALLBACK.chalk);
  const accent = read("--hazard", FALLBACK.accent);
  return {
    // Graphite has to stay visibly lighter than the page, or the blocks vanish into it.
    colors: [mix(floor, chalk, 0.4), mix(floor, chalk, 0.17), mix(floor, chalk, 0.62), mix(floor, accent, 0.45)],
    glow: accent.join(","),
  };
}

/** How often each palette colour is used, in the palette's order. Sums to 1. */
const WEIGHTS = [0.3, 0.28, 0.18, 0.24] as const;

/** How wide the flickering edge of the wave is. A wider band looks more glitchy. */
const BAND = 0.09;

export type Mode = "cover" | "reveal" | "hold";

export interface Field {
  cols: number;
  rows: number;
  cell: number;
  /** Per cell, 0 to 1: when it appears while covering. Spread evenly, so progress maps to coverage. */
  cover: Float32Array;
  /** Per cell, 0 to 1: when it disappears while revealing. A different order from `cover`. */
  reveal: Float32Array;
  /** Per cell, an index into the palette's colors. */
  color: Uint8Array;
}

function hash(i: number, j: number, seed: number): number {
  let h = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(seed, 1442695041)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const smooth = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Smooth value noise, so neighbouring cells tend to fill together and form clumps. */
function noise(x: number, y: number, seed: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const u = smooth(x - xi);
  const v = smooth(y - yi);
  return lerp(
    lerp(hash(xi, yi, seed), hash(xi + 1, yi, seed), u),
    lerp(hash(xi, yi + 1, seed), hash(xi + 1, yi + 1, seed), u),
    v,
  );
}

/** Replaces values with their rank, 0 to 1, so they are uniformly distributed. */
function rankNormalise(values: Float32Array): Float32Array {
  const order = Array.from(values.keys()).sort((a, b) => values[a] - values[b]);
  const out = new Float32Array(values.length);
  order.forEach((index, rank) => {
    out[index] = values.length > 1 ? rank / (values.length - 1) : 0;
  });
  return out;
}

export function makeField(width: number, height: number): Field {
  const cell = Math.min(84, Math.max(44, Math.round(width / 22)));
  const cols = Math.ceil(width / cell);
  const rows = Math.ceil(height / cell);
  const count = cols * rows;
  const rawCover = new Float32Array(count);
  const rawReveal = new Float32Array(count);
  const color = new Uint8Array(count);
  const seed = Math.floor(Math.random() * 1e6);

  for (let j = 0; j < rows; j += 1) {
    for (let i = 0; i < cols; i += 1) {
      const k = j * cols + i;
      rawCover[k] = 0.5 * hash(i, j, seed + 1) + 0.5 * noise(i / 3.5, j / 3.5, seed + 2);
      rawReveal[k] = 0.5 * hash(i, j, seed + 3) + 0.5 * noise(i / 3.5, j / 3.5, seed + 4);
      const c = hash(i, j, seed + 5);
      let acc = 0;
      color[k] = WEIGHTS.findIndex((w) => (acc += w) > c);
    }
  }
  return { cols, rows, cell, cover: rankNormalise(rawCover), reveal: rankNormalise(rawReveal), color };
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Draws the field at progress `p` (0 to 1).
 * - `cover`: cells fill in as p rises; at 1 every cell is solid.
 * - `reveal`: cells empty out as p rises; at 0 every cell is solid, at 1 none.
 * - `hold`: every cell solid, with a few flickering colour, for while the next page is loading.
 * Cells near the moving front flicker on and off each frame, which is the glitch.
 */
export function drawField(ctx: CanvasRenderingContext2D, field: Field, palette: Palette, width: number, height: number, p: number, mode: Mode): void {
  ctx.clearRect(0, 0, width, height);

  // A soft glow in the accent colour that swells mid-transition, under the blocks.
  const glow = mode === "hold" ? 0.12 : 0.22 * Math.sin(Math.PI * clamp01(p));
  if (glow > 0.01) {
    const cx = width * 0.5;
    const cy = height * 0.62;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(width, height) * 0.55);
    g.addColorStop(0, `rgba(${palette.glow},${glow.toFixed(3)})`);
    g.addColorStop(1, `rgba(${palette.glow},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
  }

  const { cols, rows, cell } = field;
  const front = clamp01(p) * (1 + 2 * BAND) - BAND;
  const solid = mode === "hold" || (mode === "cover" && p >= 1) || (mode === "reveal" && p <= 0);
  const empty = (mode === "cover" && p <= 0) || (mode === "reveal" && p >= 1);
  if (empty) return;

  for (let j = 0; j < rows; j += 1) {
    for (let i = 0; i < cols; i += 1) {
      const k = j * cols + i;
      let on = true;
      if (!solid) {
        if (mode === "cover") {
          const t = field.cover[k];
          on = t <= front - BAND ? true : t >= front + BAND ? false : Math.random() < 0.5;
        } else {
          const t = field.reveal[k];
          on = t <= front - BAND ? false : t >= front + BAND ? true : Math.random() < 0.5;
        }
      }
      if (!on) continue;
      let ci = field.color[k];
      if (mode === "hold" && Math.random() < 0.035) ci = (ci + 1) % palette.colors.length;
      ctx.fillStyle = palette.colors[ci];
      // One pixel of overlap so no seams show between cells.
      ctx.fillRect(i * cell, j * cell, cell + 1, cell + 1);
    }
  }
}
