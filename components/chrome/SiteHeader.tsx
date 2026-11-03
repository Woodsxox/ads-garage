"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/chrome/Logo";
import { isActive, TOP_NAV } from "@/components/chrome/nav";
import { useNavMode } from "@/components/chrome/nav-mode";

const LINK = "font-display text-[14px] font-medium uppercase tracking-[0.06em] transition-colors hover:text-hazard";

/** A little window; the filled strip shows where the page links sit. */
function NavPositionIcon({ mode }: { mode: "top" | "bottom" }) {
  return (
    <svg width="15" height="12" viewBox="0 0 20 16" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="1.75" y={mode === "top" ? 1.75 : 10.25} width="16.5" height="4" rx="1" fill="currentColor" />
    </svg>
  );
}

/** A slim bar: the brand on the left, section links and the nav-position switch on the right. */
export function SiteHeader() {
  const pathname = usePathname();
  const [navMode, setNavMode] = useNavMode();
  const top = navMode === "top";

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-bay-floor/95 backdrop-blur">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-full focus:bg-hazard focus:px-4 focus:py-2 focus:text-bay-floor"
      >
        Skip to content
      </a>
      <div className="mx-auto flex h-20 max-w-[1800px] items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-5">
          <Link
            href="/"
            aria-label="Ads Garage, home"
            className="flex items-center gap-2 text-chalk transition-colors hover:text-hazard"
          >
            <LogoMark size={52} priority />
            <span className="whitespace-nowrap font-display text-[17px] font-semibold tracking-[-0.01em]">Ads Garage</span>
          </Link>
        </div>

        <nav aria-label="Sections" className="flex items-center gap-5">
          <ul className={`items-center gap-6 ${top ? "hidden md:flex" : "hidden"}`}>
            {TOP_NAV.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={`${LINK} ${active ? "text-hazard" : "text-chalk"}`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <span aria-hidden="true" className={`h-5 w-px bg-white/20 ${top ? "hidden md:block" : "hidden"}`} />
          <div role="group" aria-label="Navigation position" className="hidden items-center gap-1 md:flex">
            {(["top", "bottom"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setNavMode(mode)}
                aria-pressed={navMode === mode}
                aria-label={mode === "top" ? "Show page links in the top bar" : "Show page links in a bar at the bottom"}
                title={mode === "top" ? "Top nav" : "Bottom nav"}
                className={`grid h-8 w-8 place-items-center rounded-[5px] transition-colors ${
                  navMode === mode ? "text-hazard" : "text-chalk/50 hover:text-chalk"
                }`}
              >
                <NavPositionIcon mode={mode} />
              </button>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}
