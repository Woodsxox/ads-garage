import { AVAILABILITY_META, FORMAT_META } from "@/lib/domain/meta";
import type { Ad } from "@/lib/domain/types";

/** Texture size for one tile (4:5, like the tile on the wall). */
export const TEX_W = 640;
export const TEX_H = 800;

const PAD = 28;
/** Where the ad's picture sits inside the tile. */
export const ART = { x: PAD, y: 100, w: TEX_W - PAD * 2, h: 570 };

export interface Fonts {
  display: string;
  mono: string;
}

/** Reads the loaded font stacks from the CSS variables next/font sets, so canvas text matches the page. */
export function readFonts(): Fonts {
  const style = getComputedStyle(document.documentElement);
  const grab = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
  return { display: grab("--font-inter-tight", "system-ui, sans-serif"), mono: grab("--font-geist-mono", "ui-monospace, monospace") };
}

export function loadFonts(fonts: Fonts): Promise<unknown> {
  return Promise.all([
    document.fonts.load(`600 26px ${fonts.display}`),
    document.fonts.load(`400 15px ${fonts.mono}`),
  ]);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth || !line) line = test;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    lines.length = maxLines;
    lines[maxLines - 1] = `${lines[maxLines - 1].replace(/\s+\S*$/, "")}…`;
  }
  return lines;
}

function pill(ctx: CanvasRenderingContext2D, fonts: Fonts, text: string, x: number, y: number, dot?: string): number {
  ctx.font = `400 15px ${fonts.mono}`;
  const label = text.toUpperCase();
  const textW = ctx.measureText(label).width + (dot ? 16 : 0);
  const w = textW + 28;
  const h = 34;
  ctx.fillStyle = "rgba(255,255,255,0.1)";
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fill();
  let tx = x + 14;
  if (dot) {
    ctx.fillStyle = dot;
    ctx.beginPath();
    ctx.arc(tx + 4, y + h / 2, 4, 0, Math.PI * 2);
    ctx.fill();
    tx += 16;
  }
  ctx.fillStyle = "rgba(242,242,239,0.9)";
  ctx.textBaseline = "middle";
  ctx.fillText(label, tx, y + h / 2 + 1);
  return w;
}

const STATE_DOT = { chalk: "#b5b5b0", torque: "#50baa3", hazard: "#1eff66", flag: "#ff5a4e" } as const;

/** What the picture area draws from: a still image, or a frame of a playing video. */
export type ArtSource = HTMLImageElement | HTMLVideoElement | null;

function sourceSize(source: HTMLImageElement | HTMLVideoElement): { w: number; h: number } {
  return source instanceof HTMLVideoElement ? { w: source.videoWidth, h: source.videoHeight } : { w: source.naturalWidth, h: source.naturalHeight };
}

/** Draws only the picture area. Cheap enough to call every frame for a playing video. */
export function drawArt(ctx: CanvasRenderingContext2D, ad: Ad, source: ArtSource): void {
  const dim = ad.availability === "inactive" ? 0.4 : 1;
  ctx.save();
  // Clear the area back to the tile background, then a faint wash of the ad's own colour behind it.
  ctx.fillStyle = "#0b0b0b";
  ctx.fillRect(ART.x - 4, ART.y - 4, ART.w + 8, ART.h + 8);
  const wash = ctx.createRadialGradient(TEX_W / 2, ART.y + ART.h / 2, 20, TEX_W / 2, ART.y + ART.h / 2, ART.w * 0.75);
  wash.addColorStop(0, `${ad.palette.from}55`);
  wash.addColorStop(1, "rgba(11,11,11,0)");
  ctx.fillStyle = wash;
  ctx.fillRect(ART.x - 4, ART.y - 4, ART.w + 8, ART.h + 8);

  ctx.globalAlpha = dim;
  if (source) {
    const { w, h } = sourceSize(source);
    if (w > 0 && h > 0) {
      const scale = Math.min(ART.w / w, ART.h / h, 1.6);
      const dw = w * scale;
      const dh = h * scale;
      const dx = ART.x + (ART.w - dw) / 2;
      const dy = ART.y + (ART.h - dh) / 2;
      ctx.shadowColor = "rgba(0,0,0,0.55)";
      ctx.shadowBlur = 28;
      ctx.shadowOffsetY = 10;
      roundRect(ctx, dx, dy, dw, dh, 4);
      ctx.clip();
      ctx.drawImage(source, dx, dy, dw, dh);
    }
  }
  ctx.restore();
}

/** The whole tile: text, pills, hairlines and the picture. */
export function drawTile(ctx: CanvasRenderingContext2D, ad: Ad, fonts: Fonts, source: ArtSource): void {
  ctx.clearRect(0, 0, TEX_W, TEX_H);
  ctx.fillStyle = "#0b0b0b";
  ctx.fillRect(0, 0, TEX_W, TEX_H);
  const dim = ad.availability === "inactive" ? 0.5 : 1;

  // Top row: advertiser left, title right in mono capitals.
  ctx.textBaseline = "top";
  ctx.globalAlpha = dim;
  ctx.fillStyle = "#f2f2ef";
  ctx.font = `600 27px ${fonts.display}`;
  ctx.textAlign = "left";
  ctx.fillText(ad.advertiser, PAD, PAD + 2, TEX_W * 0.5);

  ctx.font = `400 15px ${fonts.mono}`;
  ctx.fillStyle = "rgba(242,242,239,0.72)";
  ctx.textAlign = "right";
  wrapLines(ctx, ad.title.toUpperCase(), TEX_W * 0.4, 2).forEach((line, i) => ctx.fillText(line, TEX_W - PAD, PAD + 4 + i * 22));
  ctx.textAlign = "left";
  ctx.globalAlpha = 1;

  drawArt(ctx, ad, source);

  // Bottom row: format and state pills, size on the right.
  const y = TEX_H - PAD - 34;
  const used = pill(ctx, fonts, FORMAT_META[ad.format].label, PAD, y);
  pill(ctx, fonts, AVAILABILITY_META[ad.availability].label, PAD + used + 8, y, STATE_DOT[AVAILABILITY_META[ad.availability].tone]);
  ctx.font = `400 15px ${fonts.mono}`;
  ctx.fillStyle = "rgba(242,242,239,0.55)";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText(`${ad.size.width}×${ad.size.height}`, TEX_W - PAD, y + 18);
  ctx.textAlign = "left";

  // Hairlines on the right and bottom, so tiles read as a grid.
  ctx.fillStyle = "rgba(255,255,255,0.13)";
  ctx.fillRect(TEX_W - 2, 0, 2, TEX_H);
  ctx.fillRect(0, TEX_H - 2, TEX_W, 2);
}
