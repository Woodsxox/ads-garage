import type { Metadata } from "next";
import { ProjectsView } from "@/components/projects/ProjectsView";

export const metadata: Metadata = {
  title: "My Ads",
  description: "Your saved ad designs. Reopen, edit, duplicate, export or delete them.",
};

export default function ProjectsPage() {
  return <ProjectsView />;
}
