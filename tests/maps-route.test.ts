import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks=vi.hoisted(()=>({auth:vi.fn(),consume:vi.fn()}));
vi.mock("@/auth",()=>({auth:mocks.auth}));
vi.mock("@/lib/server/rate-limit",()=>({externalUrlRateLimiter:{consume:mocks.consume}}));
import { POST } from "@/app/api/maps/resolve/route";

describe("Maps resolver HTTP boundaries",()=>{
  beforeEach(()=>{mocks.auth.mockResolvedValue({user:{id:"owner"}});mocks.consume.mockResolvedValue({allowed:true,retryAfterSeconds:0})});
  it("returns 401 without authentication",async()=>{mocks.auth.mockResolvedValue(null);const response=await POST(new Request("http://test/api/maps/resolve",{method:"POST",body:"{}"}));expect(response.status).toBe(401)});
  it("returns 413 for an oversized declared JSON body",async()=>{const response=await POST(new Request("http://test/api/maps/resolve",{method:"POST",headers:{"content-length":"9000"},body:"{}"}));expect(response.status).toBe(413)});
  it("returns 400 for malformed JSON",async()=>{const response=await POST(new Request("http://test/api/maps/resolve",{method:"POST",body:"{"}));expect(response.status).toBe(400)});
  it("returns 429 when rate limited",async()=>{mocks.consume.mockResolvedValue({allowed:false,retryAfterSeconds:10});const response=await POST(new Request("http://test/api/maps/resolve",{method:"POST",body:"{}"}));expect(response.status).toBe(429);expect(response.headers.get("retry-after")).toBe("10")});
});
