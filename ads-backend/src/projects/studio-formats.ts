export interface StudioFormat {
  id: string;
  width: number;
  height: number;
  /** Needs a plan with `proFormats`. */
  pro: boolean;
}

/** Mirrors `STUDIO_FORMATS` in the web app (`lib/studio/model.ts`). Keep the two in step. */
export const STUDIO_FORMATS: readonly StudioFormat[] = [
  { id: '300x250', width: 300, height: 250, pro: false },
  { id: '336x280', width: 336, height: 280, pro: false },
  { id: '728x90', width: 728, height: 90, pro: false },
  { id: '160x600', width: 160, height: 600, pro: false },
  { id: '320x100', width: 320, height: 100, pro: false },
  { id: '300x600', width: 300, height: 600, pro: true },
  { id: '970x250', width: 970, height: 250, pro: true },
  { id: '1080x1080', width: 1080, height: 1080, pro: false },
  { id: '1200x628', width: 1200, height: 628, pro: false },
  { id: '1080x1920', width: 1080, height: 1920, pro: true },
  { id: '1280x720', width: 1280, height: 720, pro: true },
];

export const findFormat = (id: string): StudioFormat | undefined => STUDIO_FORMATS.find((f) => f.id === id);
