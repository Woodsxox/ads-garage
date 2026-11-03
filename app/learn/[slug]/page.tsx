import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LessonPlayer } from "@/components/learn/LessonPlayer";
import { getLesson, LESSONS } from "@/lib/demo/lessons";

type Params = { slug: string };

export function generateStaticParams() {
  return LESSONS.map((lesson) => ({ slug: lesson.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const lesson = getLesson(slug);
  return lesson ? { title: lesson.title, description: lesson.summary } : { title: "Learn" };
}

export default async function LessonPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const lesson = getLesson(slug);
  if (!lesson) notFound();
  return <LessonPlayer lesson={lesson} />;
}
