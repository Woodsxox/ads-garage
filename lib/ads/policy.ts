/**
 * Where live (monetised) ad units may appear. This is the single source of truth: the script
 * loader, `RealAd` and the sponsored slot all read it, and `scripts/check-ad-isolation.mjs`
 * enforces which files may import them.
 *
 * Live units are real inventory from the ad provider. They never appear inside the sandbox,
 * the studio, lesson exercises or any demo ad. Demo ads are never paid and never use this file.
 */

/** Exact paths. `/gallery/[id]` (the learning preview) is deliberately not on the list. */
const LIVE_AD_PATHS: readonly string[] = ["/", "/gallery"];

/** Editorial sections: the path itself and everything under it. */
const LIVE_AD_PREFIXES: readonly string[] = ["/guide", "/blog"];

export function isLiveAdRoute(pathname: string): boolean {
  if (LIVE_AD_PATHS.includes(pathname)) return true;
  return LIVE_AD_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export const PLACEHOLDER_CLIENT = "ca-pub-XXXXXXXXXXXXXXXX";

export function adsenseClient(): string {
  return process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? PLACEHOLDER_CLIENT;
}

/** A real publisher ID is set. Until then no ad script loads and no unit renders. */
export function adsenseConfigured(): boolean {
  return /^ca-pub-\d{16}$/.test(adsenseClient());
}
