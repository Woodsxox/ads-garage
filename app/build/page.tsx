import type { Metadata } from "next";
import { CreatorTool } from "@/components/build/CreatorTool";

export const metadata: Metadata = {
  title: "Build",
  description: "Generate a deployable ad layout bundle for WordPress, Next.js, HTML, or Shopify.",
};

export default function BuildPage() {
  return <CreatorTool />;
}
