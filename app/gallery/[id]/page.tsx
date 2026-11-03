import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PreviewDetail } from "@/components/gallery/PreviewDetail";
import { buildAdDocument } from "@/lib/ads/ad-document";
import { ADS, getAd } from "@/lib/demo/ads";

type Params = { id: string };

export function generateStaticParams() {
  return ADS.map((ad) => ({ id: ad.id }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const ad = getAd(id);
  return ad ? { title: ad.title, description: ad.summary } : { title: "Gallery" };
}

export default async function AdPreviewPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const ad = getAd(id);
  if (!ad) notFound();
  // Inactive ads have no preview page; the gallery explains why they are inactive.
  if (ad.availability === "inactive") redirect("/gallery");
  return <PreviewDetail ad={ad} doc={buildAdDocument(ad)} />;
}
