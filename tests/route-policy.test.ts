import { describe,expect,it } from "vitest";
import { readdirSync } from "node:fs";
import { join,relative,sep } from "node:path";
import { PRIVATE_API_PREFIXES,PRIVATE_PAGE_PREFIXES,PUBLIC_API_PATTERNS,PUBLIC_PAGE_PATTERNS } from "@/lib/server/route-policy";

const walk=(root:string,name:string):string[]=>readdirSync(root,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(join(root,entry.name),name):entry.name===name?[join(root,entry.name)]:[]);
const route=(file:string,kind:"page.tsx"|"route.ts")=>{let value=relative(join(process.cwd(),"app"),file).split(sep).filter(part=>!/^\(.+\)$/.test(part)&&part!==kind).join("/");return `/${value}`.replace(/\/$/,"")||"/"};
const matchesPrefix=(path:string,prefix:string)=>path===prefix||path.startsWith(`${prefix}/`);
describe("canonical route policy",()=>{
  it("classifies every page route",()=>{const publicSet=new Set<string>(PUBLIC_PAGE_PATTERNS);for(const file of walk(join(process.cwd(),"app"),"page.tsx")){const path=route(file,"page.tsx");expect(publicSet.has(path)||PRIVATE_PAGE_PREFIXES.some(prefix=>matchesPrefix(path,prefix)),`unclassified page: ${path}`).toBe(true)}});
  it("classifies every API route",()=>{for(const file of walk(join(process.cwd(),"app","api"),"route.ts")){const path=route(file,"route.ts");const publicRoute=path==="/api/github/webhook"||path.startsWith("/api/auth/");expect(publicRoute||PRIVATE_API_PREFIXES.some(prefix=>matchesPrefix(path,prefix)),`unclassified API: ${path}; public=${PUBLIC_API_PATTERNS.join(",")}`).toBe(true)}});
});
