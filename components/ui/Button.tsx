import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full border font-display font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 aria-disabled:cursor-not-allowed aria-disabled:opacity-40";

// Pills, like the reference sites: a white primary, a translucent secondary, an outlined ghost.
const VARIANTS: Record<Variant, string> = {
  primary: "border-chalk bg-chalk text-bay-floor hover:border-hazard hover:bg-hazard aria-disabled:hover:border-chalk aria-disabled:hover:bg-chalk",
  secondary: "border-transparent bg-white/10 text-chalk hover:bg-white/20",
  ghost: "border-white/20 text-chalk hover:border-chalk/60 hover:bg-white/5",
  danger: "border-flag text-flag hover:bg-flag/10",
};

const SIZES: Record<Size, string> = {
  sm: "px-4 py-2 text-[13px]",
  md: "px-6 py-3 text-[15px]",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra = ""): string {
  return `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${extra}`.trim();
}

type CommonProps = { variant?: Variant; size?: Size; children: ReactNode; className?: string };

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  children,
  ...rest
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  external = false,
  disabled = false,
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...rest
}: CommonProps & {
  href: string;
  external?: boolean;
  /** Renders a non-interactive element with aria-disabled. */
  disabled?: boolean;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className" | "children">) {
  const cls = buttonClass(variant, size, className);
  if (disabled) {
    return (
      <span aria-disabled="true" className={cls}>
        {children}
      </span>
    );
  }
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls} {...rest}>
      {children}
    </Link>
  );
}
