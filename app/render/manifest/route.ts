import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";

import { ADS } from "@/lib/demo/ads";
import { assetRenderEnabled } from "@/lib/gallery/render";

/** The list of ads the asset script should render. Same gate as the render page. */
export function GET() {
  if (!assetRenderEnabled()) notFound();
  return Response.json(
    ADS.map((ad) => ({ id: ad.id, format: ad.format, width: ad.size.width, height: ad.size.height })),
  );
}
