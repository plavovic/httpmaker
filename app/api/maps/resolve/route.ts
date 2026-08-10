import { NextResponse } from "next/server";
import { createGoogleMapsEmbedUrl, isGoogleMapsShortUrl } from "@/utils/googleMaps";
import { auth } from "@/auth";
import { externalUrlRateLimiter } from "@/lib/server/rate-limit";
import { jsonBodyError, readJsonBody } from "@/lib/server/request";

export async function POST(request:Request){
  const session=await auth();const ownerId=session?.user?.id;
  if(!ownerId)return NextResponse.json({error:"Unauthorized."},{status:401});
  const rateLimit=await externalUrlRateLimiter.consume(ownerId);
  if(!rateLimit.allowed)return NextResponse.json({error:"Too many URL resolution requests."},{status:429,headers:{"Retry-After":String(rateLimit.retryAfterSeconds)}});
  try{
    const body=await readJsonBody(request,8_000) as {url?:unknown};const input=typeof body.url==="string"?body.url.trim():"";
    if(input.length>2_000)return NextResponse.json({error:"URL is too long."},{status:400});
    if(!isGoogleMapsShortUrl(input))return NextResponse.json({error:"Only secure maps.app.goo.gl links can be resolved."},{status:400});
    const response=await fetch(input,{redirect:"follow",headers:{"User-Agent":"Mozilla/5.0 HTTPMAKER map resolver"},signal:AbortSignal.timeout(8000)});
    const embedUrl=createGoogleMapsEmbedUrl(response.url);if(!embedUrl)return NextResponse.json({error:"This short link did not resolve to a place or coordinates."},{status:422});
    return NextResponse.json({embedUrl});
  }catch(error){if(error instanceof SyntaxError||error instanceof Error&&error.name==="RequestBodyTooLargeError")return jsonBodyError(error);return NextResponse.json({error:"The Google Maps short link could not be resolved."},{status:502})}
}
