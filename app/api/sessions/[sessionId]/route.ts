import { requireApiUser, privateNoStoreHeaders } from "@/lib/server/auth";
import { requireSameOrigin } from "@/lib/server/same-origin";
import { revokeOwnedSession } from "@/features/sessions/server/session.repository";
import { apiError } from "@/lib/server/api-error";
import { getCurrentSessionId } from "@/lib/server/current-session";

export async function DELETE(request:Request,{params}:{params:Promise<{sessionId:string}>}){const origin=requireSameOrigin(request);if(origin)return origin;const identity=await requireApiUser();if(!identity.ok)return identity.response;const sessionId=(await params).sessionId;if(sessionId===await getCurrentSessionId(identity.userId))return apiError("CURRENT_SESSION","Use Sign out to end the current session.",409,undefined,privateNoStoreHeaders);const removed=await revokeOwnedSession(sessionId,identity.userId);if(!removed.count)return apiError("SESSION_NOT_FOUND","Session not found.",404,undefined,privateNoStoreHeaders);return new Response(null,{status:204,headers:privateNoStoreHeaders})}
