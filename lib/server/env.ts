import "server-only";

const placeholder=/^(?:changeme|change-me|secret|example|test)$/i;
export function assertProductionAuthEnvironment(){
  const googleId=process.env.AUTH_GOOGLE_ID?.trim();const googleSecret=process.env.AUTH_GOOGLE_SECRET?.trim();
  if(Boolean(googleId)!==Boolean(googleSecret))throw new Error("AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET must be configured together.");
  if(process.env.NODE_ENV!=="production")return;
  const required=["DATABASE_URL","AUTH_SECRET","AUTH_GITHUB_ID","AUTH_GITHUB_SECRET","NEXT_PUBLIC_APP_URL"] as const;
  for(const name of required){const value=process.env[name]?.trim();if(!value||placeholder.test(value))throw new Error(`${name} must be securely configured in production.`)}
  if(Buffer.byteLength(process.env.AUTH_SECRET!)<32)throw new Error("AUTH_SECRET must contain at least 32 bytes in production.");
  const origin=new URL(process.env.NEXT_PUBLIC_APP_URL!);if(origin.protocol!=="https:")throw new Error("NEXT_PUBLIC_APP_URL must use HTTPS in production.");
}
