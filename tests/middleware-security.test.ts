import { describe,expect,it,vi } from "vitest";
import { NextRequest } from "next/server";
vi.mock("@/lib/prisma",()=>({prisma:{project:{findFirst:vi.fn()}}}));
import { middleware } from "@/middleware";
import { prisma } from "@/lib/prisma";
const request=(path:string,method="POST",origin?:string)=>new NextRequest(`http://localhost:3000${path}`,{method,headers:origin?{origin,"sec-fetch-site":"same-origin"}:undefined});
describe("central mutation protection",()=>{
  it("rejects missing and hostile origins",async()=>{expect((await middleware(request("/api/projects"))).status).toBe(403);expect((await middleware(request("/api/projects","POST","https://evil.example"))).status).toBe(403)});
  it("allows the application origin",async()=>expect((await middleware(request("/api/projects","POST","http://localhost:3000"))).status).toBe(200));
  it("exempts the signed webhook and Auth.js endpoints",async()=>{expect((await middleware(request("/api/github/webhook"))).status).toBe(200);expect((await middleware(request("/api/auth/signin"))).status).toBe(200)});
  it("does not interfere with the OAuth callback GET",async()=>expect((await middleware(request("/api/github/installations/callback","GET"))).status).toBe(200));
  it("marks private responses no-store",async()=>expect((await middleware(request("/dashboard","GET"))).headers.get("cache-control")).toContain("no-store"));
  it("returns a real 404 before rendering an unknown publication",async()=>{vi.mocked(prisma.project.findFirst).mockResolvedValueOnce(null);expect((await middleware(request("/unknown-site","GET"))).status).toBe(404)});
  it("allows a live publication to reach the immutable snapshot loader",async()=>{vi.mocked(prisma.project.findFirst).mockResolvedValueOnce({id:"published"} as never);expect((await middleware(request("/live-site","GET"))).status).toBe(200)});
});
