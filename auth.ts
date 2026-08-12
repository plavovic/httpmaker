import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { prisma } from "@/lib/prisma";
import { assertProductionAuthEnvironment } from "@/lib/server/env";
import { isVerifiedGoogleProfile } from "@/lib/server/oauth-config";
import { authProviders } from "@/lib/server/auth-providers";
import { clientSession } from "@/lib/auth-session";

assertProductionAuthEnvironment();

export const {
    handlers,
    auth,
    signIn,
    signOut,
} = NextAuth({
    adapter: PrismaAdapter(prisma),

    providers: authProviders(),

    pages: {
        signIn: "/login",
        error: "/login",
    },

    session: {
        strategy: "database",
        maxAge: 7 * 24 * 60 * 60,
        updateAge: 24 * 60 * 60,
    },

    callbacks: {
        signIn({ account, profile }) {
            return isVerifiedGoogleProfile(account, profile ?? undefined);
        },
        session({ session, user }) {
            return clientSession(session, user);
        },
    },
});
