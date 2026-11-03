import type { Metadata } from "next";
import Link from "next/link";
import { QualificationChecker } from "@/components/guide/QualificationChecker";
import { docsByKind } from "@/lib/editorial";

export const metadata: Metadata = {
  title: "Guide",
  description: "Qualification-gated ad network recommendations and layout manuals.",
};

export default function GuidePage() {
  const manuals = docsByKind("guide");

  return (
    <>
      <QualificationChecker />
      <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6" aria-labelledby="manuals-heading">
        <h2 id="manuals-heading" className="font-display text-xl tracking-[0.04em] text-chalk">
          Service manuals
        </h2>
        <ul className="mt-4 flex flex-col gap-3">
          {manuals.map((doc) => (
            <li key={doc.slug} className="border border-white/10 p-4">
              <Link href={`/guide/${doc.slug}`} className="font-display text-sm tracking-[0.04em] text-hazard">
                {doc.title}
              </Link>
              <p className="mt-1 font-body text-sm text-chalk/65">{doc.description}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
