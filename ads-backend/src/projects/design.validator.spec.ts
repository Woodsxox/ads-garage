import { describe, expect, it } from 'vitest';
import { sampleDesign } from '../../test/helpers/sample-design.js';
import { LIMITS, validateDesign } from './design.validator.js';

const withElement = (patch: Record<string, unknown>, index = 3) => {
  const design = sampleDesign() as { elements: Record<string, unknown>[] };
  design.elements[index] = { ...design.elements[index], ...patch };
  return design;
};

const errorsOf = (input: unknown): string[] => {
  const result = validateDesign(input);
  if (result.ok) throw new Error('expected the design to be rejected');
  return result.errors;
};

describe('validateDesign', () => {
  it('accepts a valid design and returns the same content', () => {
    const result = validateDesign(sampleDesign());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.elements).toHaveLength(4);
      expect(result.value).toMatchObject({ name: 'Spring tune-up', formatId: '300x250', status: 'draft', templateId: 'tpl-spring-sale' });
    }
  });

  it('strips unknown keys at every level', () => {
    const design = sampleDesign({ isAdmin: true, ownerId: 'x' }) as { elements: Record<string, unknown>[] };
    design.elements[1] = { ...design.elements[1], onclick: 'alert(1)', __proto__: { polluted: true } };
    const result = validateDesign(design);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).not.toHaveProperty('isAdmin');
      expect(result.value).not.toHaveProperty('ownerId');
      expect(result.value.elements[1]).not.toHaveProperty('onclick');
      expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    }
  });

  it('normalises hex colors to upper case', () => {
    const result = validateDesign(withElement({ bg: '#f2b705' }));
    expect(result.ok && result.value.elements[3]).toMatchObject({ bg: '#F2B705' });
  });

  it('rejects anything that is not a plain object', () => {
    for (const bad of [null, undefined, 'x', 42, [], [sampleDesign()]]) {
      expect(validateDesign(bad).ok).toBe(false);
    }
  });

  describe('button links', () => {
    it.each(['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'data:text/html,<script>alert(1)</script>', 'vbscript:x', 'file:///etc/passwd', '//evil.example', '/relative', 'not a url'])(
      'rejects %s',
      (href) => {
        expect(errorsOf(withElement({ href })).join()).toMatch(/elements\[3\]\.href/);
      },
    );

    it('rejects control characters used to smuggle a scheme', () => {
      expect(validateDesign(withElement({ href: 'java\u0000script:alert(1)' })).ok).toBe(false);
      expect(validateDesign(withElement({ href: 'https://example.com/\u0001' })).ok).toBe(false);
    });

    it('accepts http, https and an empty link', () => {
      for (const href of ['http://example.com', 'https://example.com/a?b=c#d', '']) {
        expect(validateDesign(withElement({ href })).ok).toBe(true);
      }
    });

    it('rejects an over-long link', () => {
      expect(validateDesign(withElement({ href: `https://example.com/${'a'.repeat(LIMITS.maxHrefLength)}` })).ok).toBe(false);
    });
  });

  describe('images', () => {
    const png = 'data:image/png;base64,iVBORw0KGgo=';

    it('accepts raster and SVG data URLs', () => {
      for (const src of [png, 'data:image/jpeg;base64,/9j/4AAQ', 'data:image/webp;base64,UklGRg==', 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=']) {
        expect(validateDesign(withElement({ src }, 2)).ok).toBe(true);
      }
    });

    it.each([
      ['a remote URL', 'https://evil.example/x.png'],
      ['a non-image data URL', 'data:text/html;base64,PHNjcmlwdD4='],
      ['an unencoded SVG data URL', 'data:image/svg+xml,<svg onload="alert(1)"/>'],
      ['a gif', 'data:image/gif;base64,R0lGODlh'],
      ['a javascript URL', 'javascript:alert(1)'],
      ['trailing junk', `${png}"onerror="alert(1)`],
    ])('rejects %s', (_label, src) => {
      expect(errorsOf(withElement({ src }, 2)).join()).toMatch(/elements\[2\]\.src/);
    });

    it('rejects an image over the size cap', () => {
      const big = `data:image/png;base64,${'A'.repeat(LIMITS.maxImageChars)}`;
      expect(errorsOf(withElement({ src: big }, 2)).join()).toMatch(/too large/);
    });

    it('rejects a design whose images add up to too much', () => {
      const chunk = `data:image/png;base64,${'A'.repeat(2_000_000)}`;
      const design = sampleDesign() as { elements: Record<string, unknown>[] };
      design.elements = [0, 1, 2, 3].map((i) => ({ ...(withElement({}, 2).elements[2] as object), id: `img-${i}`, src: chunk }));
      expect(errorsOf(design).join()).toMatch(/images are too large in total/);
    });
  });

  describe('canvas and format', () => {
    it('rejects an unknown format', () => {
      expect(errorsOf(sampleDesign({ formatId: '123x456' })).join()).toMatch(/formatId/);
    });

    it('rejects a canvas that does not match its format', () => {
      expect(errorsOf(sampleDesign({ width: 301 })).join()).toMatch(/must be 300×250/);
    });
  });

  describe('limits and types', () => {
    it('rejects duplicate element ids', () => {
      const design = sampleDesign() as { elements: Record<string, unknown>[] };
      design.elements[1].id = 'el-1';
      expect(errorsOf(design).join()).toMatch(/unique/);
    });

    it('rejects too many elements', () => {
      const one = (sampleDesign() as { elements: Record<string, unknown>[] }).elements[0];
      const elements = Array.from({ length: LIMITS.maxElements + 1 }, (_, i) => ({ ...one, id: `s-${i}` }));
      expect(errorsOf(sampleDesign({ elements })).join()).toMatch(/at most 100 elements/);
    });

    it('rejects unknown element types, bad colors and non-finite numbers', () => {
      expect(errorsOf(withElement({ type: 'script' })).join()).toMatch(/type/);
      expect(errorsOf(withElement({ bg: 'red' })).join()).toMatch(/hex color/);
      expect(errorsOf(withElement({ bg: '#F2B705;background:url(//evil)' })).join()).toMatch(/hex color/);
      for (const x of [NaN, Infinity, '10', null]) {
        expect(validateDesign(withElement({ x })).ok).toBe(false);
      }
    });

    it('rejects out-of-range values', () => {
      expect(validateDesign(withElement({ fontSize: 5 })).ok).toBe(false);
      expect(validateDesign(withElement({ w: 0 })).ok).toBe(false);
      expect(validateDesign(withElement({ x: 1e9 })).ok).toBe(false);
    });

    it('rejects an empty name and an invalid status', () => {
      expect(validateDesign(sampleDesign({ name: '   ' })).ok).toBe(false);
      expect(validateDesign(sampleDesign({ status: 'published' })).ok).toBe(false);
    });

    it('caps how many errors it reports', () => {
      const elements = Array.from({ length: 50 }, (_, i) => ({ id: `e-${i}`, type: 'nope' }));
      expect(errorsOf(sampleDesign({ elements })).length).toBeLessThanOrEqual(25);
    });
  });
});
