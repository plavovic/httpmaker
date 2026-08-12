import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { findProjectByIdAndOwner } from "@/features/projects/server/project.repository";
import PublishClient from "./PublishClient";

export default async function PublishPage({ params }: { params: Promise<{ projectId: string }> }) {
  const ownerId = (await auth())?.user?.id;
  if (!ownerId) redirect("/login");
  const project = await findProjectByIdAndOwner((await params).projectId, ownerId);
  if (!project) notFound();
  return <PublishClient projectId={project.id} />;
}
