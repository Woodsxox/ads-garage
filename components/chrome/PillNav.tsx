"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActive, PILL_NAV } from "@/components/chrome/nav";
import { useNavMode } from "@/components/chrome/nav-mode";

/** The floating bottom navigation. The active page is the white pill. */
export function PillNav() {
  const pathname = usePathname();
  const [navMode] = useNavMode();

  return (
    <nav aria-label="Primary" className={`pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-3 ${navMode === "top" ? "md:hidden" : ""}`}>
      <ul className="pointer-events-auto flex max-w-full items-center gap-0.5 rounded-full bg-white/10 p-1 shadow-[0_8px_40px_rgb(0_0_0/0.5)] backdrop-blur-xl">
        {PILL_NAV.map((link) => {
          const active = isActive(pathname, link.href);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`block rounded-full px-2.5 py-2.5 font-display text-[13px] font-medium transition-colors min-[400px]:px-3.5 min-[400px]:text-[14px] sm:px-6 sm:text-[16px] ${
                  active ? "bg-chalk text-bay-floor" : "text-chalk/85 hover:text-hazard"
                }`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
