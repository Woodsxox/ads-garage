/**
 * The tile language used across the site: a grid whose gaps are 1px hairlines, with flat cells that
 * lift on hover. Use `TILE_GRID` on the list and `TILE` on each cell.
 */
export const TILE_GRID = "grid hairlines";
export const TILE = "relative flex flex-col bg-bay-floor p-5 transition-colors hover:bg-bay-wall";
/** Keeps the whole tile one focus target: put it on the tile's main link. */
export const TILE_LINK =
  "after:absolute after:inset-0 after:content-[''] focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-hazard";
