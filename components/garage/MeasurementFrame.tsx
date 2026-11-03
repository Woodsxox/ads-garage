"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";

type MeasurementFrameProps = {
  width: number;
  height: number;
  children: ReactNode;
};

function ticks(length: number, step = 50): number[] {
  const values: number[] = [];
  for (let i = 0; i <= length; i += step) values.push(i);
  return values;
}

export function MeasurementFrame({ width, height, children }: MeasurementFrameProps) {
  const xTicks = useMemo(() => ticks(width), [width]);
  const yTicks = useMemo(() => ticks(height), [height]);

  return (
    <div className="flex bg-bay-floor">
      <div
        className="relative shrink-0 border-r border-hazard/40"
        style={{ width: 44, height: height + 28 }}
        aria-hidden="true"
      >
        {yTicks.map((tick) => (
          <div
            key={tick}
            className="absolute right-0 flex items-center"
            style={{ top: tick + 28 }}
          >
            {tick % 100 === 0 ? (
              <span className="mr-1 font-mono text-[9px] text-hazard">{tick}</span>
            ) : null}
            <span
              className="block bg-hazard"
              style={{ width: tick % 100 === 0 ? 10 : 6, height: 1 }}
            />
          </div>
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <div
          className="relative border-b border-hazard/40"
          style={{ height: 28, width }}
          aria-hidden="true"
        >
          {xTicks.map((tick) => (
            <div
              key={tick}
              className="absolute bottom-0 flex flex-col items-center"
              style={{ left: tick }}
            >
              {tick % 100 === 0 ? (
                <span className="mb-0.5 font-mono text-[9px] text-hazard">{tick}</span>
              ) : null}
              <span
                className="block bg-hazard"
                style={{ width: 1, height: tick % 100 === 0 ? 10 : 6 }}
              />
            </div>
          ))}
          <span className="absolute right-2 top-1 font-mono text-[10px] uppercase tracking-[0.04em] text-hazard">
            {width}×{height}
          </span>
        </div>
        <div style={{ width }}>{children}</div>
      </div>
    </div>
  );
}
