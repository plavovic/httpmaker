import { auth } from "@/auth";
import { findProjectByIdAndOwner, isSlugAvailable } from "@/features/projects/server/project.repository";
import { slugSchema } from "@/features/publishing/slug";
import { apiError } from "@/lib/server/api-error";

type Context = { params: Promise<{ projectId: string }> };
export async function GET(request: Request, context: Context) {
  const ownerId = (await auth())?.user?.id;
  if (!ownerId) return apiError("UNAUTHENTICATED", "Sign in to check availability.", 401);
  const { projectId } = await context.params;
  if (!(await findProjectByIdAndOwner(projectId, ownerId))) return apiError("PROJECT_NOT_FOUND", "Project not found.", 404);
  const parsed = slugSchema.safeParse(new URL(request.url).searchParams.get("slug") ?? "");
  if (!parsed.success) return apiError("INVALID_SLUG", parsed.error.issues[0]?.message ?? "Invalid slug.", 400);
  return Response.json({ slug: parsed.data, available: await isSlugAvailable(parsed.data, projectId) });
}
