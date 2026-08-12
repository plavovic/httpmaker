import "server-only";

const placeholder = /(?:change.?me|your_|example|placeholder|test)/i;
const origin = (name: string, value: string) => { const url = new URL(value); if (url.protocol !== "https:" || url.origin !== url.toString().replace(/\/$/, "")) throw new Error(`${name} must be an HTTPS origin without a path, query, or fragment.`); return url.origin; };

export function assertProductionAuthEnvironment(environment: Record<string,string|undefined> = process.env) {
  const googleId=environment.AUTH_GOOGLE_ID?.trim(); const googleSecret=environment.AUTH_GOOGLE_SECRET?.trim();
  if(Boolean(googleId)!==Boolean(googleSecret)) throw new Error("AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET must be configured together.");
  const rateUrl=environment.RATE_LIMIT_REST_URL?.trim(); const rateToken=environment.RATE_LIMIT_REST_TOKEN?.trim();
  if(Boolean(rateUrl)!==Boolean(rateToken)) throw new Error("RATE_LIMIT_REST_URL and RATE_LIMIT_REST_TOKEN must be configured together.");
  if(environment.NODE_ENV!=="production") return;
  const required=["DATABASE_URL","AUTH_SECRET","AUTH_GITHUB_ID","AUTH_GITHUB_SECRET","AUTH_GOOGLE_ID","AUTH_GOOGLE_SECRET","NEXT_PUBLIC_APP_URL","AUTH_URL","BLOB_READ_WRITE_TOKEN","RATE_LIMIT_REST_URL","RATE_LIMIT_REST_TOKEN"] as const;
  for(const name of required){const value=environment[name]?.trim();if(!value||placeholder.test(value))throw new Error(`${name} must be securely configured in production.`)}
  if(Buffer.byteLength(environment.AUTH_SECRET!)<32)throw new Error("AUTH_SECRET must contain at least 32 bytes in production.");
  const publicOrigin=origin("NEXT_PUBLIC_APP_URL",environment.NEXT_PUBLIC_APP_URL!); const authOrigin=origin("AUTH_URL",environment.AUTH_URL!);
  if(publicOrigin!==authOrigin)throw new Error("AUTH_URL and NEXT_PUBLIC_APP_URL must use the same canonical origin.");
  if(new URL(environment.RATE_LIMIT_REST_URL!).protocol!=="https:")throw new Error("RATE_LIMIT_REST_URL must use HTTPS in production.");
  if((environment.HTTPMAKER_AI_PROVIDER??"mock")!=="mock")throw new Error("HTTPMAKER_AI_PROVIDER must be mock for this prototype.");
}
