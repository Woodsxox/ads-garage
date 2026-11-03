import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { SandboxViewer } from "@/components/sandbox/SandboxViewer";
import { buildAdDocument, buildLandingDocument } from "@/lib/ads/ad-document";
import { ADS, getAd } from "@/lib/demo/ads";
import { adHref } from "@/lib/domain/meta";

type Params = { id: string };

export function generateStaticParams() {
  return ADS.filter((ad) => adHref(ad) === `/sandbox/${ad.id}`).map((ad) => ({ id: ad.id }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const ad = getAd(id);
  return ad ? { title: `${ad.title} · Sandbox`, description: ad.summary } : { title: "Sandbox" };
}

export default async function SandboxAdPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const ad = getAd(id);
  if (!ad) notFound();
  // Learning ads have a preview page, inactive ads are explained in the gallery.
  const home = adHref(ad);
  if (home !== `/sandbox/${ad.id}`) redirect(home ?? "/gallery");
  return <SandboxViewer ad={ad} adDoc={buildAdDocument(ad)} landingDoc={buildLandingDocument(ad)} />;
}
