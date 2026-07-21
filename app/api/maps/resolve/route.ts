import { NextResponse } from "next/server";
import { createGoogleMapsEmbedUrl, isGoogleMapsShortUrl } from "@/utils/googleMaps";

export async function POST(request:Request){
  try{
    const body=await request.json() as {url?:unknown};const input=typeof body.url==="string"?body.url.trim():"";
    if(!isGoogleMapsShortUrl(input))return NextResponse.json({error:"Only secure maps.app.goo.gl links can be resolved."},{status:400});
    const response=await fetch(input,{redirect:"follow",headers:{"User-Agent":"Mozilla/5.0 HTTPMAKER map resolver"},signal:AbortSignal.timeout(8000)});
    const embedUrl=createGoogleMapsEmbedUrl(response.url);if(!embedUrl)return NextResponse.json({error:"This short link did not resolve to a place or coordinates."},{status:422});
    return NextResponse.json({embedUrl});
  }catch{return NextResponse.json({error:"The Google Maps short link could not be resolved."},{status:502})}
}
