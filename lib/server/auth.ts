import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { apiError } from "@/lib/server/api-error";

export const privateNoStoreHeaders = { "Cache-Control": "private, no-store, max-age=0", Pragma: "no-cache" } as const;

export async function getCurrentUserId() {
  return (await auth())?.user?.id ?? null;
}

export async function requirePageUser(callbackPath = "/dashboard") {
  const session = await auth();
  if (!session?.user?.id) redirect(`/login?callbackUrl=${encodeURIComponent(callbackPath)}`);
  return { id: session.user.id, name: session.user.name ?? null, email: session.user.email ?? null, image: session.user.image ?? null };
}

export async function requireApiUser() {
  const userId = await getCurrentUserId();
  return userId ? { ok: true as const, userId } : { ok: false as const, response: apiError("UNAUTHENTICATED", "Sign in to continue.", 401, undefined, privateNoStoreHeaders) };
}
