"use client";

import {
  AD_FORMATS,
  PLACEMENTS,
  VIEWPORTS,
  type PlacementId,
  type ViewportId,
} from "@/lib/ad-sizes";
import { SANE_DENSITY_MAX } from "@/lib/layouts";
import { InspectionTag } from "@/components/chrome/InspectionTag";

export type GarageConfig = {
  viewport: ViewportId;
  formatId: string;
  placement: PlacementId;
  density: number;
};

type ControlBayProps = {
  config: GarageConfig;
  onChange: (next: GarageConfig) => void;
};

export function ControlBay({ config, onChange }: ControlBayProps) {
  const densityWarn = config.density > SANE_DENSITY_MAX;

  return (
    <div className="flex flex-col gap-6">
      <fieldset>
        <legend className="font-display text-sm tracking-[0.04em] text-chalk">
          Viewport
        </legend>
        <div className="mt-2 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Viewport">
          {(Object.values(VIEWPORTS) as Array<(typeof VIEWPORTS)[ViewportId]>).map((vp) => {
            const selected = config.viewport === vp.id;
            return (
              <button
                key={vp.id}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={`${vp.label} ${vp.width} pixels`}
                onClick={() => onChange({ ...config, viewport: vp.id })}
                className={`border px-2 py-2 text-left ${
                  selected ? "border-hazard text-hazard" : "border-white/15 text-chalk/80"
                }`}
              >
                <span className="block font-display text-xs tracking-[0.04em]">
                  {vp.label}
                </span>
                <span className="font-mono text-[10px]">{vp.width}px</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="font-display text-sm tracking-[0.04em] text-chalk">
          Format
        </legend>
        <div className="mt-2 grid max-h-[320px] grid-cols-2 gap-2 overflow-y-auto pr-1">
          {AD_FORMATS.map((format) => {
            const selected = config.formatId === format.id;
            return (
              <button
                key={format.id}
                type="button"
                aria-pressed={selected}
                aria-label={`Format ${format.label}`}
                onClick={() => onChange({ ...config, formatId: format.id })}
                className={`border px-2 py-2 text-left ${
                  selected ? "border-hazard text-hazard" : "border-white/15 text-chalk/80"
                }`}
              >
                <span className="block font-display text-[11px] tracking-[0.04em]">
                  {format.label}
                </span>
                <span className="font-mono text-[10px]">{format.previewLabel}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="font-display text-sm tracking-[0.04em] text-chalk">
          Placement
        </legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {(Object.values(PLACEMENTS) as Array<(typeof PLACEMENTS)[PlacementId]>).map((place) => {
            const selected = config.placement === place.id;
            return (
              <button
                key={place.id}
                type="button"
                aria-pressed={selected}
                aria-label={`Placement ${place.label}`}
                onClick={() => onChange({ ...config, placement: place.id })}
                className={`border px-2 py-2 font-display text-[11px] tracking-[0.04em] ${
                  selected ? "border-hazard text-hazard" : "border-white/15 text-chalk/80"
                }`}
              >
                {place.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div>
        <label htmlFor="density" className="font-display text-sm tracking-[0.04em] text-chalk">
          Density
        </label>
        <p className="mt-1 font-mono text-[11px] text-chalk/60">
          {config.density} slot{config.density === 1 ? "" : "s"} / page
        </p>
        <input
          id="density"
          type="range"
          min={1}
          max={5}
          step={1}
          value={config.density}
          aria-valuemin={1}
          aria-valuemax={5}
          aria-valuenow={config.density}
          aria-label="Ad slots per page"
          onChange={(event) =>
            onChange({ ...config, density: Number(event.target.value) })
          }
          className="mt-2 w-full accent-[#1EFF66]"
        />
        {densityWarn ? (
          <div className="mt-3" role="status">
            <InspectionTag tone="flag">Inspection fail — density</InspectionTag>
            <p className="mt-2 font-body text-xs leading-5 text-chalk/70">
              {config.density} units on one article crowds the reading experience and raises
              accidental-click risk. Three or fewer is the sane spec.
            </p>
          </div>
        ) : (
          <p className="mt-2 font-body text-xs text-torque">Density inside a readable layout.</p>
        )}
      </div>
    </div>
  );
}
