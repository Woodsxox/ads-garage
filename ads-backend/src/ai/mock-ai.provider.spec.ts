import { describe, expect, it } from 'vitest';
import type { CopyRequest } from './ai.provider.js';
import { MockAiProvider } from './mock-ai.provider.js';

const request = (over: Partial<CopyRequest> = {}): CopyRequest => ({
  prompt: 'winter tire fitting for small garages',
  tone: 'friendly',
  variations: 3,
  maxHeadlineChars: 40,
  modelId: 'garage-draft',
  ...over,
});

describe('MockAiProvider', () => {
  const provider = new MockAiProvider();

  it('is deterministic: the same request gives the same answer', async () => {
    expect(await provider.generateCopy(request())).toEqual(await provider.generateCopy(request()));
  });

  it('returns the requested number of variations with every field filled', async () => {
    const out = await provider.generateCopy(request({ variations: 5 }));
    expect(out).toHaveLength(5);
    for (const v of out) {
      expect(v.headline.length).toBeGreaterThan(0);
      expect(v.body.length).toBeGreaterThan(0);
      expect(v.cta.length).toBeGreaterThan(0);
    }
  });

  it('gives different headlines across the first variations', async () => {
    const out = await provider.generateCopy(request({ variations: 4 }));
    expect(new Set(out.map((v) => v.headline)).size).toBe(4);
  });

  it('keeps headlines within the character limit', async () => {
    for (const max of [10, 18, 40]) {
      const out = await provider.generateCopy(request({ maxHeadlineChars: max, prompt: 'an extraordinarily long product name for testing truncation' }));
      for (const v of out) expect(v.headline.length).toBeLessThanOrEqual(max);
    }
  });

  it('copes with prompts that contain no usable words or odd characters', async () => {
    for (const prompt of ['a', '!!!', '日本語のテキスト', '<script>alert(1)</script>']) {
      const out = await provider.generateCopy(request({ prompt }));
      expect(out).toHaveLength(3);
    }
  });
});
