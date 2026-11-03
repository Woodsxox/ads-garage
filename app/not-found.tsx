import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

const LINKS = [
  { href: "/gallery", label: "Gallery" },
  { href: "/learn", label: "Learn" },
  { href: "/sandbox", label: "Sandbox" },
  { href: "/create", label: "Create an ad" },
];

/**
 * The 404. It sits inside the normal layout, so the header, nav and footer stay. It is used both
 * for URLs that match nothing and for pages that call notFound(), such as an ad id that does not exist.
 */
export default function NotFound() {
  return (
    <div className="mx-auto grid min-h-[calc(100svh-5rem)] max-w-[1800px] items-center overflow-x-clip gap-10 px-4 pb-32 pt-8 sm:px-6 md:grid-cols-[1.15fr_1fr]">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.04em] text-chalk/60">Error 404</p>
        <h1 className="mt-3 font-display text-[clamp(3.2rem,9.5vw,8.5rem)] font-medium leading-[0.92]">Page not found</h1>
        <p className="mt-6 max-w-md font-body text-base leading-7 text-chalk/65">
          That page does not exist, or it has moved. Check the address, or pick up from one of the places below.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/">
            Back to home <Icon name="arrowRight" size={15} />
          </ButtonLink>
          <ButtonLink href="/gallery" variant="secondary">
            Browse the gallery
          </ButtonLink>
        </div>
        <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-[0.04em] text-chalk/55">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="hover:text-hazard">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative grid place-items-center">
        <p
          aria-hidden="true"
          className="pointer-events-none absolute select-none font-display text-[clamp(10rem,30vw,26rem)] font-semibold leading-none text-white/[0.045]"
        >
          404
        </p>
        <Image
          src="/logo/thinking-640.png"
          alt=""
          width={493}
          height={640}
          priority
          className="relative h-auto max-h-[58svh] w-auto max-w-full select-none"
        />
      </div>
    </div>
  );
}
