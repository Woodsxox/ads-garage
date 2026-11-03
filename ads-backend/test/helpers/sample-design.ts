/** A valid design with one of each element, in the shape the editor sends. */
export function sampleDesign(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    name: 'Spring tune-up',
    formatId: '300x250',
    width: 300,
    height: 250,
    status: 'draft',
    templateId: 'tpl-spring-sale',
    background: { kind: 'gradient', from: '#2F4A3A', to: '#16241B', angle: 145 },
    elements: [
      { id: 'el-1', type: 'shape', name: 'Panel', x: 0, y: 0, w: 300, h: 40, fill: '#F2B705', radius: 0, opacity: 1 },
      { id: 'el-2', type: 'text', name: 'Headline', x: 16, y: 60, w: 200, h: 60, text: 'Spring tune-up sale', fontSize: 24, weight: 700, color: '#FFFFFF', align: 'left', font: 'sans', uppercase: false, lineHeight: 1.15 },
      { id: 'el-3', type: 'image', name: 'Hero', x: 200, y: 60, w: 80, h: 80, src: null, placeholder: 'wrench', tint: '#F2B705', fit: 'contain', radius: 0, alt: '' },
      { id: 'el-4', type: 'button', name: 'CTA', x: 16, y: 190, w: 120, h: 36, label: 'Shop the sale', bg: '#F2B705', color: '#1C1E22', radius: 4, fontSize: 16, href: 'https://example.com' },
    ],
    ...overrides,
  };
}
