import { getDevelopmentUserId } from "@/features/projects/server/development-user";

import { listProjectsByOwner } from "@/features/projects/server/project.repository";

export async function GET() {
    try {
        const ownerId = await getDevelopmentUserId();


        const projects = await listProjectsByOwner(ownerId);

        return Response.json(
            {
                projects,
            },
            {
                status: 200,
            },

        );
    } catch (error: unknown) {
        console.error("Failed to list projects:", error);
        return Response.json(
            {
                error: "Cannot load project",
            },
            {
                status: 500,
            },
        );
    }
}