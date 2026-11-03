"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";

const WIDTH = { sm: "max-w-md", md: "max-w-2xl", lg: "max-w-5xl" } as const;

/**
 * Native <dialog>: focus is trapped, Escape closes, and the page behind is inert.
 * Children are only mounted while open so heavy content (iframes) is not kept alive.
 */
export function Modal({
  open,
  onClose,
  title,
  size = "md",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  size?: keyof typeof WIDTH;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      data-lenis-prevent
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className={`m-auto w-[calc(100%-2rem)] ${WIDTH[size]} max-h-[calc(100vh-2rem)] overflow-y-auto rounded-xl border border-white/15 bg-bay-wall p-0 text-chalk backdrop:bg-black/70 backdrop:backdrop-blur-sm`}
    >
      {open ? (
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 id={titleId} className="font-display text-xl tracking-[0.04em]">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="-mr-1 -mt-1 p-1 text-chalk/70 hover:text-hazard"
            >
              <Icon name="x" size={20} />
            </button>
          </div>
          <div className="mt-4">{children}</div>
        </div>
      ) : null}
    </dialog>
  );
}
