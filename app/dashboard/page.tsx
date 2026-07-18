import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { listProjectsByOwner } from "@/features/projects/server/project.repository";

import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const projects = await listProjectsByOwner(session.user.id);

  return (
    <DashboardClient
      user={{
        name: session.user.name ?? "HTTPMAKER user",
        email: session.user.email ?? "",
        image: session.user.image ?? null,
      }}
      initialProjects={projects.map((project) => ({
        ...project,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
      }))}
    />
  );
}
