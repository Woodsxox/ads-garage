import { RealAd } from "@/components/ads/RealAd";
import type { EditorialDoc } from "@/lib/editorial";
import Link from "next/link";

const DISPLAY_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_DISPLAY ?? "0000000000";
const ARTICLE_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_IN_ARTICLE ?? "0000000001";

export function EditorialArticle({ doc }: { doc: EditorialDoc }) {
  const midpoint = Math.max(2, Math.floor(doc.paragraphs.length / 2));

  return (
    <article className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <p className="font-mono text-[10px] uppercase tracking-[0.04em] text-chalk/45">
        {doc.kicker} · {doc.minutes} min read
      </p>
      <h1 className="mt-2 font-display text-4xl leading-none tracking-[0.06em] text-chalk">
        {doc.title}
      </h1>
      <p className="mt-4 font-body text-base leading-7 text-chalk/75">{doc.description}</p>

      <RealAd className="mt-8" slot={DISPLAY_SLOT} format="horizontal" responsive minHeight={90} />

      {doc.paragraphs.map((paragraph, index) => (
        <div key={paragraph}>
          <p className="mt-6 font-body text-[17px] leading-8 text-chalk/85">{paragraph}</p>
          {index === midpoint ? (
            <RealAd
              className="my-8"
              slot={ARTICLE_SLOT}
              format="fluid"
              layout="in-article"
              responsive
              minHeight={280}
            />
          ) : null}
        </div>
      ))}

      <p className="mt-12 font-body text-sm text-chalk/55">
        <Link href={doc.kind === "guide" ? "/guide" : "/garage"} className="text-chalk/80">
          {doc.kind === "guide" ? "Back to the qualification checker" : "Open the showroom"}
        </Link>
      </p>
    </article>
  );
}
