const PATHS = {
  book: "M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19a2 2 0 0 1 2-2h13",
  play: "M8 5l11 7-11 7z",
  zap: "M13 2L4 14h7l-1 8 9-12h-7z",
  lock: "M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3",
  plus: "M12 5v14M5 12h14",
  trash: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13",
  copy: "M8 8h11v12H8zM5 16V4h11",
  download: "M12 4v11M7 11l5 5 5-5M5 20h14",
  save: "M5 4h11l3 3v13H5zM8 4v5h7V4M8 20v-6h8v6",
  undo: "M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3",
  redo: "M15 14l5-5-5-5M20 9H10a6 6 0 0 0 0 12h3",
  arrowRight: "M5 12h14M13 6l6 6-6 6",
  arrowLeft: "M19 12H5M11 6l-6 6 6 6",
  check: "M5 12l5 5 9-10",
  x: "M6 6l12 12M18 6L6 18",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  layers: "M12 3l9 5-9 5-9-5zM3 13l9 5 9-5",
  type: "M5 6V4h14v2M12 4v16M9 20h6",
  image: "M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4",
  square: "M5 5h14v14H5z",
  pointer: "M4 8h16v8H4zM9 12h6",
  external: "M14 4h6v6M20 4l-9 9M18 14v6H4V6h6",
  refresh: "M20 12a8 8 0 1 1-3-6.2M20 4v5h-5",
  chevronLeft: "M15 6l-6 6 6 6",
  chevronRight: "M9 6l6 6-6 6",
  chevronUp: "M6 15l6-6 6 6",
  chevronDown: "M6 9l6 6 6-6",
  menu: "M4 7h16M4 12h16M4 17h16",
  info: "M12 8h.01M11 12h1v5h1M12 3a9 9 0 1 0 .01 0",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z",
  alert: "M12 4l9 16H3zM12 10v4M12 17h.01",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 .01 0",
  link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1",
  clock: "M12 7v5l3 2M12 3a9 9 0 1 0 .01 0",
  search: "M11 4a7 7 0 1 0 .01 0M16 16l5 5",
  wall: "M2 7l10-3 10 3v10l-10 3-10-3zM2 7l10 3 10-3M12 10v10M7 8.5v9M17 8.5v9",
} as const;

export type IconName = keyof typeof PATHS;

const FILLED = new Set<IconName>(["play"]);

export function Icon({
  name,
  size = 16,
  className,
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  const filled = FILLED.has(name);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
