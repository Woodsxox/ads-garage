import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditorialArticle } from "@/components/editorial/EditorialArticle";
import { docsByKind, getDoc } from "@/lib/editorial";

type GuideParams = { slug: string };

export function generateStaticParams() {
  return docsByKind("guide").map((doc) => ({ slug: doc.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<GuideParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doc = getDoc("guide", slug);
  if (!doc) return { title: "Guide" };
  return { title: doc.title, description: doc.description };
}

export default async function GuideArticlePage({
  params,
}: {
  params: Promise<GuideParams>;
}) {
  const { slug } = await params;
  const doc = getDoc("guide", slug);
  if (!doc) notFound();
  return <EditorialArticle doc={doc} />;
}
