import "server-only";
import { cookies } from "next/headers";
import { findSessionIdByToken } from "@/features/sessions/server/session.repository";

const COOKIE_NAMES=["__Secure-authjs.session-token","authjs.session-token","__Secure-next-auth.session-token","next-auth.session-token"];
export async function getCurrentSessionId(userId:string){const jar=await cookies();for(const name of COOKIE_NAMES){const token=jar.get(name)?.value;if(token){const row=await findSessionIdByToken(token,userId);if(row)return row.id}}return null}
