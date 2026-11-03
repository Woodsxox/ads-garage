import type { Metadata } from "next";
import { LessonIndex } from "@/components/learn/LessonIndex";

export const metadata: Metadata = {
  title: "Learn",
  description: "Short interactive lessons on how image, video, clickable and gamified ads are designed.",
};

export default function LearnPage() {
  return <LessonIndex />;
}
