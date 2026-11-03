import { esc } from "@/lib/ads/ad-document";
import { motifDataUri } from "@/lib/ads/motifs";
import {
  type AdDesign,
  type DesignElement,
  FONT_STACKS,
  backgroundCss,
} from "@/lib/studio/model";

export type Css = Record<string, string | number>;

/** Source of the picture shown for an image element (upload or motif placeholder). */
export function imageSrc(el: Extract<DesignElement, { type: "image" }>): string {
  return el.src ?? motifDataUri(el.placeholder, el.tint, "#FFFFFF");
}

function box(el: DesignElement): Css {
  return {
    position: "absolute",
    left: `${el.x}px`,
    top: `${el.y}px`,
    width: `${el.w}px`,
    height: `${el.h}px`,
    boxSizing: "border-box",
  };
}

/** One source of truth for how an element looks, used by the editor, HTML export and React export. */
export function elementStyle(el: DesignElement): Css {
  switch (el.type) {
    case "text":
      return {
        ...box(el),
        margin: 0,
        overflow: "hidden",
        fontFamily: FONT_STACKS[el.font],
        fontSize: `${el.fontSize}px`,
        fontWeight: el.weight,
        lineHeight: el.lineHeight,
        color: el.color,
        textAlign: el.align,
        textTransform: el.uppercase ? "uppercase" : "none",
        whiteSpace: "pre-wrap",
        overflowWrap: "break-word",
      };
    case "image":
      return {
        ...box(el),
        objectFit: el.fit,
        borderRadius: `${el.radius}px`,
        display: "block",
      };
    case "button":
      return {
        ...box(el),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: el.bg,
        color: el.color,
        borderRadius: `${el.radius}px`,
        fontFamily: FONT_STACKS.sans,
        fontSize: `${el.fontSize}px`,
        fontWeight: 700,
        textDecoration: "none",
        textAlign: "center",
        overflow: "hidden",
      };
    case "shape":
      return {
        ...box(el),
        background: el.fill,
        borderRadius: `${el.radius}px`,
        opacity: el.opacity,
      };
  }
}

export function rootStyle(design: AdDesign): Css {
  return {
    position: "relative",
    width: `${design.width}px`,
    height: `${design.height}px`,
    overflow: "hidden",
    background: backgroundCss(design.background),
  };
}

const kebab = (key: string) => key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

function cssText(style: Css): string {
  return Object.entries(style)
    .map(([k, v]) => `${kebab(k)}:${v}`)
    .join(";");
}

/* ───────────── HTML ───────────── */

type HtmlOptions = {
  /** Preview mode drops href so clicks inside a preview frame go nowhere. */
  preview?: boolean;
};

function elementHtml(el: DesignElement, opts: HtmlOptions, indent: string): string {
  const style = esc(cssText(elementStyle(el)));
  switch (el.type) {
    case "text":
      return `${indent}<div style="${style}">${esc(el.text)}</div>`;
    case "image":
      return `${indent}<img src="${esc(imageSrc(el))}" alt="${esc(el.alt)}" style="${style}">`;
    case "button":
      return opts.preview
        ? `${indent}<a role="button" style="${style}">${esc(el.label)}</a>`
        : `${indent}<a href="${esc(el.href)}" target="_blank" rel="noopener noreferrer sponsored" style="${style}">${esc(el.label)}</a>`;
    case "shape":
      return `${indent}<div style="${style}"></div>`;
  }
}

export function designToHtmlFragment(design: AdDesign, opts: HtmlOptions = {}): string {
  const inner = design.elements.map((el) => elementHtml(el, opts, "  ")).join("\n");
  return `<div class="ad-garage-ad" role="group" aria-label="Advertisement" style="${esc(cssText(rootStyle(design)))}">\n${inner}\n</div>`;
}

export function designToHtmlDocument(design: AdDesign, opts: HtmlOptions & { csp?: boolean } = {}): string {
  const csp = opts.csp
    ? `\n<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:">`
    : "";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">${csp}
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(design.name)}</title>
<style>body{margin:0;display:grid;place-items:center;min-height:100vh;background:#f2f0ea}</style>
</head>
<body>
${designToHtmlFragment(design, opts)}
</body>
</html>
`;
}

/** A preview page: the ad alone, or placed inside a mock article at a given device width. */
export function designToPreviewDocument(
  design: AdDesign,
  mode: "ad" | "context",
  contentWidth: number,
): string {
  const fragment = designToHtmlFragment(design, { preview: true });
  if (mode === "ad") {
    return designToHtmlDocument(design, { preview: true, csp: true });
  }
  const bars = (n: number) =>
    Array.from({ length: n }, (_, i) => `<i style="width:${96 - ((i * 13) % 28)}%"></i>`).join("");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:">
<title>${esc(design.name)} in context</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#f7f5f0;color:#1c1e22;font-family:system-ui,sans-serif}
.page{max-width:${contentWidth}px;margin:0 auto;padding:20px}
h1{font:700 26px/1.15 Georgia,serif;margin:0 0 8px}.meta{font-size:12px;color:#6b6a63;margin-bottom:16px}
i{display:block;height:9px;background:#d8d5cc;border-radius:2px;margin:10px 0}
.slot{margin:22px auto;text-align:center;overflow:auto}
.lab{font:600 9px ui-monospace,monospace;letter-spacing:.14em;text-transform:uppercase;color:#8a887f;margin-bottom:6px}
.slot .wrap{display:inline-block;text-align:left}
</style></head>
<body><div class="page">
<h1>Winterizing a single-bay workshop</h1><div class="meta">Illustrative article · not a real page</div>
${bars(5)}
<div class="slot"><div class="lab">Advertisement</div><div class="wrap">${fragment}</div></div>
${bars(7)}
</div></body></html>`;
}

/* ───────────── React ───────────── */

function styleLiteral(style: Css, pad: string): string {
  const lines = Object.entries(style).map(([k, v]) => `${pad}  ${k}: ${JSON.stringify(v)},`);
  return `{\n${lines.join("\n")}\n${pad}}`;
}

export function designToReact(design: AdDesign): string {
  const lines: string[] = [];
  for (const el of design.elements) {
    const pad = "      ";
    const style = styleLiteral(elementStyle(el), pad);
    switch (el.type) {
      case "text":
        lines.push(`${pad}<div style={${style}}>{${JSON.stringify(el.text)}}</div>`);
        break;
      case "image":
        lines.push(`${pad}{/* eslint-disable-next-line @next/next/no-img-element */}\n${pad}<img src={${JSON.stringify(imageSrc(el))}} alt={${JSON.stringify(el.alt)}} style={${style}} />`);
        break;
      case "button":
        lines.push(`${pad}<a href=${JSON.stringify(el.href)} target="_blank" rel="noopener noreferrer sponsored" style={${style}}>{${JSON.stringify(el.label)}}</a>`);
        break;
      case "shape":
        lines.push(`${pad}<div style={${style}} />`);
        break;
    }
  }
  const name = design.name.replace(/[^a-zA-Z0-9]+/g, " ").trim().split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("") || "AdUnit";
  const component = /^[A-Za-z]/.test(name) ? name : `Ad${name}`;
  return `export function ${component}() {
  return (
    <div role="group" aria-label="Advertisement" style={${styleLiteral(rootStyle(design), "    ")}}>
${lines.join("\n")}
    </div>
  );
}
`;
}

/** Shortens embedded image data for display, never for copying or downloading. */
export function maskDataUris(code: string): string {
  return code.replace(/data:[a-z/+.-]+;[^"')\s]{160,}/gi, (m) => `${m.slice(0, 40)}…[embedded image]`);
}
