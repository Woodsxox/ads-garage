import type { Metadata } from "next";
import { PlansView } from "@/components/plans/PlansView";

export const metadata: Metadata = {
  title: "Plans",
  description: "Starter, Pro and Ultra: what each plan offers now, what is a demo preview and what is planned.",
};

export default function PlansPage() {
  return <PlansView />;
}
