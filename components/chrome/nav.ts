export type NavLink = { href: string; label: string };

/** The bottom pill. Short on purpose: the five places most visitors go. */
export const PILL_NAV: readonly NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/gallery", label: "Gallery" },
  { href: "/learn", label: "Learn" },
  { href: "/sandbox", label: "Sandbox" },
  { href: "/create", label: "Create" },
];

/** The links in the top bar. Home sits on the left of the bar, so it is not repeated here. */
export const TOP_NAV: readonly NavLink[] = [
  { href: "/gallery", label: "Gallery" },
  { href: "/learn", label: "Learn" },
  { href: "/sandbox", label: "Sandbox" },
  { href: "/create", label: "Create" },
  { href: "/plans", label: "Plans" },
];

/** The full menu overlay. */
export const MENU_GROUPS: readonly { title: string; links: readonly NavLink[] }[] = [
  {
    title: "Explore",
    links: [
      { href: "/gallery", label: "Gallery" },
      { href: "/learn", label: "Learn" },
      { href: "/sandbox", label: "Sandbox" },
    ],
  },
  {
    title: "Build",
    links: [
      { href: "/create", label: "Create an ad" },
      { href: "/projects", label: "My ads" },
      { href: "/integrations", label: "Integrations" },
      { href: "/plans", label: "Plans" },
    ],
  },
  {
    title: "Publisher tools",
    links: [
      { href: "/garage", label: "Layout showroom" },
      { href: "/build", label: "AdSense snippet builder" },
      { href: "/guide", label: "Network guide" },
      { href: "/blog", label: "Notes" },
    ],
  },
];

export function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
