import { describe, expect, it } from "vitest";
import { ApiResponseError, readApiResponse } from "@/lib/api-response";

describe("bounded API response handling",()=>{
  it("reads a successful JSON response",async()=>expect(await readApiResponse<{ok:boolean}>(Response.json({ok:true}))).toEqual({ok:true}));
  it("uses a structured validation error",async()=>await expect(readApiResponse(Response.json({error:{code:"INVALID_SLUG",message:"Invalid slug."}},{status:400}))).rejects.toMatchObject({code:"INVALID_SLUG",message:"Invalid slug."}));
  it("allows an intentional empty 204",async()=>expect(await readApiResponse(new Response(null,{status:204}))).toBeUndefined());
  it.each([200,400,500])("controls an unexpected empty %s response",async(status)=>{await expect(readApiResponse(new Response(null,{status}))).rejects.toBeInstanceOf(ApiResponseError);await expect(readApiResponse(new Response(null,{status}))).rejects.not.toThrow("Unexpected end of JSON input")});
  it("controls a non-JSON HTML error",async()=>await expect(readApiResponse(new Response("<h1>Failure</h1>",{status:500,headers:{"content-type":"text/html"}}))).rejects.toMatchObject({code:"NON_JSON_RESPONSE"}));
});
