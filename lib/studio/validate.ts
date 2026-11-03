import type { CheckResult, Platform } from "@/lib/domain/types";
import { contrastRatio } from "@/lib/studio/color";
import type { AdDesign, ShapeEl, TextEl } from "@/lib/studio/model";

/** Checks that do not depend on a destination platform. */
export function validateDesign(design: AdDesign): CheckResult[] {
  const results: CheckResult[] = [];
  const texts = design.elements.filter((e): e is TextEl => e.type === "text");
  const shapes = design.elements.filter((e): e is ShapeEl => e.type === "shape");
  const buttons = design.elements.filter((e) => e.type === "button");
  const longSide = Math.max(design.width, design.height);

  results.push({
    id: "cta",
    label: "Has a call to action",
    status: buttons.length > 0 ? "pass" : "warn",
    detail: buttons.length > 0 ? `${buttons.length} button element${buttons.length === 1 ? "" : "s"}.` : "Add a button so viewers know the next step.",
  });

  const clipped = design.elements.filter(
    (e) => e.x < 0 || e.y < 0 || e.x + e.w > design.width || e.y + e.h > design.height,
  );
  results.push({
    id: "bounds",
    label: "Everything is inside the canvas",
    status: clipped.length === 0 ? "pass" : "warn",
    detail: clipped.length === 0 ? "No element is cropped." : `${clipped.map((e) => e.name).join(", ")} extend past the edge and will be cropped.`,
  });

  const minFont = Math.max(9, Math.round(longSide * 0.016));
  const tiny = texts.filter((t) => t.fontSize < minFont);
  results.push({
    id: "legibility",
    label: "Text is large enough",
    status: tiny.length === 0 ? "pass" : "warn",
    detail: tiny.length === 0 ? `All text is at least ${minFont}px for this canvas.` : `${tiny.map((t) => t.name).join(", ")} fall below ${minFont}px.`,
  });

  const lowContrast: string[] = [];
  for (const t of texts) {
    const cx = t.x + t.w / 2;
    const cy = t.y + t.h / 2;
    const under = [...shapes].reverse().find((s) => cx >= s.x && cx <= s.x + s.w && cy >= s.y && cy <= s.y + s.h);
    const backdrops = under ? [under.fill] : [design.background.from, design.background.to];
    const worst = Math.min(...backdrops.map((bg) => contrastRatio(t.color, bg)));
    if (worst < 4.5) lowContrast.push(`${t.name} (${worst.toFixed(1)}:1)`);
  }
  results.push({
    id: "contrast",
    label: "Text contrast is readable",
    status: lowContrast.length === 0 ? "pass" : "warn",
    detail: lowContrast.length === 0 ? "Every text element is at least 4.5:1 against its backdrop." : `Low contrast: ${lowContrast.join(", ")}. Aim for 4.5:1 or higher.`,
  });

  const unlabeled = design.elements.filter((e) => e.type === "image" && e.src && !e.alt.trim());
  results.push({
    id: "alt",
    label: "Uploaded images have alt text",
    status: unlabeled.length === 0 ? "pass" : "warn",
    detail: unlabeled.length === 0 ? "Nothing missing." : `${unlabeled.length} uploaded image${unlabeled.length === 1 ? "" : "s"} without a description.`,
  });

  return results;
}

function headlineLength(design: AdDesign): { name: string; length: number } | null {
  const texts = design.elements.filter((e): e is TextEl => e.type === "text");
  if (texts.length === 0) return null;
  const named = texts.find((t) => /headline/i.test(t.name));
  const pick = named ?? [...texts].sort((a, b) => b.fontSize - a.fontSize)[0];
  return { name: pick.name, length: pick.text.length };
}

/** Platform-specific checks, driven by the (illustrative) platform spec. */
export function validateForPlatform(design: AdDesign, platform: Platform): CheckResult[] {
  const { specs } = platform;
  const ratio = design.width / design.height;
  const exact = specs.sizes.some((s) => s.width === design.width && s.height === design.height);
  const ratioMatch = specs.ratios.find((r) => Math.abs(r.value - ratio) / r.value < 0.03);

  const results: CheckResult[] = [
    {
      id: "size",
      label: "Size or aspect ratio accepted",
      status: exact ? "pass" : ratioMatch ? "pass" : "fail",
      detail: exact
        ? `${design.width}×${design.height} is a listed size.`
        : ratioMatch
          ? `Matches the ${ratioMatch.label} ratio. Export at a listed size for best results.`
          : `Not accepted. Try ${specs.sizes.map((s) => `${s.width}×${s.height}`).join(", ")}.`,
    },
  ];

  const headline = headlineLength(design);
  if (headline) {
    results.push({
      id: "headline",
      label: `Headline within ${specs.maxHeadlineChars} characters`,
      status: headline.length <= specs.maxHeadlineChars ? "pass" : "fail",
      detail: `“${headline.name}” is ${headline.length} characters.`,
    });
  }

  if (platform.id === "youtube" || platform.id === "tiktok") {
    results.push({
      id: "video",
      label: "Video file supplied separately",
      status: "warn",
      detail:
        platform.id === "youtube"
          ? "This design is a poster or companion image. The video must already be on YouTube."
          : "This design is an image creative. Video ads need a video file prepared outside the studio.",
    });
  }

  return [...results, ...validateDesign(design)];
}

export function summarize(results: CheckResult[]): { fail: number; warn: number; pass: number } {
  return {
    fail: results.filter((r) => r.status === "fail").length,
    warn: results.filter((r) => r.status === "warn").length,
    pass: results.filter((r) => r.status === "pass").length,
  };
}
