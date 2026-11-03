"use client";

import type { Ref } from "react";

/**
 * The isolation boundary. `sandbox="allow-scripts"` without `allow-same-origin` gives the
 * document an opaque origin: it cannot read this page, our cookies or storage, cannot submit
 * forms, open popups or navigate the top window. The document's own CSP also blocks all
 * network access. The only channel out is postMessage, which the viewer validates.
 */
export function AdFrame({
  doc,
  title,
  width,
  height,
  ref,
  className = "",
}: {
  doc: string;
  title: string;
  width: number | string;
  height: number | string;
  ref?: Ref<HTMLIFrameElement>;
  className?: string;
}) {
  return (
    <iframe
      ref={ref}
      title={title}
      srcDoc={doc}
      sandbox="allow-scripts"
      referrerPolicy="no-referrer"
      width={width}
      height={height}
      className={`block max-w-full border-0 bg-white ${className}`}
      style={{ width, height }}
    />
  );
}
