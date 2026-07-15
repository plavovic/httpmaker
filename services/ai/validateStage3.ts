import { initialWebsite } from "@/data/initialWebsite";
import { buildAiContext } from "@/services/ai/buildAiContext";
import { getAiProvider } from "@/services/ai/getAiProvider";
import { mockAiProvider } from "@/services/ai/mockProvider";
import { AiProviderError } from "@/services/ai/provider";
import { validatePatchPermissions } from "@/services/ai/validatePatchPermissions";
import type { AiMode, AiRequest } from "@/types/ai";
import { aiPatchProposalSchema } from "@/utils/aiValidationSchemas";

export type Stage3ValidationResult = { passed: number; failures: string[] };
type AsyncTestCase = { name: string; run: () => boolean | Promise<boolean> };

const request = (mode: AiMode, instruction: string): AiRequest => ({ mode, instruction, website: initialWebsite, ...(mode === "edit-selected-section" || mode === "rewrite-content" ? { selectedSectionId: initialWebsite.sections[1].id } : {}) });

export async function runStage3DeterministicTests(): Promise<Stage3ValidationResult> {
  const modes: AiMode[] = ["edit-selected-section", "restyle-website", "rewrite-content", "add-section"];
  const tests: AsyncTestCase[] = [
    { name: "provider factory defaults to mock", run: () => getAiProvider().name === "mock" },
    { name: "unsupported providers fail explicitly", run: () => { try { getAiProvider("ollama"); return false; } catch (reason) { return reason instanceof AiProviderError && reason.code === "PROVIDER_UNAVAILABLE"; } } },
    { name: "context contains selected section and capabilities", run: () => { const context = buildAiContext(request("rewrite-content", "Rewrite title")); return context.selectedSection?.id === initialWebsite.sections[1].id && context.capabilities.animations.includes("fade"); } },
    { name: "context builder does not expose mutable capability arrays", run: () => { const context = buildAiContext(request("restyle-website", "Restyle")); context.capabilities.animations.push("test"); return !buildAiContext(request("restyle-website", "Restyle")).capabilities.animations.includes("test"); } },
    { name: "all modes return schema-valid permitted proposals", run: async () => { for (const mode of modes) { const input = request(mode, mode === "add-section" ? "Add a features section" : "Set title to Deterministic"); const proposal = await mockAiProvider.generateProposal(input); if (!aiPatchProposalSchema.safeParse(proposal).success || !validatePatchPermissions(input, proposal.patch).success) return false; } return true; } },
    { name: "mock output is deterministic", run: async () => { const input = request("add-section", "Add a brutalist hero section"); return JSON.stringify(await mockAiProvider.generateProposal(input)) === JSON.stringify(await mockAiProvider.generateProposal(input)); } },
    { name: "mock provider respects aborted signals", run: async () => { const controller = new AbortController(); controller.abort(); try { await mockAiProvider.generateProposal(request("restyle-website", "Dark style"), controller.signal); return false; } catch (reason) { return reason instanceof AiProviderError && reason.code === "REQUEST_TIMEOUT"; } } },
    { name: "provider does not mutate request website", run: async () => { const input = request("rewrite-content", "Set title to Immutable"); const before = JSON.stringify(input.website); await mockAiProvider.generateProposal(input); return JSON.stringify(input.website) === before; } },
  ];
  const failures: string[] = [];
  let passed = 0;
  for (const test of tests) {
    try { if (await test.run()) passed += 1; else failures.push(test.name); }
    catch { failures.push(test.name); }
  }
  return { passed, failures };
}
