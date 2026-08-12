import "server-only";
import { apiError } from "@/lib/server/api-error";

export function trustedApplicationOrigin(request?: Request) {
  const configured=process.env.AUTH_URL||process.env.NEXT_PUBLIC_APP_URL;
  if(configured){try{return new URL(configured).origin}catch{return null}}
  return process.env.NODE_ENV==="production"?null:request?new URL(request.url).origin:null;
}

export function requireSameOrigin(request:Request){
  const expected=trustedApplicationOrigin(request);const origin=request.headers.get("origin");const fetchSite=request.headers.get("sec-fetch-site");
  if(!expected||!origin||origin!==expected||(fetchSite&&fetchSite!=="same-origin"&&fetchSite!=="same-site"))return apiError("ORIGIN_REJECTED","This request did not come from the trusted application origin.",403);
  return null;
}
