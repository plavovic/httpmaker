
import { auth } from "@/auth";
import { createProjectSchema } from "@/features/projects/schemas/project.schema";
import { createProject } from "@/features/projects/server/project.repository";
import { listProjectsByOwner } from "@/features/projects/server/project.repository";

export async function GET() {
    const session = await auth();
    const ownerId = session?.user?.id;

    if (!ownerId) {
        return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    try {
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

export async function POST(request: Request) {
  const session = await auth();
  const ownerId = session?.user?.id;

  if (!ownerId) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      {
        error: "Request body must contain valid JSON.",
      },
      {
        status: 400,
      },
    );
  }

  const result = createProjectSchema.safeParse(body);

  if (!result.success) {
    return Response.json(
      {
        error: "Invalid project data.",
        details: result.error.flatten(),
      },
      {
        status: 400,
      },
    );
  }

  try {
    const project = await createProject(
      ownerId,
      result.data,
    );

    return Response.json(
      {
        project,
      },
      {
        status: 201,
      },
    );
  } catch (error: unknown) {
    console.error("Failed to create project:", error);

    return Response.json(
      {
        error: "Unable to create project.",
      },
      {
        status: 500,
      },
    );
  }
}
