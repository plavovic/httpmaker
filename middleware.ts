import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const unsafe=new Set(["POST","PUT","PATCH","DELETE"]);
const exempt=(pathname:string)=>pathname.startsWith("/api/auth/")||pathname==="/api/github/webhook"||pathname==="/api/assets/upload";
const privatePath=(pathname:string)=>["/dashboard","/editor","/preview","/api/profile","/api/projects","/api/assets","/api/ai","/api/maps","/api/github/installations","/api/sessions"].some(prefix=>pathname===prefix||pathname.startsWith(`${prefix}/`));
const systemRootPaths=new Set(["","login","dashboard","editor","preview","sites","api"]);
export async function middleware(request:NextRequest){
  const segments=request.nextUrl.pathname.split("/").filter(Boolean);
  if(request.method==="GET"&&segments.length===1&&!systemRootPaths.has(segments[0])&&!segments[0].startsWith("_")&&!segments[0].includes(".")){
    const publication=await prisma.project.findFirst({where:{slug:segments[0],isPublished:true,publishedWebsite:{not:Prisma.DbNull}},select:{id:true}});
    if(!publication)return new NextResponse("<!doctype html><title>Not found</title><h1>This page could not be found.</h1>",{status:404,headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"public, max-age=0, must-revalidate"}});
  }
  if(unsafe.has(request.method)&&request.nextUrl.pathname.startsWith("/api/")&&!exempt(request.nextUrl.pathname)){
    const configured=process.env.AUTH_URL||process.env.NEXT_PUBLIC_APP_URL;let expected:string|null=null;try{expected=configured?new URL(configured).origin:process.env.NODE_ENV!=="production"?request.nextUrl.origin:null}catch{expected=null}
    const origin=request.headers.get("origin");const site=request.headers.get("sec-fetch-site");
    if(!expected||origin!==expected||(site&&site!=="same-origin"&&site!=="same-site"))return NextResponse.json({error:{code:"ORIGIN_REJECTED",message:"This request did not come from the trusted application origin."}},{status:403,headers:{"Cache-Control":"private, no-store"}});
  }
  const response=NextResponse.next();if(privatePath(request.nextUrl.pathname))response.headers.set("Cache-Control","private, no-store, max-age=0");return response;
}
export const config={runtime:"nodejs",matcher:["/:slug","/dashboard/:path*","/editor/:path*","/preview/:path*","/api/:path*"]};
