import "server-only";

import type { Prisma } from "@prisma/client";

import { initialWebsite } from "@/data/initialWebsite";
import { prisma } from "@/lib/prisma";

import type {
  CreateProjectInput,
  UpdateProjectInput,
} from "../schemas/project.schema";

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
  return prisma.project.create({
    data: {
      name: input.name,
      ownerId,
      website: toPrismaJson(initialWebsite),
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