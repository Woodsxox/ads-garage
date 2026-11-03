import type { MotifName } from "@/lib/domain/types";

/**
 * Small geometric illustrations used as demo ad artwork. Returns trusted, static SVG
 * markup built from fixed shapes plus two colors from our own palettes.
 */
export function motifSvg(name: MotifName, accent: string, ink: string): string {
  const open = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" aria-hidden="true">`;
  const close = `</svg>`;

  switch (name) {
    case "wheel": {
      const spokes = [0, 72, 144, 216, 288]
        .map((deg) => `<line x1="50" y1="50" x2="50" y2="16" stroke="${accent}" stroke-width="5" stroke-linecap="round" transform="rotate(${deg} 50 50)"/>`)
        .join("");
      return `${open}<circle cx="50" cy="50" r="40" stroke="${accent}" stroke-width="9"/><circle cx="50" cy="50" r="31" stroke="${ink}" stroke-opacity=".35" stroke-width="2"/>${spokes}<circle cx="50" cy="50" r="8" fill="${accent}"/>${close}`;
    }
    case "cup":
      return `${open}<path d="M22 38h46v22a20 20 0 0 1-20 20h-6a20 20 0 0 1-20-20z" fill="${accent}"/><path d="M68 44h6a9 9 0 0 1 0 18h-8" stroke="${accent}" stroke-width="6" stroke-linecap="round"/><path d="M36 28c-4-5 4-8 0-13M48 28c-4-5 4-8 0-13M60 28c-4-5 4-8 0-13" stroke="${ink}" stroke-opacity=".7" stroke-width="3.5" stroke-linecap="round"/>${close}`;
    case "wrench":
      return `${open}<g transform="rotate(-38 50 50)"><rect x="43.5" y="30" width="13" height="56" rx="6.5" fill="${accent}"/><circle cx="50" cy="26" r="16" fill="${accent}"/><rect x="44" y="6" width="12" height="20" fill="${ink}" fill-opacity=".9"/></g>${close}`;
    case "paint":
      return `${open}<rect x="24" y="36" width="52" height="44" rx="5" fill="${accent}"/><ellipse cx="50" cy="36" rx="26" ry="7" fill="${ink}" fill-opacity=".55"/><path d="M50 36V16" stroke="${accent}" stroke-width="5" stroke-linecap="round"/><circle cx="50" cy="14" r="6" fill="${ink}" fill-opacity=".8"/>${close}`;
    case "bolt":
      return `${open}<polygon points="50,10 84,30 84,70 50,90 16,70 16,30" stroke="${accent}" stroke-width="7" stroke-linejoin="round"/><circle cx="50" cy="50" r="15" fill="${accent}"/><circle cx="50" cy="50" r="6" fill="${ink}" fill-opacity=".85"/>${close}`;
    case "gauge":
      return `${open}<path d="M14 68a36 36 0 0 1 72 0" stroke="${accent}" stroke-width="9" stroke-linecap="round"/><path d="M26 68a24 24 0 0 1 48 0" stroke="${ink}" stroke-opacity=".3" stroke-width="3"/><line x1="50" y1="68" x2="68" y2="40" stroke="${ink}" stroke-width="5" stroke-linecap="round"/><circle cx="50" cy="68" r="7" fill="${ink}"/>${close}`;
  }
}

/** For use as an <img src> / CSS url() value. */
export function motifDataUri(name: MotifName, accent: string, ink: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(motifSvg(name, accent, ink))}`;
}
