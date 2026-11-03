"use client";

import { useRef, type ElementType, type ReactNode } from "react";
import { gsap, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap-client";

/**
 * Text that reveals line by line (or word by word) as it scrolls into view.
 * The text is plain in the DOM from the start, so it is readable without JavaScript, to search
 * engines and to screen readers (SplitText labels the split pieces). Reduced-motion users get
 * the text with no animation.
 */
export function RevealText({
  as: Tag = "p",
  by = "lines",
  className = "",
  delay,
  immediate = false,
  children,
}: {
  as?: ElementType;
  by?: "lines" | "words";
  className?: string;
  /** Seconds before the reveal starts. By default it waits for the loader on a first visit. */
  delay?: number;
  /** Play on load instead of waiting to scroll into view (for text already on screen). */
  immediate?: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const waitForLoader = document.documentElement.dataset.loader === "on" ? 1.5 : 0.1;

      SplitText.create(el, {
        type: by,
        mask: by,
        autoSplit: true, // re-split when the width or fonts change, so line breaks stay right
        onSplit: (self) =>
          gsap.from(by === "lines" ? self.lines : self.words, {
            yPercent: 110,
            duration: 0.9,
            ease: "power4.out",
            stagger: by === "lines" ? 0.09 : 0.04,
            delay: delay ?? (immediate ? waitForLoader : 0),
            scrollTrigger: immediate ? undefined : { trigger: el, start: "top 88%", once: true },
          }),
      });
      ScrollTrigger.refresh();
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
