/** Rendering bare ads is a build-time tool: on in development, off in production unless asked for. */
export function assetRenderEnabled(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.ASSET_RENDER === "1";
}
