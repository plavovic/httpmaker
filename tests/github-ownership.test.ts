import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks=vi.hoisted(()=>({auth:vi.fn(),findInstallation:vi.fn(),findProject:vi.fn(),link:vi.fn(),paginate:vi.fn(),client:vi.fn()}));
vi.mock("@/auth",()=>({auth:mocks.auth}));
vi.mock("@/features/github/server/github.repository",()=>({findOwnedGitHubInstallation:mocks.findInstallation}));
vi.mock("@/features/projects/server/project.repository",()=>({findProjectByIdAndOwner:mocks.findProject,linkProjectRepository:mocks.link}));
vi.mock("@/lib/github/get-installation-client",()=>({getInstallationClient:mocks.client}));
import { GET as listRepositories } from "@/app/api/github/installations/[id]/repositories/route";
import { PUT as linkRepository } from "@/app/api/projects/[projectId]/github/route";
import { GET as readLatestCommit } from "@/app/api/projects/[projectId]/github/test-commit/route";

describe("GitHub installation owner isolation",()=>{
  beforeEach(()=>{vi.clearAllMocks();mocks.auth.mockResolvedValue({user:{id:"owner-a"}});mocks.findInstallation.mockResolvedValue({id:"installation-a",ownerId:"owner-a",installationId:"123",status:"active"});mocks.findProject.mockResolvedValue({id:"project-a",ownerId:"owner-a",repositoryUrl:"https://github.com/owner/repo",githubInstallationId:"installation-a",githubRepositoryId:"99",githubRepositoryFullName:"owner/repo"});mocks.paginate.mockResolvedValue([{id:99,full_name:"owner/repo",html_url:"https://github.com/owner/repo",private:true,default_branch:"main"}]);mocks.client.mockResolvedValue({paginate:mocks.paginate});mocks.link.mockResolvedValue({count:1})});
  it("cannot list another user's installation",async()=>{mocks.findInstallation.mockResolvedValue(null);const response=await listRepositories(new Request("http://test"),{params:Promise.resolve({id:"installation-b"})});expect(response.status).toBe(404);expect(mocks.client).not.toHaveBeenCalled()});
  it("cannot link another user's installation",async()=>{mocks.findInstallation.mockResolvedValue(null);const response=await linkRepository(new Request("http://test",{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify({installationId:"installation-b",repositoryId:"99"})}),{params:Promise.resolve({projectId:"project-a"})});expect(response.status).toBe(404);expect(mocks.link).not.toHaveBeenCalled()});
  it("verifies repository membership before linking stable identity",async()=>{const response=await linkRepository(new Request("http://test",{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify({installationId:"installation-a",repositoryId:"99"})}),{params:Promise.resolve({projectId:"project-a"})});expect(response.status).toBe(200);expect(mocks.link).toHaveBeenCalledWith("project-a","owner-a",expect.objectContaining({installationId:"installation-a",repositoryId:"99",fullName:"owner/repo"}))});
  it("re-checks repository access before a commit read",async()=>{mocks.paginate.mockResolvedValue([]);const response=await readLatestCommit(new Request("http://test"),{params:Promise.resolve({projectId:"project-a"})});expect(response.status).toBe(403)});
});
