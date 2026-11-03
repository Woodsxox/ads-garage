import type { DesignElement, TextElement } from '../projects/design.types.js';

export const PLATFORM_IDS = ['google-ads', 'youtube', 'tiktok', 'meta'] as const;
export type PlatformId = (typeof PLATFORM_IDS)[number];

export interface PlatformSpec {
  sizes: { width: number; height: number }[];
  ratios: { label: string; value: number }[];
  maxHeadlineChars: number;
}

export interface Platform {
  id: PlatformId;
  name: string;
  specs: PlatformSpec;
}

/**
 * Creative specs per platform. They mirror `lib/demo/platforms.ts` in the web app and are
 * ILLUSTRATIVE PLACEHOLDERS: they have not been checked against each platform's current API
 * documentation. Verify every number before any real publishing is switched on.
 */
export const PLATFORMS: readonly Platform[] = [
  {
    id: 'google-ads',
    name: 'Google Ads',
    specs: {
      sizes: [
        { width: 300, height: 250 },
        { width: 336, height: 280 },
        { width: 728, height: 90 },
        { width: 160, height: 600 },
        { width: 300, height: 600 },
        { width: 320, height: 100 },
        { width: 970, height: 250 },
      ],
      ratios: [
        { label: '1.91:1 landscape', value: 1.91 },
        { label: '1:1 square', value: 1 },
      ],
      maxHeadlineChars: 30,
    },
  },
  {
    id: 'youtube',
    name: 'YouTube Ads',
    specs: { sizes: [{ width: 1280, height: 720 }], ratios: [{ label: '16:9 poster', value: 16 / 9 }], maxHeadlineChars: 40 },
  },
  {
    id: 'tiktok',
    name: 'TikTok Ads',
    specs: {
      sizes: [
        { width: 1080, height: 1920 },
        { width: 1080, height: 1080 },
      ],
      ratios: [
        { label: '9:16 vertical', value: 9 / 16 },
        { label: '1:1 square', value: 1 },
      ],
      maxHeadlineChars: 100,
    },
  },
  {
    id: 'meta',
    name: 'Meta Ads',
    specs: {
      sizes: [
        { width: 1080, height: 1080 },
        { width: 1200, height: 628 },
        { width: 1080, height: 1920 },
      ],
      ratios: [
        { label: '1:1 square', value: 1 },
        { label: '1.91:1 landscape', value: 1.91 },
        { label: '9:16 story', value: 9 / 16 },
      ],
      maxHeadlineChars: 40,
    },
  },
];

export const findPlatform = (id: string): Platform | undefined => PLATFORMS.find((p) => p.id === id);

export interface PlatformCheck {
  id: 'size' | 'headline';
  label: string;
  status: 'pass' | 'fail';
  detail: string;
}

/** The headline is the text named "headline", or else the largest text on the canvas. */
function headlineOf(elements: DesignElement[]): TextElement | null {
  const texts = elements.filter((e): e is TextElement => e.type === 'text');
  if (texts.length === 0) return null;
  return texts.find((t) => /headline/i.test(t.name)) ?? [...texts].sort((a, b) => b.fontSize - a.fontSize)[0];
}

/**
 * Hard requirements only: a design that fails these would be rejected by the platform, so the API
 * refuses to submit it. Softer advice (contrast, legibility) stays in the web app as warnings.
 */
export function checkDesignForPlatform(
  design: { width: number; height: number; elements: DesignElement[] },
  platform: Platform,
): PlatformCheck[] {
  const { specs } = platform;
  const ratio = design.width / design.height;
  const exact = specs.sizes.some((s) => s.width === design.width && s.height === design.height);
  const ratioMatch = specs.ratios.find((r) => Math.abs(r.value - ratio) / r.value < 0.03);

  const checks: PlatformCheck[] = [
    {
      id: 'size',
      label: 'Size or aspect ratio accepted',
      status: exact || ratioMatch ? 'pass' : 'fail',
      detail: exact || ratioMatch ? `${design.width}×${design.height} is accepted.` : `Not accepted. Try ${specs.sizes.map((s) => `${s.width}×${s.height}`).join(', ')}.`,
    },
  ];

  const headline = headlineOf(design.elements);
  if (headline) {
    const length = headline.text.length;
    checks.push({
      id: 'headline',
      label: `Headline within ${specs.maxHeadlineChars} characters`,
      status: length <= specs.maxHeadlineChars ? 'pass' : 'fail',
      detail: `"${headline.name}" is ${length} characters.`,
    });
  }
  return checks;
}
