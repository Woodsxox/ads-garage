"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ColorField, Field, NumberField, SelectField, TextField } from "@/components/studio/fields";
import { Icon } from "@/components/ui/Icon";
import type { MotifName } from "@/lib/domain/types";
import { fileToDataUrl } from "@/lib/studio/upload";
import {
  type AdDesign,
  type Background,
  type DesignElement,
  FONT_LABELS,
  type FontKey,
} from "@/lib/studio/model";

const MOTIFS: { value: MotifName; label: string }[] = [
  { value: "wrench", label: "Wrench" },
  { value: "wheel", label: "Wheel" },
  { value: "cup", label: "Cup" },
  { value: "paint", label: "Paint can" },
  { value: "bolt", label: "Bolt" },
  { value: "gauge", label: "Gauge" },
];

const FONT_OPTIONS = (Object.keys(FONT_LABELS) as FontKey[]).map((value) => ({ value, label: FONT_LABELS[value] }));
const WEIGHTS = [
  { value: 400, label: "Regular" },
  { value: 600, label: "Semibold" },
  { value: 700, label: "Bold" },
  { value: 900, label: "Black" },
] as const;

type Props = {
  design: AdDesign;
  element: DesignElement | null;
  onElement: (patch: Partial<DesignElement>) => void;
  onBackground: (patch: Partial<Background>) => void;
};

export function Inspector({ design, element, onElement, onBackground }: Props) {
  if (!element) {
    const bg = design.background;
    return (
      <div className="flex flex-col gap-3" aria-label="Canvas settings">
        <h2 className="font-display text-sm tracking-[0.04em]">Canvas</h2>
        <p className="font-mono text-[11px] text-chalk/55">
          {design.width}×{design.height}px · select an element to edit it
        </p>
        <SelectField
          id="bg-kind"
          label="Background"
          value={bg.kind}
          options={[
            { value: "gradient", label: "Gradient" },
            { value: "solid", label: "Solid" },
          ]}
          onChange={(kind) => onBackground({ kind })}
        />
        <ColorField id="bg-from" label={bg.kind === "solid" ? "Color" : "From"} value={bg.from} onChange={(from) => onBackground({ from })} />
        {bg.kind === "gradient" ? (
          <>
            <ColorField id="bg-to" label="To" value={bg.to} onChange={(to) => onBackground({ to })} />
            <NumberField id="bg-angle" label="Angle (deg)" value={bg.angle} min={0} max={360} onChange={(angle) => onBackground({ angle })} />
          </>
        ) : null}
      </div>
    );
  }

  const patch = (p: Record<string, unknown>) => onElement(p as Partial<DesignElement>);

  return (
    <div className="flex flex-col gap-3" aria-label="Element settings">
      <h2 className="font-display text-sm tracking-[0.04em]">{element.type}</h2>
      <TextField id="el-name" label="Layer name" value={element.name} onChange={(name) => patch({ name })} />

      {element.type === "text" ? (
        <>
          <TextField id="el-text" label="Text" value={element.text} multiline onChange={(text) => patch({ text })} />
          <div className="grid grid-cols-2 gap-2">
            <SelectField id="el-font" label="Font" value={element.font} options={FONT_OPTIONS} onChange={(font) => patch({ font })} />
            <SelectField id="el-weight" label="Weight" value={element.weight} options={WEIGHTS} onChange={(weight) => patch({ weight })} />
            <NumberField id="el-size" label="Size (px)" value={element.fontSize} min={6} max={400} onChange={(fontSize) => patch({ fontSize })} />
            <NumberField id="el-lh" label="Line height" value={element.lineHeight} min={0.8} max={3} step={0.05} onChange={(lineHeight) => patch({ lineHeight })} />
          </div>
          <ColorField id="el-color" label="Color" value={element.color} onChange={(color) => patch({ color })} />
          <Field label="Align">
            <div className="flex gap-1" role="group" aria-label="Text align">
              {(["left", "center", "right"] as const).map((align) => (
                <button
                  key={align}
                  type="button"
                  aria-pressed={element.align === align}
                  onClick={() => patch({ align })}
                  className={`flex-1 border px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.04em] ${
                    element.align === align ? "border-hazard text-hazard" : "border-white/15 text-chalk/70"
                  }`}
                >
                  {align}
                </button>
              ))}
            </div>
          </Field>
          <label className="flex items-center gap-2 font-body text-sm text-chalk/80">
            <input type="checkbox" checked={element.uppercase} onChange={(e) => patch({ uppercase: e.target.checked })} className="accent-[#1EFF66]" />
            Uppercase
          </label>
        </>
      ) : null}

      {element.type === "image" ? <ImageControls element={element} patch={patch} /> : null}

      {element.type === "button" ? (
        <>
          <TextField id="el-label" label="Label" value={element.label} onChange={(label) => patch({ label })} />
          <TextField id="el-href" label="Destination URL" value={element.href} placeholder="https://" onChange={(href) => patch({ href })} />
          <div className="grid grid-cols-2 gap-2">
            <ColorField id="el-bg" label="Background" value={element.bg} onChange={(bg) => patch({ bg })} />
            <ColorField id="el-fg" label="Text" value={element.color} onChange={(color) => patch({ color })} />
            <NumberField id="el-bsize" label="Size (px)" value={element.fontSize} min={6} max={200} onChange={(fontSize) => patch({ fontSize })} />
            <NumberField id="el-bradius" label="Radius" value={element.radius} min={0} max={200} onChange={(radius) => patch({ radius })} />
          </div>
        </>
      ) : null}

      {element.type === "shape" ? (
        <>
          <ColorField id="el-fill" label="Fill" value={element.fill} onChange={(fill) => patch({ fill })} />
          <div className="grid grid-cols-2 gap-2">
            <NumberField id="el-sradius" label="Radius" value={element.radius} min={0} max={1000} onChange={(radius) => patch({ radius })} />
            <NumberField id="el-opacity" label="Opacity" value={element.opacity} min={0} max={1} step={0.05} onChange={(opacity) => patch({ opacity })} />
          </div>
        </>
      ) : null}

      <div className="border-t border-white/10 pt-3">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.04em] text-chalk/55">Position and size</p>
        <div className="grid grid-cols-2 gap-2">
          <NumberField id="el-x" label="X" value={element.x} onChange={(x) => patch({ x })} />
          <NumberField id="el-y" label="Y" value={element.y} onChange={(y) => patch({ y })} />
          <NumberField id="el-w" label="Width" value={element.w} min={8} onChange={(w) => patch({ w })} />
          <NumberField id="el-h" label="Height" value={element.h} min={8} onChange={(h) => patch({ h })} />
        </div>
      </div>
    </div>
  );
}

function ImageControls({
  element,
  patch,
}: {
  element: Extract<DesignElement, { type: "image" }>;
  patch: (p: Record<string, unknown>) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      patch({ src: await fileToDataUrl(file), alt: element.alt || file.name.replace(/\.[^.]+$/, "") });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <>
      <div>
        <input
          ref={input}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="sr-only"
          id="el-upload"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" disabled={busy} onClick={() => input.current?.click()}>
            <Icon name="image" size={13} /> {element.src ? "Replace" : "Upload"}
          </Button>
          {element.src ? (
            <Button size="sm" variant="ghost" onClick={() => patch({ src: null })}>
              Use motif
            </Button>
          ) : null}
        </div>
        <p className="mt-1 font-body text-[11px] leading-4 text-chalk/50">
          PNG, JPEG, WebP or SVG. Stored in this browser only.
        </p>
        {error ? (
          <p role="alert" className="mt-1 font-body text-xs text-flag">
            {error}
          </p>
        ) : null}
      </div>
      {!element.src ? (
        <div className="grid grid-cols-2 gap-2">
          <SelectField id="el-motif" label="Motif" value={element.placeholder} options={MOTIFS} onChange={(placeholder) => patch({ placeholder })} />
          <ColorField id="el-tint" label="Tint" value={element.tint} onChange={(tint) => patch({ tint })} />
        </div>
      ) : null}
      <div className="grid grid-cols-2 gap-2">
        <SelectField
          id="el-fit"
          label="Fit"
          value={element.fit}
          options={[
            { value: "contain", label: "Contain" },
            { value: "cover", label: "Cover" },
          ]}
          onChange={(fit) => patch({ fit })}
        />
        <NumberField id="el-iradius" label="Radius" value={element.radius} min={0} max={1000} onChange={(radius) => patch({ radius })} />
      </div>
      <TextField id="el-alt" label="Alt text" value={element.alt} placeholder="Describe the image" onChange={(alt) => patch({ alt })} />
    </>
  );
}
