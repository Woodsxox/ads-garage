import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditorialArticle } from "@/components/editorial/EditorialArticle";
import { docsByKind, getDoc } from "@/lib/editorial";

type BlogParams = { slug: string };

export function generateStaticParams() {
  return docsByKind("blog").map((doc) => ({ slug: doc.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<BlogParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doc = getDoc("blog", slug);
  if (!doc) return { title: "Notes" };
  return { title: doc.title, description: doc.description };
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<BlogParams>;
}) {
  const { slug } = await params;
  const doc = getDoc("blog", slug);
  if (!doc) notFound();
  return <EditorialArticle doc={doc} />;
}
