"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ControlBay, type GarageConfig } from "@/components/garage/ControlBay";
import { EarningsEstimator } from "@/components/garage/EarningsEstimator";
import { MeasurementFrame } from "@/components/garage/MeasurementFrame";
import { NetworkMatrix } from "@/components/garage/NetworkMatrix";
import { ShowroomCanvas } from "@/components/garage/ShowroomCanvas";
import { VIEWPORTS, isValidFormatId } from "@/lib/ad-sizes";
import { VIEWPORT_SPRING } from "@/lib/motion";
import { STORAGE_KEYS } from "@/lib/storage";
import { useStored } from "@/lib/use-stored";

const DEFAULT_CONFIG: GarageConfig = {
  viewport: "desktop",
  formatId: "300x250",
  placement: "in-content",
  density: 2,
};

export function GarageShowroom() {
  const reduce = useReducedMotion();
  const [config, setConfig] = useStored<GarageConfig>(
    STORAGE_KEYS.garageConfig,
    DEFAULT_CONFIG,
  );
  const safeConfig = isValidFormatId(config.formatId) ? config : DEFAULT_CONFIG;

  const persist = (next: GarageConfig) => {
    setConfig(next);
  };

  const width = VIEWPORTS[safeConfig.viewport].width;
  const canvasHeight = 920;

  return (
    <div className="mx-auto grid max-w-[1440px] gap-4 px-4 py-6 lg:grid-cols-[260px_minmax(0,1fr)_280px] lg:px-6">
      <aside className="rounded-xl bg-bay-wall p-4" aria-label="Control bay">
        <p className="font-mono text-[10px] uppercase tracking-[0.04em] text-hazard">Layout showroom</p>
        <h1 className="mt-1 font-display text-2xl tracking-[0.04em] text-chalk">
          Showroom
        </h1>
        <p className="mt-2 font-body text-xs leading-5 text-chalk/65">
          Mock units only. Nothing here is live inventory. Clicks stay in the garage.
        </p>
        <div className="mt-5">
          <ControlBay config={safeConfig} onChange={persist} />
        </div>
      </aside>

      <section aria-label="Inspection canvas" className="min-w-0 overflow-x-auto border border-white/10">
        <motion.div
          initial={false}
          animate={{ width }}
          transition={reduce ? { duration: 0 } : VIEWPORT_SPRING}
          style={{ width }}
        >
          <MeasurementFrame width={width} height={canvasHeight}>
            <div style={{ minHeight: canvasHeight }}>
              <ShowroomCanvas
                formatId={safeConfig.formatId}
                placement={safeConfig.placement}
                density={safeConfig.density}
              />
            </div>
          </MeasurementFrame>
        </motion.div>
      </section>

      <aside className="flex flex-col gap-4" aria-label="Readout panel">
        <EarningsEstimator
          formatId={safeConfig.formatId}
          placement={safeConfig.placement}
          density={safeConfig.density}
        />
        <NetworkMatrix />
      </aside>
    </div>
  );
}
