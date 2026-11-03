import { ADS } from "@/lib/demo/ads";
import type { Destination } from "@/lib/domain/types";

/**
 * Hosts we have reviewed and marked embeddable. A destination is only ever loaded in a frame
 * when it is flagged embeddable, uses https, AND its host is on this list.
 *
 * Backend phase: replace with a server-side allow-list and enforce it with response headers
 * (CSP frame-src on the viewer page) so the browser, not just this function, refuses other hosts.
 */
const EMBEDDABLE_HOSTS = new Set(
  ADS.flatMap((ad) =>
    ad.destination.kind === "external" && ad.destination.embeddable ? [new URL(ad.destination.url).host] : [],
  ),
);

export function canEmbed(destination: Destination): boolean {
  if (destination.kind !== "external" || !destination.embeddable) return false;
  try {
    const url = new URL(destination.url);
    return url.protocol === "https:" && EMBEDDABLE_HOSTS.has(url.host);
  } catch {
    return false;
  }
}
