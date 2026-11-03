"use client";

import { useEffect, useRef, useState } from "react";
import { AdArt } from "@/components/ui/AdArt";
import type { Ad } from "@/lib/domain/types";

/** An ad scaled to fill the width of whatever holds it, up to `maxHeight`. */
export function FitAd({ ad, maxHeight, className = "" }: { ad: Ad; maxHeight: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="flex w-full justify-center">
      {width > 0 ? <AdArt ad={ad} maxWidth={width} maxHeight={maxHeight} className={className} /> : <div style={{ height: 120 }} />}
    </div>
  );
}
