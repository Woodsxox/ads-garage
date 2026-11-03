import Image from "next/image";

/**
 * The mark: a white block figure mid-stride (public/logo). `size` is its height in pixels;
 * the width follows the artwork's proportions. It is decorative: the wordmark beside it, or the
 * link's own label, names the site.
 */
const RATIO = 139 / 192;

export function LogoMark({ size = 40, priority = false }: { size?: number; priority?: boolean }) {
  const width = Math.round(size * RATIO);
  return (
    <Image
      src="/logo/mark-motion-192.png"
      alt=""
      width={width}
      height={size}
      style={{ width, height: size }}
      priority={priority}
      className="shrink-0 select-none"
    />
  );
}
