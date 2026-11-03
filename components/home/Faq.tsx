/** An accordion built on native <details>, so it works without JavaScript and is keyboard accessible. */
export function Faq({ items }: { items: readonly { q: string; a: string }[] }) {
  return (
    <div className="divide-y divide-white/10 border-y border-white/10">
      {items.map((item) => (
        <details key={item.q} className="group py-1">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 font-display text-xl font-medium text-chalk marker:hidden hover:text-hazard sm:text-2xl [&::-webkit-details-marker]:hidden">
            {item.q}
            <span
              aria-hidden="true"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/20 text-lg leading-none transition-transform group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <p className="max-w-3xl pb-6 font-body text-base leading-7 text-chalk/70">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
