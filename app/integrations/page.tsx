import type { Metadata } from "next";
import { IntegrationsView } from "@/components/integrations/IntegrationsView";
import { PLATFORMS } from "@/lib/demo/platforms";
import type { PlatformId } from "@/lib/domain/types";

export const metadata: Metadata = {
  title: "Integrations",
  description: "Connect advertising platforms, validate your creative and prepare campaigns. Demo with mock data.",
};

type Search = { [key: string]: string | string[] | undefined };
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? null;

export default async function IntegrationsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const platform = first(params.platform);
  const platformId = PLATFORMS.find((p) => p.id === platform)?.id ?? null;
  return <IntegrationsView initialDesignId={first(params.design)} initialPlatformId={platformId as PlatformId | null} />;
}
