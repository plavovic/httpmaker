import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { prisma } from "@/lib/prisma";
import { assertProductionAuthEnvironment } from "@/lib/server/env";
import { isVerifiedGoogleProfile, oauthProfileImage } from "@/lib/server/oauth-config";
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
        async signIn({ user, account, profile }) {
            if (!isVerifiedGoogleProfile(account, profile ?? undefined)) return false;

            const image = oauthProfileImage(account, profile ?? undefined);
            if (user.id && !user.image && image) {
                await prisma.user.updateMany({
                    where: { id: user.id, image: null },
                    data: { image },
                });
                user.image = image;
            }

            return true;
        },
        session({ session, user }) {
            return clientSession(session, user);
        },
    },
});
