import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadPublishedSite } from "@/features/publishing/server/public-site";
import PublicWebsiteRenderer from "@/renderer/PublicWebsiteRenderer";

const configuredOrigin = () => {
  const value = process.env.NEXT_PUBLIC_APP_URL;
  if (!value) return undefined;
  try { return new URL(value).origin; } catch { return undefined; }
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const data = await loadPublishedSite((await params).slug);
  if (!data) return {};
  const hero = data.website.sections.find((section) => section.type === "hero");
  const origin = configuredOrigin();
  return { title: hero?.props.title || data.project.name || "HTTPMAKER site", description: hero?.props.subtitle || "Published with HTTPMAKER", ...(origin ? { alternates: { canonical: `${origin}/${data.project.slug}` } } : {}) };
}

export default async function RootPublicSitePage({ params }: { params: Promise<{ slug: string }> }) {
  const data = await loadPublishedSite((await params).slug);
  if (!data) notFound();
  return <PublicWebsiteRenderer website={data.website} />;
}
