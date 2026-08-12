import { auth } from "@/auth";
import { initializeProjectPreset } from "@/features/projects/server/project.repository";
import { apiError } from "@/lib/server/api-error";
import { readJsonBody } from "@/lib/server/request";
import { presetWebsites } from "@/presets/templates";
import { safelyParseWebsiteData } from "@/schemas/website.schema";
import { z } from "zod";

const schema = z.object({ presetId: z.enum(["artistic", "analytical", "modern", "professional", "colourful", "monochrome"]) }).strict();
type Context = { params: Promise<{ projectId: string }> };
export async function POST(request: Request, context: Context) {
  const ownerId = (await auth())?.user?.id;
  if (!ownerId) return apiError("UNAUTHENTICATED", "Sign in to set up this project.", 401);
  let body: unknown;
  try { body = await readJsonBody(request, 2_000); } catch { return apiError("INVALID_JSON", "The request body must be valid JSON.", 400); }
  const input = schema.safeParse(body);
  if (!input.success) return apiError("INVALID_PRESET", "Choose a supported design preset.", 400);
  if (!safelyParseWebsiteData(presetWebsites[input.data.presetId]).success) return apiError("INVALID_PRESET_TEMPLATE", "That preset cannot initialize a website.", 422);
  const result = await initializeProjectPreset((await context.params).projectId, ownerId, input.data.presetId);
  if (result.kind === "not_found") return apiError("PROJECT_NOT_FOUND", "Project not found.", 404);
  return Response.json({ project: result.project, initialized: result.kind === "initialized" });
}
