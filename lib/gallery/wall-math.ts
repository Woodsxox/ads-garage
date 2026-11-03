/**
 * The geometry of the gallery wall, as pure functions.
 *
 * The wall is an endless grid of tiles. A flat position (x, y) on that grid is pushed through a
 * barrel ("fisheye") transform so tiles bunch up, tilt and recede toward the rim, then a camera
 * looks at the result. The vertex shader in GalleryWall.tsx does exactly the same maths on the GPU;
 * this copy exists so the CPU can hit-test tiles. Keep the two in step.
 */

/** One tile, in wall units. Tiles are 4:5. */
export const TILE_W = 1;
export const TILE_H = 1.25;

/** How many tiles the wall repeats over before it wraps. Large enough that the seam sits beyond the rim. */
export const COLS = 9;
export const ROWS = 7;
export const WALL_W = COLS * TILE_W;
export const WALL_H = ROWS * TILE_H;

/** Barrel strength and depth curvature. Larger K bunches tiles harder toward the rim. */
export const K = 0.011;
export const CURVE = 0.075;

/** Beyond this fisheye radius a tile is too dark and small to matter, so it is skipped. */
export const RIM_CULL = 4.7;

export interface Displaced {
  x: number;
  y: number;
  z: number;
  /** Radius after the barrel transform. */
  r: number;
}

/** Wraps a coordinate into [-size/2, size/2). This is what makes the wall endless. */
export function wrap(value: number, size: number): number {
  return ((((value + size / 2) % size) + size) % size) - size / 2;
}

/** Flat wall position to world position. */
export function displace(x: number, y: number): Displaced {
  const s = 1 / (1 + K * (x * x + y * y));
  const qx = x * s;
  const qy = y * s;
  const r = Math.hypot(qx, qy);
  return { x: qx, y: qy, z: -CURVE * r * r, r };
}

/** Which ad a grid cell shows. The 3 staggers rows so repeats do not line up in columns. */
export function adIndexFor(col: number, row: number, count: number): number {
  return (((col + row * 3) % count) + count) % count;
}

/** Point in polygon (even-odd). */
export function inPolygon(px: number, py: number, points: readonly { x: number; y: number }[]): boolean {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    const a = points[i];
    const b = points[j];
    if (a.y > py !== b.y > py && px < ((b.x - a.x) * (py - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

/** Sample points around a tile's outline, so a curved tile is hit-tested as a curved shape. */
export const OUTLINE: readonly { u: number; v: number }[] = [
  { u: -0.5, v: -0.5 }, { u: 0, v: -0.5 }, { u: 0.5, v: -0.5 },
  { u: 0.5, v: 0 }, { u: 0.5, v: 0.5 }, { u: 0, v: 0.5 },
  { u: -0.5, v: 0.5 }, { u: -0.5, v: 0 },
];
