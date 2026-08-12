import "server-only";

export type RateLimitResult = { allowed: boolean; retryAfterSeconds: number };
export interface RateLimiter { consume(key: string): Promise<RateLimitResult> }

export function createDistributedRateLimiter(limit:number,windowMs:number):RateLimiter{
  const url=process.env.RATE_LIMIT_REST_URL;const token=process.env.RATE_LIMIT_REST_TOKEN;
  if(!url||!token)return{async consume(){return{allowed:false,retryAfterSeconds:Math.ceil(windowMs/1000)}}};
  return{async consume(key){try{const bucket=`httpmaker:${Math.floor(Date.now()/windowMs)}:${key}`;const response=await fetch(`${url}/pipeline`,{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify([["INCR",bucket],["PEXPIRE",bucket,String(windowMs),"NX"]]),cache:"no-store"});if(!response.ok)throw new Error("rate limit provider unavailable");const result=await response.json() as Array<{result?:number}>;const count=Number(result[0]?.result);return{allowed:Number.isFinite(count)&&count<=limit,retryAfterSeconds:Math.ceil(windowMs/1000)}}catch{return{allowed:false,retryAfterSeconds:Math.ceil(windowMs/1000)}}}};
}
export const createConfiguredRateLimiter=(limit:number,windowMs:number)=>process.env.NODE_ENV==="production"?createDistributedRateLimiter(limit,windowMs):createMemoryRateLimiter(limit,windowMs);

/** Local/dev limiter only. Serverless instances do not share this state; replace it with a distributed adapter in production. */
export function createMemoryRateLimiter(limit: number, windowMs: number): RateLimiter {
  const buckets = new Map<string, number[]>();
  return {
    async consume(key) {
      try {
        const now = Date.now();
        const recent = (buckets.get(key) ?? []).filter((time) => time > now - windowMs);
        if (recent.length >= limit) return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((recent[0] + windowMs - now) / 1000)) };
        recent.push(now);
        buckets.set(key, recent);
        return { allowed: true, retryAfterSeconds: 0 };
      } catch {
        return { allowed: false, retryAfterSeconds: Math.ceil(windowMs / 1000) };
      }
    },
  };
}

export const aiRateLimiter = createConfiguredRateLimiter(20, 60_000);
export const externalUrlRateLimiter = createConfiguredRateLimiter(30, 60_000);
export const assetUploadRateLimiter=createConfiguredRateLimiter(20,60_000);
export const projectCreateRateLimiter=createConfiguredRateLimiter(10,60_000);
export const publishRateLimiter=createConfiguredRateLimiter(20,60_000);
export const githubRateLimiter=createConfiguredRateLimiter(30,60_000);
export const rateLimitResponse=(retryAfterSeconds:number)=>Response.json({error:{code:"RATE_LIMITED",message:"Too many requests. Try again shortly."}},{status:429,headers:{"Retry-After":String(retryAfterSeconds),"Cache-Control":"private, no-store"}});
