import { initialWebsite } from "@/data/initialWebsite";
import { applyWebsiteDesignPatchSafely } from "@/services/ai/applyWebsiteDesignPatchSafely";
import { createPatchSummary } from "@/services/ai/createPatchSummary";
import { validatePatchPermissions } from "@/services/ai/validatePatchPermissions";
import type { WebsiteDesignPatch } from "@/types/designPatch";

export type DeterministicTestResult = { passed: number; failures: string[] };
type TestCase = { name: string; passes: () => boolean };

export function runStage2DeterministicTests(): DeterministicTestResult {
  const selectedSectionId = initialWebsite.sections[1].id;
  const contentPatch: WebsiteDesignPatch = { sectionUpdates: [{ sectionId: selectedSectionId, props: { title: "A deterministic title" } }] };
  const themePatch: WebsiteDesignPatch = { theme: { primaryColor: "#123456" } };
  const addPatch: WebsiteDesignPatch = { addSections: [{ ...initialWebsite.sections[1], id: "hero-test", props: { ...initialWebsite.sections[1].props } }] };
  const original = JSON.stringify(initialWebsite);
  const tests: TestCase[] = [
    { name: "rewrite-content allows selected content", passes: () => validatePatchPermissions({ mode: "rewrite-content", website: initialWebsite, patch: contentPatch, selectedSectionId }).success },
    { name: "rewrite-content rejects theme", passes: () => !validatePatchPermissions({ mode: "rewrite-content", website: initialWebsite, patch: themePatch, selectedSectionId }).success },
    { name: "rewrite-content rejects another section", passes: () => !validatePatchPermissions({ mode: "rewrite-content", website: initialWebsite, patch: { sectionUpdates: [{ sectionId: initialWebsite.sections[0].id, props: { title: "No" } }] }, selectedSectionId }).success },
    { name: "restyle allows theme", passes: () => validatePatchPermissions({ mode: "restyle-website", website: initialWebsite, patch: themePatch }).success },
    { name: "restyle rejects additions", passes: () => !validatePatchPermissions({ mode: "restyle-website", website: initialWebsite, patch: addPatch }).success },
    { name: "add-section allows additions", passes: () => validatePatchPermissions({ mode: "add-section", website: initialWebsite, patch: addPatch }).success },
    { name: "add-section rejects updates", passes: () => !validatePatchPermissions({ mode: "add-section", website: initialWebsite, patch: contentPatch }).success },
    { name: "safe application succeeds atomically", passes: () => applyWebsiteDesignPatchSafely({ mode: "rewrite-content", website: initialWebsite, patch: contentPatch, selectedSectionId }).success },
    { name: "safe application rejects invalid schema", passes: () => !applyWebsiteDesignPatchSafely({ mode: "restyle-website", website: initialWebsite, patch: { theme: { borderRadius: -1 } } }).success },
    { name: "safe application rejects forbidden patch", passes: () => { const result = applyWebsiteDesignPatchSafely({ mode: "rewrite-content", website: initialWebsite, patch: themePatch, selectedSectionId }); return !result.success && result.error.code === "PERMISSION_VIOLATION" } },
    { name: "application does not mutate input", passes: () => { applyWebsiteDesignPatchSafely({ mode: "rewrite-content", website: initialWebsite, patch: contentPatch, selectedSectionId }); return JSON.stringify(initialWebsite) === original } },
    { name: "summary is deterministic", passes: () => JSON.stringify(createPatchSummary(initialWebsite, contentPatch)) === JSON.stringify(createPatchSummary(initialWebsite, contentPatch)) },
    { name: "summary omits structural no-ops", passes: () => createPatchSummary(initialWebsite, { sectionUpdates: [{ sectionId: selectedSectionId, props: { title: initialWebsite.sections[1].props.title } }] }).length === 0 },
  ];
  const failures: string[] = [];
  let passed = 0;
  for (const test of tests) {
    try { if (test.passes()) passed += 1; else failures.push(test.name); }
    catch { failures.push(test.name); }
  }
  return { passed, failures };
}
