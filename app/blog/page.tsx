import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { docsByKind } from "@/lib/editorial";

export const metadata: Metadata = {
  title: "Notes",
  description: "Editorial notes on invalid traffic, fill rates, and publisher layout.",
};

export default function BlogIndexPage() {
  const notes = docsByKind("blog");
  return (
    <div className="mx-auto max-w-[1800px] px-4 pb-8 pt-10 sm:px-6">
      <PageHeader eyebrow={`Notes · ${notes.length} articles`} title="Notes">
        Editorial notes on invalid traffic, fill rates and publisher layout.
      </PageHeader>
      <ul className="divide-y divide-white/10 border-y border-white/15">
        {notes.map((doc) => (
          <li key={doc.slug} className="group relative grid gap-3 px-2 py-8 transition-colors hover:bg-white/[0.03] md:grid-cols-[1fr_2fr] md:gap-10 md:px-4">
            <h2 className="font-display text-3xl font-medium leading-tight transition-colors group-hover:text-hazard">
              <Link href={`/blog/${doc.slug}`} className="after:absolute after:inset-0 after:content-['']">
                {doc.title}
              </Link>
            </h2>
            <div>
              <p className="max-w-xl font-body text-sm leading-6 text-chalk/60">{doc.description}</p>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.04em] text-chalk/45">
                {doc.kicker} · {doc.minutes} min read
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
