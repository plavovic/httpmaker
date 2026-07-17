import {
  findProjectByIdAndOwner,
} from "@/features/projects/server/project.repository";

import {
  projectParamsSchema,
} from "@/features/projects/schemas/project.schema";

import {
  getDevelopmentUserId,
} from "@/features/projects/server/development-user";

import { updateProjectSchema } from "@/features/projects/schemas/project.schema";
import { updateProject } from "@/features/projects/server/project.repository";
import { deleteProject } from "@/features/projects/server/project.repository";
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

export async function PATCH(
  request: Request,
  context: ProjectRouteContext,
) {
  const params = await context.params;
  const paramsResult = projectParamsSchema.safeParse(params);

  if (!paramsResult.success) {
    return Response.json(
      {
        error: "Invalid project ID.",
        details: paramsResult.error.flatten(),
      },
      { status: 400 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      {
        error: "Request body must contain valid JSON.",
      },
      { status: 400 },
    );
  }

  const bodyResult = updateProjectSchema.safeParse(body);

  if (!bodyResult.success) {
    return Response.json(
      {
        error: "Invalid project update.",
        details: bodyResult.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    const ownerId = await getDevelopmentUserId();

    const updateResult = await updateProject(
      paramsResult.data.projectId,
      ownerId,
      bodyResult.data,
    );

    if (updateResult.count === 0) {
      return Response.json(
        {
          error: "Project not found.",
        },
        { status: 404 },
      );
    }

    const updatedProject = await findProjectByIdAndOwner(
      paramsResult.data.projectId,
      ownerId,
    );

    return Response.json(
      {
        project: updatedProject,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("Failed to update project:", error);

    return Response.json(
      {
        error: "Unable to update project.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: ProjectRouteContext,
) {
  const params = await context.params;
  const paramsResult = projectParamsSchema.safeParse(params);

  if (!paramsResult.success) {
    return Response.json(
      {
        error: "Invalid project ID.",
        details: paramsResult.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    const ownerId = await getDevelopmentUserId();

    const deleteResult = await deleteProject(
      paramsResult.data.projectId,
      ownerId,
    );

    if (deleteResult.count === 0) {
      return Response.json(
        {
          error: "Project not found.",
        },
        { status: 404 },
      );
    }

    return new Response(null, {
      status: 204,
    });
  } catch (error: unknown) {
    console.error("Failed to delete project:", error);

    return Response.json(
      {
        error: "Unable to delete project.",
      },
      { status: 500 },
    );
  }
}