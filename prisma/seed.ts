import "dotenv/config";

import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import { initialWebsite } from "../data/initialWebsite";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is missing. Add it to your .env file.",
  );
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

const DEVELOPMENT_USER_EMAIL =
  "developer@httpmaker.local";

const PROJECT_IDS = {
  portfolio: "httpmaker_seed_portfolio",
  experimental: "httpmaker_seed_experimental",
} as const;

function createWebsiteJson(): Prisma.InputJsonValue {
  return JSON.parse(
    JSON.stringify(initialWebsite),
  ) as Prisma.InputJsonValue;
}

async function main(): Promise<void> {
  console.log("Starting database seed...");

  const developmentUser = await prisma.user.upsert({
    where: {
      email: DEVELOPMENT_USER_EMAIL,
    },

    update: {
      firstName: "HTTPMAKER",
      lastName: "Developer",
    },

    create: {
      email: DEVELOPMENT_USER_EMAIL,
      firstName: "HTTPMAKER",
      lastName: "Developer",
    },
  });

  const portfolioProject = await prisma.project.upsert({
    where: {
      id: PROJECT_IDS.portfolio,
    },

    update: {
      name: "My Portfolio",
      website: createWebsiteJson(),
      ownerId: developmentUser.id,
    },

    create: {
      id: PROJECT_IDS.portfolio,
      name: "My Portfolio",
      website: createWebsiteJson(),
      ownerId: developmentUser.id,
    },
  });

  const experimentalProject =
    await prisma.project.upsert({
      where: {
        id: PROJECT_IDS.experimental,
      },

      update: {
        name: "Experimental Landing Page",
        website: createWebsiteJson(),
        ownerId: developmentUser.id,
      },

      create: {
        id: PROJECT_IDS.experimental,
        name: "Experimental Landing Page",
        website: createWebsiteJson(),
        ownerId: developmentUser.id,
      },
    });

  console.log("Database seed completed.");

  console.log({
    user: developmentUser.email,
    projects: [
      portfolioProject.name,
      experimentalProject.name,
    ],
  });
}

main()
  .catch((error: unknown) => {
    console.error("Database seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });