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
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.website !== undefined,
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