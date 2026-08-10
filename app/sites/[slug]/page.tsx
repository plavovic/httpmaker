import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadPublishedSite } from "@/features/publishing/server/public-site";
import PublicWebsiteRenderer from "@/renderer/PublicWebsiteRenderer";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const data = await loadPublishedSite((await params).slug);
  if (!data) return {};
  const hero = data.website.sections.find((section) => section.type === "hero");
  return { title: hero?.props.title || data.project.name || "HTTPMAKER site", description: hero?.props.subtitle || "Published with HTTPMAKER" };
}

export default async function PublicSitePage({ params }: { params: Promise<{ slug: string }> }) {
  const data = await loadPublishedSite((await params).slug);
  if (!data) notFound();
  return <PublicWebsiteRenderer website={data.website} />;
}
