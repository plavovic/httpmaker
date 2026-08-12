import "server-only";

import { Prisma } from "@prisma/client";

import { initialWebsite } from "@/data/initialWebsite";
import { prisma } from "@/lib/prisma";

import type {
  CreateProjectInput,
  UpdateProjectInput,
} from "../schemas/project.schema";
import { slugify } from "@/features/publishing/slug";
import { presetWebsites } from "@/presets/templates";
import type { DesignPresetId } from "@/types/designPreset";

function toPrismaJson(
  value: unknown,
): Prisma.InputJsonValue {
  return JSON.parse(
    JSON.stringify(value),
  ) as Prisma.InputJsonValue;
}

export async function listProjectsByOwner(
  ownerId: string,
) {
  return prisma.project.findMany({
    where: {
      ownerId,
    },

    orderBy: {
      updatedAt: "desc",
    },

    select: {
      id: true,
      name: true,
      ownerId: true,
      createdAt: true,
      updatedAt: true,
      repositoryUrl: true,
      slug: true,
      isPublished: true,
      publishedAt: true,
      githubInstallationId: true,
      githubRepositoryId: true,
      githubRepositoryFullName: true,
    },
  });
}

export async function findProjectByIdAndOwner(
  projectId: string,
  ownerId: string,
) {
  return prisma.project.findFirst({
    where: {
      id: projectId,
      ownerId,
    },
  });
}

export async function createProject(
  ownerId: string,
  input: CreateProjectInput,
) {
  const base = slugify(input.name);
  let slug = base;
  for (let suffix = 2; await prisma.project.findUnique({ where: { slug }, select: { id: true } }); suffix += 1) {
    slug = `${base.slice(0, 80 - String(suffix).length - 1)}-${suffix}`;
  }
  return prisma.project.create({
    data: {
      name: input.name,
      ownerId,
      website: toPrismaJson(initialWebsite),
      slug,
      initialPresetId: null,
      editorSetupCompletedAt: null,
    },
  });
}

export async function updateProject(
  projectId: string,
  ownerId: string,
  input: UpdateProjectInput,
) {
  return prisma.project.updateMany({
    where: {
      id: projectId,
      ownerId,
      deletionState: "active",
      ...(input.website !== undefined ? { draftRevision: input.expectedRevision } : {}),
    },

    data: {
      ...(input.name !== undefined && {
        name: input.name,
      }),

      ...(input.website !== undefined && {
        website: toPrismaJson(input.website),
        draftRevision: { increment: 1 },
      }),
    },
  });
}

export async function deleteProject(
  projectId: string,
  ownerId: string,
) {
  return prisma.project.deleteMany({
    where: {
      id: projectId,
      ownerId,
    },
  });
}
export class SlugConflictError extends Error {}

export const setProjectDeletionState = (projectId: string, ownerId: string, deletionState: string, deletionError: string | null = null) =>
  prisma.project.updateMany({ where: { id: projectId, ownerId }, data: { deletionState, deletionError } });

export const findPublishedProjectBySlug = (slug: string) => prisma.project.findFirst({ where: { slug, isPublished: true, publishedWebsite: { not: Prisma.DbNull } }, select: { name: true, slug: true, publishedWebsite: true, publishedAt: true, publicationTitle: true, publicationIconUrl: true, publicationIconData: true } });

export async function publishProject(projectId: string, ownerId: string, slug: string, website: unknown, revision: number, branding: { title: string; iconUrl: string | null; iconData: string | null }) {
  return prisma.$transaction(async (tx) => {
    const claimed = await tx.project.findFirst({ where: { slug, NOT: { id: projectId } }, select: { id: true } });
    if (claimed) throw new SlugConflictError("Slug conflict");
    const updated = await tx.project.updateMany({ where: { id: projectId, ownerId, draftRevision: revision, deletionState: "active" }, data: { slug, publicationTitle: branding.title, publicationIconUrl: branding.iconUrl, publicationIconData: branding.iconData, publishedWebsite: toPrismaJson(website), publishedRevision: revision, isPublished: true, publishedAt: new Date() } });
    if (!updated.count) return null;
    return tx.project.findFirst({ where: { id: projectId, ownerId }, select: { slug: true, isPublished: true, publishedAt: true, publishedRevision: true } });
  });
}

export async function unpublishProject(projectId: string, ownerId: string) {
  return prisma.project.updateMany({ where: { id: projectId, ownerId }, data: { isPublished: false } });
}

export const isSlugAvailable = async (slug: string, projectId: string) => !(await prisma.project.findFirst({ where: { slug, NOT: { id: projectId } }, select: { id: true } }));

export async function initializeProjectPreset(projectId: string, ownerId: string, presetId: DesignPresetId) {
  const website = structuredClone(presetWebsites[presetId]);
  return prisma.$transaction(async (tx) => {
    const current = await tx.project.findFirst({ where: { id: projectId, ownerId, deletionState: "active" } });
    if (!current) return { kind: "not_found" as const };
    if (current.editorSetupCompletedAt) return { kind: "complete" as const, project: current };
    const result = await tx.project.updateMany({ where: { id: projectId, ownerId, editorSetupCompletedAt: null, draftRevision: current.draftRevision }, data: { website: toPrismaJson(website), initialPresetId: presetId, editorSetupCompletedAt: new Date(), draftRevision: { increment: 1 } } });
    const project = await tx.project.findFirst({ where: { id: projectId, ownerId } });
    return result.count ? { kind: "initialized" as const, project } : { kind: "complete" as const, project };
  });
}

export async function linkProjectRepository(projectId: string, ownerId: string, input: { installationId: string; repositoryId: string; fullName: string; htmlUrl: string; defaultBranch: string }) {
  return prisma.project.updateMany({ where: { id: projectId, ownerId }, data: { githubInstallationId: input.installationId, githubRepositoryId: input.repositoryId, githubRepositoryFullName: input.fullName, repositoryUrl: input.htmlUrl, githubDefaultBranch: input.defaultBranch } });
}

export async function unlinkProjectRepository(projectId: string, ownerId: string) {
  return prisma.project.updateMany({
    where: { id: projectId, ownerId },
    data: { githubInstallationId: null, githubRepositoryId: null, githubRepositoryFullName: null, githubDefaultBranch: null, repositoryUrl: null },
  });
}
