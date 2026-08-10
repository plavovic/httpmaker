import { beforeEach, describe, expect, it, vi } from "vitest";
import { initialWebsite } from "@/data/initialWebsite";

const mocks=vi.hoisted(()=>({findPublished:vi.fn()}));
vi.mock("@/features/projects/server/project.repository",()=>({findPublishedProjectBySlug:mocks.findPublished}));
import { loadPublishedSite } from "@/features/publishing/server/public-site";

describe("public site snapshot boundary",()=>{
  beforeEach(()=>{vi.clearAllMocks();mocks.findPublished.mockResolvedValue({name:"Site",slug:"my-site",publishedWebsite:initialWebsite,publishedAt:new Date()})});
  it("returns only a valid published snapshot from the public repository query",async()=>{const result=await loadPublishedSite("my-site");expect(result?.website).toEqual(initialWebsite);expect(mocks.findPublished).toHaveBeenCalledWith("my-site")});
  it("does not return unpublished or missing projects",async()=>{mocks.findPublished.mockResolvedValue(null);expect(await loadPublishedSite("my-site")).toBeNull()});
  it("does not query malformed slugs",async()=>{expect(await loadPublishedSite("BAD SLUG")).toBeNull();expect(mocks.findPublished).not.toHaveBeenCalled()});
  it("rejects an invalid stored snapshot",async()=>{mocks.findPublished.mockResolvedValue({name:"Site",slug:"my-site",publishedWebsite:{bad:true}});expect(await loadPublishedSite("my-site")).toBeNull()});
});
