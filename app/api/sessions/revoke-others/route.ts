import { requireApiUser, privateNoStoreHeaders } from "@/lib/server/auth";
import { getCurrentSessionId } from "@/lib/server/current-session";
import { requireSameOrigin } from "@/lib/server/same-origin";
import { revokeOtherSessions } from "@/features/sessions/server/session.repository";
import { apiError } from "@/lib/server/api-error";

export async function POST(request:Request){const origin=requireSameOrigin(request);if(origin)return origin;const identity=await requireApiUser();if(!identity.ok)return identity.response;const currentId=await getCurrentSessionId(identity.userId);if(!currentId)return apiError("CURRENT_SESSION_NOT_FOUND","The current session could not be verified.",401,undefined,privateNoStoreHeaders);const result=await revokeOtherSessions(identity.userId,currentId);return Response.json({revoked:result.count},{headers:privateNoStoreHeaders})}
