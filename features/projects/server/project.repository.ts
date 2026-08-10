import "server-only";

import { Prisma } from "@prisma/client";

import { initialWebsite } from "@/data/initialWebsite";
import { prisma } from "@/lib/prisma";

import type {
  CreateProjectInput,
  UpdateProjectInput,
} from "../schemas/project.schema";
import { slugify } from "@/features/publishing/slug";

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
    },

    data: {
      ...(input.name !== undefined && {
        name: input.name,
      }),

      ...(input.website !== undefined && {
        website: toPrismaJson(input.website),
      }),
      ...(input.repositoryUrl !== undefined && {
        repositoryUrl: input.repositoryUrl || null,
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

export const findPublishedProjectBySlug = (slug: string) => prisma.project.findFirst({ where: { slug, isPublished: true, publishedWebsite: { not: Prisma.DbNull } }, select: { name: true, slug: true, publishedWebsite: true, publishedAt: true } });

export async function publishProject(projectId: string, ownerId: string, slug: string, website: unknown) {
  return prisma.project.update({ where: { id: projectId, ownerId }, data: { slug, publishedWebsite: toPrismaJson(website), isPublished: true, publishedAt: new Date() }, select: { slug: true, isPublished: true, publishedAt: true } });
}

export async function unpublishProject(projectId: string, ownerId: string) {
  return prisma.project.updateMany({ where: { id: projectId, ownerId }, data: { isPublished: false } });
}
