import JSZip from "jszip";
import {
  AD_FORMATS,
  dimensionString,
  getFormat,
  isValidFormatId,
  type PlacementId,
} from "@/lib/ad-sizes";

export type ExportPlatform = "wordpress" | "nextjs" | "html" | "shopify";

export type SlotStyle = {
  align: "left" | "center" | "right";
  maxWidth: "unit" | "container";
  padding: "compact" | "comfortable";
  surface: "transparent" | "panel";
};

export type ExportInput = {
  platform: ExportPlatform;
  formatId: string;
  placement: PlacementId;
  density: number;
  publisherId: string;
  slotId: string;
  style: SlotStyle;
};

export type ChecklistItem = {
  id: string;
  ok: boolean;
  label: string;
  detail: string;
};

export type ExportFile = {
  name: string;
  contents: string;
};

function sanitizePublisherId(value: string): string {
  const trimmed = value.trim();
  if (/^ca-pub-\d{16}$/.test(trimmed)) return trimmed;
  return trimmed;
}

function cssForStyle(input: ExportInput): string {
  const format = getFormat(input.formatId);
  const pad = input.style.padding === "compact" ? "8px" : "16px 0";
  const margin =
    input.style.align === "center"
      ? "0 auto"
      : input.style.align === "right"
        ? "0 0 0 auto"
        : "0";
  const maxWidth =
    input.style.maxWidth === "container" ? "100%" : `${format.width}px`;
  const bg =
    input.style.surface === "panel" ? "background: #f6f6f4;" : "background: transparent;";

  return `.ad-garage-slot {
  display: block;
  box-sizing: border-box;
  width: 100%;
  max-width: ${maxWidth};
  min-height: ${format.height}px;
  margin: ${margin};
  padding: ${pad};
  ${bg}
  text-align: ${input.style.align};
}

.ad-garage-slot ins.adsbygoogle {
  display: block;
}
`;
}

function htmlSnippet(input: ExportInput): string {
  const format = getFormat(input.formatId);
  const publisherId = sanitizePublisherId(input.publisherId);
  const slotId = input.slotId.trim();

  if (format.kind === "in-article") {
    return `<!-- Ad Garage export — in-article. Paste into the body of a real article. -->
<aside class="ad-garage-slot" aria-label="Advertisement">
  <ins class="adsbygoogle"
       style="display:block; text-align:center;"
       data-ad-layout="in-article"
       data-ad-format="fluid"
       data-ad-client="${publisherId}"
       data-ad-slot="${slotId}"></ins>
</aside>
<script>
  (function () {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {}
  })();
</script>
`;
  }

  if (format.kind === "in-feed") {
    return `<!-- Ad Garage export — in-feed. Place inside a list of posts, never on a demo page. -->
<aside class="ad-garage-slot" aria-label="Advertisement">
  <ins class="adsbygoogle"
       style="display:block;"
       data-ad-format="fluid"
       data-ad-layout-key="-fb+5w+4e-db+86"
       data-ad-client="${publisherId}"
       data-ad-slot="${slotId}"></ins>
</aside>
<script>
  (function () {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {}
  })();
</script>
`;
  }

  if (format.kind === "responsive") {
    return `<!-- Ad Garage export — responsive. Load adsbygoogle.js once per page. -->
<aside class="ad-garage-slot" aria-label="Advertisement">
  <ins class="adsbygoogle"
       style="display:block"
       data-ad-client="${publisherId}"
       data-ad-slot="${slotId}"
       data-ad-format="auto"
       data-full-width-responsive="true"></ins>
</aside>
<script>
  (function () {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {}
  })();
</script>
`;
  }

  return `<!-- Ad Garage export — ${dimensionString(format)} ${input.placement}. -->
<aside class="ad-garage-slot" aria-label="Advertisement">
  <ins class="adsbygoogle"
       style="display:inline-block;width:${format.width}px;height:${format.height}px"
       data-ad-client="${publisherId}"
       data-ad-slot="${slotId}"></ins>
</aside>
<script>
  (function () {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {}
  })();
</script>
`;
}

function nextjsSnippet(input: ExportInput): string {
  const format = getFormat(input.formatId);
  const publisherId = sanitizePublisherId(input.publisherId);
  const slotId = input.slotId.trim();
  const layout =
    format.kind === "in-article"
      ? `        data-ad-layout="in-article"
        data-ad-format="fluid"`
      : format.kind === "in-feed"
        ? `        data-ad-format="fluid"
        data-ad-layout-key="-fb+5w+4e-db+86"`
        : format.kind === "responsive"
          ? `        data-ad-format="auto"
        data-full-width-responsive="true"`
          : `        style={{ display: "inline-block", width: ${format.width}, height: ${format.height} }}`;

  return `"use client";

import { useEffect, useRef } from "react";

type Props = { className?: string };

export function SiteAd({ className }: Props) {
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    pushed.current = true;
    try {
      const w = window as Window & { adsbygoogle?: unknown[] };
      (w.adsbygoogle = w.adsbygoogle || []).push({});
    } catch {
      // A thrown adsbygoogle error must never break the page.
    }
  }, []);

  return (
    <aside className={className ?? "ad-garage-slot"} aria-label="Advertisement">
      <ins
        className="adsbygoogle"
        data-ad-client="${publisherId}"
        data-ad-slot="${slotId}"
${layout}
      />
    </aside>
  );
}
`;
}

function scriptTag(publisherId: string): string {
  return `<script async crossorigin="anonymous"
  src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${sanitizePublisherId(publisherId)}"></script>
`;
}

export function buildChecklist(input: ExportInput): ChecklistItem[] {
  const publisherOk = /^ca-pub-\d{16}$/.test(input.publisherId.trim());
  const slotOk = /^\d{7,12}$/.test(input.slotId.trim());
  const sizeOk = isValidFormatId(input.formatId);
  const format = sizeOk ? getFormat(input.formatId) : AD_FORMATS[0];
  const tooSmall = sizeOk && format.kind === "fixed" && Math.min(format.width, format.height) < 200;
  const densityOk = input.density <= 3;
  const stickyInteractive = input.placement === "sticky-footer";

  return [
    {
      id: "publisher",
      ok: publisherOk,
      label: "Publisher ID present",
      detail: publisherOk
        ? `Using ${input.publisherId.trim()}`
        : "Enter a ca-pub- ID with 16 digits. Ad Garage never embeds its own publisher ID.",
    },
    {
      id: "slot",
      ok: slotOk,
      label: "Slot ID present",
      detail: slotOk
        ? `Slot ${input.slotId.trim()}`
        : "Paste the numeric AdSense slot ID from your account. Do not leave this blank.",
    },
    {
      id: "size",
      ok: sizeOk && !tooSmall,
      label: "Size valid",
      detail:
        sizeOk && !tooSmall
          ? `${format.label} is a size AdSense actually fills.`
          : "Only offer sizes AdSense fills. Smallest reliable square is 200×200.",
    },
    {
      id: "interactive",
      ok: !stickyInteractive,
      label: "Not placed adjacent to interactive elements",
      detail: stickyInteractive
        ? "Sticky footers sit on top of buttons, forms, and app CTAs. Move this unit into the article body or a sidebar."
        : "Header / in-content / sidebar placements keep the unit out of the tap path of buttons and forms.",
    },
    {
      id: "density",
      ok: densityOk,
      label: "Density sane",
      detail: densityOk
        ? `${input.density} slot(s) per page stays inside a readable layout.`
        : `${input.density} slots per page crowds the article. Drop to 3 or fewer before you ship.`,
    },
  ];
}

function readmeFor(input: ExportInput, checklist: ChecklistItem[]): string {
  const format = getFormat(input.formatId);
  const failed = checklist.filter((item) => !item.ok);

  const platformSteps: Record<ExportPlatform, string> = {
    wordpress: `WordPress
1. Appearance → Theme File Editor is the wrong tool. Use a Custom HTML block or a well-supported ads plugin that pastes HTML.
2. Add the script tag from adsense-script.html ONCE in the site <head> (Site Kit, Insert Headers, or your theme’s head hook).
3. Paste snippet.html into a Custom HTML block at the ${input.placement} placement — inside a real post, not on a “demo ads” page.
4. Do not wrap the block in animation plugins, sliders, or sticky-on-scroll toys.`,
    nextjs: `Next.js
1. Put adsense-script in app/layout.tsx with next/script strategy="afterInteractive". Load it once.
2. Copy SiteAd.tsx into your project. Import it only on editorial routes (blog posts, guides).
3. Never import SiteAd into a showroom, playground, or preview canvas.
4. Do not wrap SiteAd or its ancestors in framer-motion / GSAP / CSS transform animations.`,
    html: `Plain HTML
1. Paste adsense-script.html immediately before </head> on article pages only, once per page.
2. Paste snippet.html where the ad should sit in the article.
3. Keep the wrapper static. No CSS transitions on the unit or its parents.`,
    shopify: `Shopify
1. Online Store → Themes → Edit code → theme.liquid: paste adsense-script.html once in <head>.
2. Add snippet.html via a Custom Liquid section on article templates — not on a landing page whose job is to show ads.
3. Leave the section unanimated in the theme editor.`,
  };

  return `# Ad Garage install — ${input.platform} / ${format.label}

This bundle contains YOUR publisher ID and slot ID. Ad Garage does not embed its own ad code in customer exports.

## Pre-flight
${checklist.map((item) => `- [${item.ok ? "x" : " "}] ${item.label} — ${item.detail}`).join("\n")}
${failed.length ? `\nDo not deploy until every box is checked. Shipping a failing checklist is how accounts get limited.\n` : ""}
## Install
${platformSteps[input.platform]}

## Policy that will get you banned if ignored
- Do not put this code on a page whose purpose is displaying ads.
- Do not animate the unit. Do not auto-refresh it. Do not rotate it across exclusive networks.
- Do not click your own ads. Do not ask anyone to click them to “test”.
- One adsbygoogle.js load per page. Push once per unit.

## Layout
- Placement: ${input.placement}
- Density requested: ${input.density} slot(s)/page
- Format: ${dimensionString(format)}
`;
}

export function buildExportFiles(input: ExportInput): ExportFile[] {
  const checklist = buildChecklist(input);
  const publisherId = sanitizePublisherId(input.publisherId);
  const files: ExportFile[] = [
    { name: "snippet.html", contents: htmlSnippet(input) },
    { name: "ad-garage-slot.css", contents: cssForStyle(input) },
    { name: "adsense-script.html", contents: scriptTag(publisherId) },
    { name: "PREFLIGHT.md", contents: readmeFor(input, checklist) },
    {
      name: "checklist.json",
      contents: JSON.stringify({ input, checklist }, null, 2) + "\n",
    },
  ];

  if (input.platform === "nextjs") {
    files.push({ name: "SiteAd.tsx", contents: nextjsSnippet(input) });
  }

  return files;
}

export async function zipExport(input: ExportInput): Promise<Blob> {
  const zip = new JSZip();
  for (const file of buildExportFiles(input)) {
    zip.file(file.name, file.contents);
  }
  return zip.generateAsync({ type: "blob" });
}

export async function downloadExport(input: ExportInput): Promise<void> {
  const blob = await zipExport(input);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `ad-garage-${input.platform}-${input.formatId}.zip`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
