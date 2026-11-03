import type { Metadata } from "next";
import { StudioEntry } from "@/components/studio/StudioEntry";

export const metadata: Metadata = {
  title: "Create Ad",
  description: "Design your own ad from a template: edit text, images and buttons, preview, save and export.",
};

type Search = { [key: string]: string | string[] | undefined };
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? null;

export default async function CreatePage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  // A new design needs an id and a timestamp. They are minted here, on the server, so the
  // markup the browser hydrates matches exactly.
  const fresh = { id: `design-${crypto.randomUUID()}`, now: new Date().toISOString() };
  return <StudioEntry projectId={first(params.project)} templateId={first(params.template)} fresh={fresh} />;
}
