import { auth } from "@/auth";
import {
  findProjectByIdAndOwner,
} from "@/features/projects/server/project.repository";

import {
  projectParamsSchema,
} from "@/features/projects/schemas/project.schema";

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
  const session = await auth();
  const ownerId = session?.user?.id;

  if (!ownerId) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const params = await context.params;
    const paramsResult = projectParamsSchema.safeParse(params);

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

    const project =
      await findProjectByIdAndOwner(
        projectId,
        ownerId,
      );

    if (!project) {
      return Response.json(
        {
          error: "Project not found.",
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
  const session = await auth();
  const ownerId = session?.user?.id;

  if (!ownerId) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

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
  const session = await auth();
  const ownerId = session?.user?.id;

  if (!ownerId) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

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
