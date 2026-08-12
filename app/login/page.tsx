import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { safeCallbackPath } from "@/lib/server/route-policy";
import LoginClient from "./LoginClient";

export const dynamic="force-dynamic";
export default async function LoginPage({searchParams}:{searchParams:Promise<{callbackUrl?:string}>}){
  const callbackUrl=safeCallbackPath((await searchParams).callbackUrl);
  if((await auth())?.user?.id)redirect(callbackUrl);
  return <LoginClient callbackUrl={callbackUrl}/>;
}
