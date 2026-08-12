import { requireApiUser, privateNoStoreHeaders } from "@/lib/server/auth";
import { getCurrentSessionId } from "@/lib/server/current-session";
import { listUserSessions } from "@/features/sessions/server/session.repository";

export async function GET(){const identity=await requireApiUser();if(!identity.ok)return identity.response;const currentId=await getCurrentSessionId(identity.userId);const sessions=await listUserSessions(identity.userId);return Response.json({sessions:sessions.map(session=>({...session,current:session.id===currentId}))},{headers:privateNoStoreHeaders})}
