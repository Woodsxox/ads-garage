import type { Metadata } from "next";
import { SponsoredSlot } from "@/components/ads/SponsoredSlot";
import { GalleryView, type GalleryFilters } from "@/components/gallery/GalleryView";
import { AVAILABILITY_ORDER, FORMAT_ORDER } from "@/lib/domain/meta";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "Browse image, banner, video, clickable, carousel, gamified and native ads. Each one is a learning demo, a sandbox ad or an active experience.",
};

type Search = { [key: string]: string | string[] | undefined };

function pick(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function GalleryPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const format = pick(params.format);
  const state = pick(params.state);
  const q = pick(params.q);

  const initial: Partial<GalleryFilters> = {};
  if (format && (FORMAT_ORDER as string[]).includes(format)) initial.format = format as GalleryFilters["format"];
  if (state && (AVAILABILITY_ORDER as string[]).includes(state)) initial.state = state as GalleryFilters["state"];
  if (q) initial.q = q.slice(0, 80);

  return <GalleryView initial={Object.keys(initial).length > 0 ? initial : null} slot={<SponsoredSlot />} />;
}
