"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActive, MENU_GROUPS } from "@/components/chrome/nav";

/** The full-screen menu: every route, in large type. Escape or the close button dismisses it. */
export function MenuOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const panel = useRef<HTMLDivElement>(null);
  const previous = useRef<HTMLElement | null>(null);

  // Close after navigating.
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    previous.current = document.activeElement as HTMLElement | null;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = `${scrollbar}px`;
    panel.current?.querySelector<HTMLElement>("a, button")?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panel.current) return;
      // Keep focus inside the dialog.
      const focusable = [...panel.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")];
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
      previous.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={panel}
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
      data-lenis-prevent
      className="pointer-events-auto fixed inset-0 z-50 overflow-y-auto bg-bay-floor"
    >
      <div className="mx-auto flex min-h-full max-w-[1800px] flex-col px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.04em] text-chalk/60">Menu</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/10 px-5 py-3 font-display text-[15px] font-medium text-chalk transition-colors hover:bg-white/20"
          >
            Close
          </button>
        </div>

        <div className="mt-10 grid flex-1 content-start gap-12 pb-16 md:grid-cols-3">
          {MENU_GROUPS.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <p className="border-b border-white/10 pb-3 font-mono text-[10px] uppercase tracking-[0.04em] text-hazard">{group.title}</p>
              <ul className="mt-4 flex flex-col">
                {group.links.map((link) => {
                  const active = isActive(pathname, link.href);
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        aria-current={active ? "page" : undefined}
                        className={`block py-1.5 font-display text-4xl leading-[1.05] sm:text-5xl ${
                          active ? "text-hazard" : "text-chalk hover:text-hazard"
                        }`}
                      >
                        {link.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          ))}
        </div>
      </div>
    </div>
  );
}
