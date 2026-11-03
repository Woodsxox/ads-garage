import Link from "next/link";
import { LogoMark } from "@/components/chrome/Logo";
import { MENU_GROUPS } from "@/components/chrome/nav";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-white/10 pb-28">
      <div className="mx-auto max-w-[1800px] px-4 pt-12 sm:px-6">
        <div className="grid gap-12 md:grid-cols-[1.3fr_repeat(3,1fr)]">
          <div>
            <div className="flex items-center gap-2.5">
              <LogoMark size={60} />
              <span className="font-display text-xl">Ads Garage</span>
            </div>
            <p className="mt-4 max-w-xs font-mono text-[10px] uppercase leading-[1.7] tracking-[0.04em] text-chalk/55">
              Discover, learn, create and publish ads. Demo build · mock data · demo ads are never paid · sponsored
              placements are labelled.
            </p>
          </div>
          {MENU_GROUPS.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <p className="font-mono text-[10px] uppercase tracking-[0.04em] text-hazard">{group.title}</p>
              <ul className="mt-4 flex flex-col gap-2">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="font-display text-[17px] font-medium text-chalk/80 hover:text-hazard">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <p aria-hidden="true" className="-mt-4 select-none overflow-hidden whitespace-nowrap font-display text-[17vw] font-semibold leading-[1.05] text-white/[0.06]">
          Ads Garage
        </p>

        <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.04em] text-chalk/35">© 2026 Ads Garage</p>
      </div>
    </footer>
  );
}
