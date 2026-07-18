import { z } from "zod";

import { websiteSchema } from "@/schemas/website.schema";

export const createProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Project name is required.")
    .max(100, "Project name must contain at most 100 characters."),
});

export const updateProjectSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Project name cannot be empty.")
      .max(100, "Project name must contain at most 100 characters.")
      .optional(),

    website: websiteSchema.optional(),
    repositoryUrl: z.union([
      z.literal(""),
      z.string().trim().url("Enter a valid repository URL.").refine(
        (value) => value.startsWith("https://"),
        "Repository URL must use HTTPS.",
      ),
    ]).nullable().optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.website !== undefined ||
      data.repositoryUrl !== undefined,
    {
      message: "At least one field must be provided.",
    },
  );

export const projectParamsSchema = z.object({
  projectId: z
    .string()
    .trim()
    .min(1, "Project ID is required."),
});

export type CreateProjectInput =
  z.infer<typeof createProjectSchema>;

export type UpdateProjectInput =
  z.infer<typeof updateProjectSchema>;

export type ProjectParams =
  z.infer<typeof projectParamsSchema>;
