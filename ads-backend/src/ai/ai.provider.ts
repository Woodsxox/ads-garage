export type Tone = 'friendly' | 'bold' | 'professional' | 'playful';
export const TONES: readonly Tone[] = ['friendly', 'bold', 'professional', 'playful'];

export interface CopyRequest {
  /** What the ad is for, in the user's words. */
  prompt: string;
  tone: Tone;
  variations: number;
  maxHeadlineChars: number;
  modelId: string;
}

export interface CopyVariation {
  headline: string;
  body: string;
  cta: string;
}

export class AiProviderError extends Error {}

/**
 * A text-generation backend. The real implementation calls a model API; the mock is deterministic.
 * Everything around it (plan checks, metering, validation) lives in `AiService`, not here, so a
 * provider only has to turn a request into variations.
 */
export abstract class AiProvider {
  abstract generateCopy(request: CopyRequest): Promise<CopyVariation[]>;
}
