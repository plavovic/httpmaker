import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { safeCallbackPath } from "@/lib/server/route-policy";
import LoginClient from "./LoginClient";
import { friendlyAuthError } from "@/lib/auth-errors";
import { googleOAuthConfig } from "@/lib/server/oauth-config";

export const dynamic="force-dynamic";
export default async function LoginPage({searchParams}:{searchParams:Promise<{callbackUrl?:string;error?:string}>}){
  const params=await searchParams;const callbackUrl=safeCallbackPath(params.callbackUrl);
  if((await auth())?.user?.id)redirect(callbackUrl);
  return <LoginClient callbackUrl={callbackUrl} googleEnabled={googleOAuthConfig().enabled} errorMessage={friendlyAuthError(params.error)}/>;
}
