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
  const navbar = data.website.sections.find((section) => section.type === "navbar");
  const hero = data.website.sections.find((section) => section.type === "hero");
  const origin = configuredOrigin();
  const title = data.project.publicationTitle?.trim() || navbar?.props.title.trim() || hero?.props.title.trim() || data.project.name || "HTTPMAKER site";
  const iconVersion = encodeURIComponent(data.project.publishedAt?.toISOString() || data.project.publicationIconUrl || "generated");
  return { title, description: hero?.props.subtitle || navbar?.props.subtitle || "Published with HTTPMAKER", applicationName:title, icons:{icon:`/${encodeURIComponent(data.project.slug!)}/icon?v=${iconVersion}`}, ...(origin ? { alternates: { canonical: `${origin}/${data.project.slug}` } } : {}) };
}

export default async function RootPublicSitePage({ params }: { params: Promise<{ slug: string }> }) {
  const data = await loadPublishedSite((await params).slug);
  if (!data) notFound();
  return <PublicWebsiteRenderer website={data.website} />;
}
