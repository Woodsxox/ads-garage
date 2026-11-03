import type { ReactNode } from "react";

/**
 * The header every inner page starts with: a small mono label, a very large title and a short
 * paragraph beside it. It adapts to whatever container the page puts it in.
 */
export function PageHeader({
  eyebrow,
  title,
  children,
  actions,
}: {
  eyebrow?: string;
  title: ReactNode;
  /** A short paragraph shown beside the title on wide screens. */
  children?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6 pb-10">
      <div className="min-w-0">
        {eyebrow ? <p className="font-mono text-[11px] uppercase tracking-[0.04em] text-chalk/60">{eyebrow}</p> : null}
        <h1 className="mt-3 font-display text-[clamp(2.6rem,7vw,6rem)] font-medium leading-[0.95]">{title}</h1>
      </div>
      {children ? <div className="max-w-md font-body text-sm leading-6 text-chalk/60">{children}</div> : null}
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </header>
  );
}
