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
import { setProjectDeletionState } from "@/features/projects/server/project.repository";
import { deleteAssetRecord, listProjectAssetStorageKeys, setAssetDeletionState } from "@/features/assets/server/asset.repository";
import { getAssetStorage } from "@/lib/assets/storage";
import { jsonBodyError, readJsonBody } from "@/lib/server/request";
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
    body = await readJsonBody(request, 1_000_000);
  } catch (error) {
    return jsonBodyError(error);
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

  if (bodyResult.data.website !== undefined && bodyResult.data.expectedRevision === undefined) {
    return Response.json({ error: "expectedRevision is required when saving a draft." }, { status: 400 });
  }

  try {
    const updateResult = await updateProject(
      paramsResult.data.projectId,
      ownerId,
      bodyResult.data,
    );

    if (updateResult.count === 0) {
      const current = await findProjectByIdAndOwner(paramsResult.data.projectId, ownerId);
      if (current && bodyResult.data.website !== undefined) {
        return Response.json({ error: "Draft revision conflict.", code: "DRAFT_CONFLICT", currentRevision: current.draftRevision }, { status: 409 });
      }
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
    const project = await findProjectByIdAndOwner(paramsResult.data.projectId, ownerId);
    if (!project) return Response.json({ error: "Project not found." }, { status: 404 });
    await setProjectDeletionState(project.id, ownerId, "deleting");
    const assetKeys = await listProjectAssetStorageKeys(paramsResult.data.projectId, ownerId);
    let removed = 0;
    if (assetKeys.length) {
      const storage = getAssetStorage();
      for (const asset of assetKeys) {
        await setAssetDeletionState(asset.id, ownerId, "deleting");
        try {
          await storage.deleteAsset(asset.storageKey);
          removed += 1;
          await deleteAssetRecord(asset.id, ownerId);
        } catch (error) {
          await setAssetDeletionState(asset.id, ownerId, "delete_failed", "Project cleanup failed.").catch(() => undefined);
          await setProjectDeletionState(project.id, ownerId, "delete_failed", `${removed} remote object(s) removed before cleanup failed.`).catch(() => undefined);
          return Response.json({ error: "Project deletion is incomplete and can be retried.", removedRemoteObjects: removed, remainingAssets: assetKeys.length - removed, state: "delete_failed" }, { status: 502 });
        }
      }
    }
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
    console.error("Failed to delete project or its remote assets:", error);
    await setProjectDeletionState(paramsResult.data.projectId, ownerId, "delete_failed", "Final project cleanup failed; retry is required.").catch(() => undefined);

    return Response.json(
      {
        error: "Project deletion is incomplete and can be retried.",
      },
      { status: 500 },
    );
  }
}
