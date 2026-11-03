import { imageSrc } from "@/lib/studio/codegen";
import { type AdDesign, FONT_STACKS } from "@/lib/studio/model";

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const out: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(" ")) {
      const candidate = line ? `${line} ${word}` : word;
      if (ctx.measureText(candidate).width <= maxWidth || !line) {
        line = candidate;
        // Break words that are wider than the box on their own.
        while (ctx.measureText(line).width > maxWidth && line.length > 1) {
          let cut = line.length - 1;
          while (cut > 1 && ctx.measureText(line.slice(0, cut)).width > maxWidth) cut--;
          out.push(line.slice(0, cut));
          line = line.slice(cut);
        }
      } else {
        out.push(line);
        line = word;
      }
    }
    out.push(line);
  }
  return out;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image could not be loaded for export."));
    img.src = src;
  });
}

function drawFit(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  fit: "cover" | "contain",
) {
  const iw = img.naturalWidth || w;
  const ih = img.naturalHeight || h;
  const scale = fit === "cover" ? Math.max(w / iw, h / ih) : Math.min(w / iw, h / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

/** Draws the design on a canvas. Mirrors the CSS in `codegen.elementStyle`. */
export async function renderDesignToCanvas(design: AdDesign, scale = 1): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(design.width * scale);
  canvas.height = Math.round(design.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available in this browser.");
  ctx.scale(scale, scale);

  const { background: bg } = design;
  if (bg.kind === "solid") {
    ctx.fillStyle = bg.from;
  } else {
    const a = (bg.angle * Math.PI) / 180;
    const dx = Math.sin(a);
    const dy = -Math.cos(a);
    const len = Math.abs(design.width * dx) + Math.abs(design.height * dy);
    const cx = design.width / 2;
    const cy = design.height / 2;
    const grad = ctx.createLinearGradient(cx - (dx * len) / 2, cy - (dy * len) / 2, cx + (dx * len) / 2, cy + (dy * len) / 2);
    grad.addColorStop(0, bg.from);
    grad.addColorStop(1, bg.to);
    ctx.fillStyle = grad;
  }
  ctx.fillRect(0, 0, design.width, design.height);

  for (const el of design.elements) {
    ctx.save();
    switch (el.type) {
      case "shape":
        ctx.globalAlpha = el.opacity;
        ctx.fillStyle = el.fill;
        roundRectPath(ctx, el.x, el.y, el.w, el.h, el.radius);
        ctx.fill();
        break;
      case "image": {
        roundRectPath(ctx, el.x, el.y, el.w, el.h, el.radius);
        ctx.clip();
        const img = await loadImage(imageSrc(el));
        drawFit(ctx, img, el.x, el.y, el.w, el.h, el.fit);
        break;
      }
      case "button": {
        ctx.fillStyle = el.bg;
        roundRectPath(ctx, el.x, el.y, el.w, el.h, el.radius);
        ctx.fill();
        ctx.clip();
        ctx.fillStyle = el.color;
        ctx.font = `700 ${el.fontSize}px ${FONT_STACKS.sans}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(el.label, el.x + el.w / 2, el.y + el.h / 2, el.w);
        break;
      }
      case "text": {
        ctx.beginPath();
        ctx.rect(el.x, el.y, el.w, el.h);
        ctx.clip();
        ctx.fillStyle = el.color;
        ctx.font = `${el.weight} ${el.fontSize}px ${FONT_STACKS[el.font]}`;
        ctx.textBaseline = "middle";
        ctx.textAlign = el.align;
        const text = el.uppercase ? el.text.toUpperCase() : el.text;
        const lh = el.fontSize * el.lineHeight;
        const x = el.align === "left" ? el.x : el.align === "center" ? el.x + el.w / 2 : el.x + el.w;
        wrap(ctx, text, el.w).forEach((line, i) => {
          ctx.fillText(line, x, el.y + i * lh + lh / 2);
        });
        break;
      }
    }
    ctx.restore();
  }
  return canvas;
}

export async function renderDesignToPng(design: AdDesign, scale = 1): Promise<Blob> {
  const canvas = await renderDesignToCanvas(design, scale);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("PNG export failed."))), "image/png");
  });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
