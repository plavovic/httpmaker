import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { findProjectByIdAndOwner } from "@/features/projects/server/project.repository";
import PublicWebsiteRenderer from "@/renderer/PublicWebsiteRenderer";
import { safelyParseWebsiteData } from "@/schemas/website.schema";

export default async function DraftPreviewPage({ params }: { params: Promise<{ projectId: string }> }) {
  const ownerId = (await auth())?.user?.id;
  if (!ownerId) redirect("/login");
  const project = await findProjectByIdAndOwner((await params).projectId, ownerId);
  if (!project) notFound();
  const website = safelyParseWebsiteData(project.website);
  if (!website.success) notFound();
  return <PublicWebsiteRenderer website={website.data} />;
}
