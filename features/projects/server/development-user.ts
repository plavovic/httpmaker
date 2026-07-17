import "server-only";

import { prisma } from "@/lib/prisma";

const DEVELOPMENT_USER_EMAIL =
  "developer@httpmaker.local";

export async function getDevelopmentUser() {
  const user = await prisma.user.findUnique({
    where: {
      email: DEVELOPMENT_USER_EMAIL,
    },
  });

  if (!user) {
    throw new Error(
      `Development user "${DEVELOPMENT_USER_EMAIL}" was not found. Run the database seed first.`,
    );
  }

  return user;
}

export async function getDevelopmentUserId() {
  const user = await getDevelopmentUser();

  return user.id;
}