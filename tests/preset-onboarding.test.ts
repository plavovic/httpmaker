import { describe, expect, it } from "vitest";
import { designPresetList } from "@/presets";
import { presetWebsites } from "@/presets/templates";
import { websiteSchema } from "@/schemas/website.schema";

describe("initial preset catalog",()=>{
  it.each(designPresetList)("$id initializes a complete valid template",preset=>{const template=structuredClone(presetWebsites[preset.id]);expect(websiteSchema.safeParse(template).success).toBe(true);expect(template.sections.length).toBeGreaterThan(1)});
  it("cloning isolates nested template changes",()=>{const copy=structuredClone(presetWebsites.modern);copy.sections[0].props.title="changed";expect(presetWebsites.modern.sections[0].props.title).not.toBe("changed")});
});
