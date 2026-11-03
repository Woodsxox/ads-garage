import { createHash } from 'node:crypto';
import { AiProvider, type CopyRequest, type CopyVariation, type Tone } from './ai.provider.js';

const HEADLINES: Record<Tone, string[]> = {
  friendly: ['Meet your new {topic}', 'Say hello to {topic}', '{topic}, made easy', 'Your {topic}, sorted'],
  bold: ['{topic}. No excuses.', 'Own it: {topic}', 'Built for {topic}', 'Go all in on {topic}'],
  professional: ['{topic}, done right', 'Reliable {topic}', 'The {topic} you can trust', 'Quality {topic}'],
  playful: ['Psst… {topic}!', '{topic}? Yes please', 'Fancy some {topic}?', 'All aboard the {topic} bus'],
};

const BODIES: Record<Tone, string[]> = {
  friendly: ['Simple to start and nice to use.', 'We take care of the details for you.'],
  bold: ['Stop settling. Start winning.', 'Everything you need, nothing you do not.'],
  professional: ['Trusted by teams who care about the details.', 'Clear pricing and dependable service.'],
  playful: ['Because ordinary is boring.', 'Fun, fast and surprisingly good.'],
};

const CTAS = ['Learn more', 'Get started', 'See how', 'Try it today', 'Shop now'];

/**
 * Deterministic stand-in for a model: the same request always gives the same answer, so tests are
 * stable. It is clearly not an AI. Output is built from templates seeded by a hash of the prompt.
 */
export class MockAiProvider extends AiProvider {
  async generateCopy(request: CopyRequest): Promise<CopyVariation[]> {
    const topic = topicOf(request.prompt);
    const seed = createHash('sha256').update(`${request.modelId}|${request.tone}|${request.prompt}`).digest();
    const headlines = HEADLINES[request.tone];
    const bodies = BODIES[request.tone];

    // Rotate through the templates from a seeded start, so variations differ from one another.
    return Array.from({ length: request.variations }, (_, i) => ({
      headline: fit(headlines[(seed[0] + i) % headlines.length].replace('{topic}', topic), request.maxHeadlineChars),
      body: bodies[(seed[1] + i) % bodies.length],
      cta: CTAS[(seed[2] + i) % CTAS.length],
    }));
  }
}

/** A short noun phrase from the prompt: its first few meaningful words. */
function topicOf(prompt: string): string {
  const words = prompt
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s'-]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
  return (words.slice(0, 3).join(' ') || 'your product').trim();
}

const STOP_WORDS = new Set(['the', 'and', 'for', 'with', 'that', 'this', 'our', 'your', 'ads', 'ad', 'make', 'create', 'write', 'need', 'want', 'about']);

function fit(text: string, max: number): string {
  const cleaned = text.charAt(0).toUpperCase() + text.slice(1);
  if (cleaned.length <= max) return cleaned;
  const cut = cleaned.slice(0, max - 1).replace(/\s+\S*$/, '');
  return `${cut || cleaned.slice(0, max - 1)}…`;
}
