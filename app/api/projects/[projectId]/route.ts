import {
  findProjectByIdAndOwner,
} from "@/features/projects/server/project.repository";

import {
  projectParamsSchema,
} from "@/features/projects/schemas/project.schema";

import {
  getDevelopmentUserId,
} from "@/features/projects/server/development-user";

type ProjectRouteContext = {
  params: Promise<{
    projectId: string;
  }>;
};

export async function GET(
  _request: Request,
  context: ProjectRouteContext,
) {
  try {
    const params = await context.params;

console.log("RECEIVED PARAMS:", params);

const paramsResult = projectParamsSchema.safeParse(params);

console.log("PARAM VALIDATION:", paramsResult);

    

    if (!paramsResult.success) {
      return Response.json(
        {
          error: "Invalid project ID.",
          details: paramsResult.error.flatten(),
        },
        {
          status: 400,
        },
      );
    }

    const projectId =
      paramsResult.data.projectId;

    const ownerId =
      await getDevelopmentUserId();

    console.log("Project lookup:", {
      projectId,
      ownerId,
    });

    const project =
      await findProjectByIdAndOwner(
        projectId,
        ownerId,
      );

    console.log("Project lookup result:", {
      found: project !== null,
      projectId: project?.id,
      projectOwnerId: project?.ownerId,
    });

    if (!project) {
      return Response.json(
        {
          error: "Project not found.",
          debug: {
            requestedProjectId: projectId,
            developmentOwnerId: ownerId,
          },
        },
        {
          status: 404,
        },
      );
    }

    return Response.json(
      {
        project,
      },
      {
        status: 200,
      },
    );
  } catch (error: unknown) {
    console.error(
      "Failed to load project:",
      error,
    );

    return Response.json(
      {
        error: "Unable to load project.",
      },
      {
        status: 500,
      },
    );
  }
}