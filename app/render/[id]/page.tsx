import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdFrame } from "@/components/sandbox/AdFrame";
import { buildAdDocument } from "@/lib/ads/ad-document";
import { getAd } from "@/lib/demo/ads";
import { assetRenderEnabled } from "@/lib/gallery/render";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Render", robots: { index: false, follow: false } };

/**
 * A bare, full-bleed copy of one demo ad. `scripts/render-gallery-assets.mjs` opens it at the ad's
 * exact size to take its poster and record its loop. It covers the site chrome and is not linked
 * from anywhere. In production it is off unless ASSET_RENDER=1.
 */
export default async function RenderPage({ params }: { params: Promise<{ id: string }> }) {
  if (!assetRenderEnabled()) notFound();
  const { id } = await params;
  const ad = getAd(id);
  if (!ad) notFound();
  return (
    <div className="fixed inset-0 z-[300] bg-black">
      <AdFrame doc={buildAdDocument(ad)} title={`${ad.title} (render)`} width="100%" height="100%" />
    </div>
  );
}
