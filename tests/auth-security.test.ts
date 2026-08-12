import { describe,expect,it } from "vitest";
import { safeCallbackPath } from "@/lib/server/route-policy";
import { requireSameOrigin } from "@/lib/server/same-origin";

describe("safe authentication redirects",()=>{
  it.each([undefined,null,"","//evil.example","https://evil.example","/\\evil","/%0aevil","/%5cevil"])("rejects hostile callback %s",value=>expect(safeCallbackPath(value)).toBe("/dashboard"));
  it.each(["/dashboard","/editor?projectId=one","/preview/one"])("allows application path %s",value=>expect(safeCallbackPath(value)).toBe(value));
});

describe("same-origin mutation guard",()=>{
  it("accepts the configured application origin",()=>expect(requireSameOrigin(new Request("http://localhost:3000/api/projects",{method:"POST",headers:{origin:"http://localhost:3000","sec-fetch-site":"same-origin"}}))).toBeNull());
  it("rejects a missing origin",()=>expect(requireSameOrigin(new Request("http://localhost:3000/api/projects",{method:"POST"}))?.status).toBe(403));
  it("rejects a hostile origin",()=>expect(requireSameOrigin(new Request("http://localhost:3000/api/projects",{method:"POST",headers:{origin:"https://evil.example"}}))?.status).toBe(403));
});
