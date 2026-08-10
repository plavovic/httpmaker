import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findPublishedProjectBySlug } from "@/features/projects/server/project.repository";
import { slugSchema } from "@/features/publishing/slug";
import PublicWebsiteRenderer from "@/renderer/PublicWebsiteRenderer";
import { safelyParseWebsiteData } from "@/schemas/website.schema";

async function load(slug: string) {
  if (!slugSchema.safeParse(slug).success) return null;
  const project = await findPublishedProjectBySlug(slug);
  if (!project) return null;
  const website = safelyParseWebsiteData(project.publishedWebsite);
  return website.success ? { project, website: website.data } : null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const data = await load((await params).slug);
  if (!data) return {};
  const hero = data.website.sections.find((section) => section.type === "hero");
  return { title: hero?.props.title || data.project.name || "HTTPMAKER site", description: hero?.props.subtitle || "Published with HTTPMAKER" };
}

export default async function PublicSitePage({ params }: { params: Promise<{ slug: string }> }) {
  const data = await load((await params).slug);
  if (!data) notFound();
  return <PublicWebsiteRenderer website={data.website} />;
}
