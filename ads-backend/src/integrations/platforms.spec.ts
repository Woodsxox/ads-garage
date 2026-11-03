import { describe, expect, it } from 'vitest';
import { sampleDesign } from '../../test/helpers/sample-design.js';
import type { DesignElement } from '../projects/design.types.js';
import { checkDesignForPlatform, findPlatform, PLATFORMS } from './platforms.js';

const design = (over: Partial<{ width: number; height: number; elements: DesignElement[] }> = {}) => ({
  width: 300,
  height: 250,
  elements: (sampleDesign() as { elements: DesignElement[] }).elements,
  ...over,
});

describe('checkDesignForPlatform', () => {
  const google = findPlatform('google-ads')!;
  const byId = (checks: ReturnType<typeof checkDesignForPlatform>, id: string) => checks.find((c) => c.id === id)!;

  it('passes a listed size with a short headline', () => {
    const checks = checkDesignForPlatform(design(), google);
    expect(byId(checks, 'size').status).toBe('pass');
    expect(byId(checks, 'headline').status).toBe('pass');
  });

  it('accepts an unlisted size that matches an accepted ratio', () => {
    expect(byId(checkDesignForPlatform(design({ width: 382, height: 200 }), google), 'size').status).toBe('pass'); // 1.91:1
  });

  it('fails a size the platform does not take, and says what to try', () => {
    const size = byId(checkDesignForPlatform(design({ width: 400, height: 100 }), google), 'size');
    expect(size.status).toBe('fail');
    expect(size.detail).toContain('300×250');
  });

  it('fails a headline over the limit, using the element named headline', () => {
    const elements = design().elements.map((e) => (e.type === 'text' ? { ...e, text: 'A headline that is far too long for this platform' } : e));
    expect(byId(checkDesignForPlatform(design({ elements }), google), 'headline').status).toBe('fail');
    // The same text is fine where the limit is 100 characters.
    expect(byId(checkDesignForPlatform(design({ width: 1080, height: 1080, elements }), findPlatform('tiktok')!), 'headline').status).toBe('pass');
  });

  it('skips the headline check when there is no text', () => {
    const elements = design().elements.filter((e) => e.type !== 'text');
    expect(checkDesignForPlatform(design({ elements }), google).map((c) => c.id)).toEqual(['size']);
  });

  it('describes every platform with at least one size and a positive headline limit', () => {
    for (const platform of PLATFORMS) {
      expect(platform.specs.sizes.length).toBeGreaterThan(0);
      expect(platform.specs.maxHeadlineChars).toBeGreaterThan(0);
    }
  });
});
