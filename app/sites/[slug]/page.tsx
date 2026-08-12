import { notFound, permanentRedirect } from "next/navigation";
import { loadPublishedSite } from "@/features/publishing/server/public-site";

export default async function PublicSitePage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const data = await loadPublishedSite(slug);
  if (!data) notFound();
  permanentRedirect(`/${encodeURIComponent(slug)}`);
}
