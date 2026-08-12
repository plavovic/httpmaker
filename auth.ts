import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

import { PrismaAdapter } from "@auth/prisma-adapter";

import { prisma } from "@/lib/prisma";
import { assertProductionAuthEnvironment } from "@/lib/server/env";

assertProductionAuthEnvironment();

export const {
    handlers,
    auth,
    signIn,
    signOut,
} = NextAuth({
    adapter: PrismaAdapter(prisma),

    providers: [GitHub],

    session: {
        strategy: "database",
        maxAge: 7 * 24 * 60 * 60,
        updateAge: 24 * 60 * 60,
    },

    callbacks: {
        session({ session, user }) {
            if (session.user) {
                session.user.id = user.id;
            }

            return session;
        },
    },
});
