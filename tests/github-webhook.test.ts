import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks=vi.hoisted(()=>({process:vi.fn()}));
vi.mock("@/features/github/server/github.repository",()=>({processGitHubWebhookDelivery:mocks.process}));
vi.mock("@prisma/client",()=>({Prisma:{PrismaClientKnownRequestError:class extends Error{code:string;constructor(code:string){super(code);this.code=code}}}}));
import { Prisma } from "@prisma/client";
import { POST } from "@/app/api/github/webhook/route";

const secret="webhook-test-secret";
function request(payload:unknown,headers:Record<string,string>={}){const body=JSON.stringify(payload);return new Request("http://test/api/github/webhook",{method:"POST",body,headers:{"x-hub-signature-256":`sha256=${createHmac("sha256",secret).update(body).digest("hex")}`,"x-github-delivery":"delivery-1","x-github-event":"installation",...headers}})}

describe("GitHub webhook transaction boundary",()=>{
  beforeEach(()=>{vi.clearAllMocks();process.env.GITHUB_APP_WEBHOOK_SECRET=secret;mocks.process.mockResolvedValue(undefined)});
  it("rejects invalid signatures",async()=>expect((await POST(request({action:"deleted"},{"x-hub-signature-256":"sha256=bad"}))).status).toBe(401));
  it("rejects declared oversized bodies",async()=>expect((await POST(request({}, {"content-length":"1000001"}))).status).toBe(413));
  it.each([["deleted","deleted"],["suspend","suspended"],["unsuspend","active"]])("maps %s to %s inside the delivery operation",async(action,status)=>{expect((await POST(request({action,installation:{id:123}}))).status).toBe(200);expect(mocks.process).toHaveBeenCalledWith({deliveryId:"delivery-1",event:"installation",installationId:"123",status})});
  it("returns failure so a rolled-back delivery can be retried",async()=>{mocks.process.mockRejectedValueOnce(new Error("state failed")).mockResolvedValueOnce(undefined);expect((await POST(request({action:"deleted",installation:{id:123}}))).status).toBe(500);expect((await POST(request({action:"deleted",installation:{id:123}}))).status).toBe(200);expect(mocks.process).toHaveBeenCalledTimes(2)});
  it("accepts only a duplicate from a previously committed transaction",async()=>{mocks.process.mockRejectedValue(new Prisma.PrismaClientKnownRequestError("P2002",{code:"P2002",clientVersion:"test"}));const response=await POST(request({action:"deleted",installation:{id:123}}));expect(response.status).toBe(200);expect((await response.json()).duplicate).toBe(true)});
});
