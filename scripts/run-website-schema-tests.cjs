const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const ts = require("typescript");

const projectRoot = path.resolve(__dirname, "..");
const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function resolveFilename(request, parent, isMain, options) {
  const resolvedRequest = request.startsWith("@/") ? path.join(projectRoot, request.slice(2)) : request;
  return originalResolveFilename.call(this, resolvedRequest, parent, isMain, options);
};
require.extensions[".ts"] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: { esModuleInterop: true, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }, fileName: filename,
}).outputText, filename);

const { initialWebsite } = require("../data/initialWebsite.ts");
const { safelyParseWebsiteData } = require("../schemas/website.schema.ts");
const { readStoredWebsite, WEBSITE_STORAGE_KEY } = require("../utils/editorStorage.ts");
let passed = 0;
const test = (name, condition) => { if (!condition) throw new Error(`Failed: ${name}`); passed += 1; };
const clone = (value) => structuredClone(value);

test("initial website passes", safelyParseWebsiteData(initialWebsite).success);
const missingRoot = clone(initialWebsite); delete missingRoot.theme;
test("missing required root property fails", !safelyParseWebsiteData(missingRoot).success);
const invalidType = clone(initialWebsite); invalidType.sections[0].type = "unknown";
test("invalid section type fails", !safelyParseWebsiteData(invalidType).success);
test("valid section data passes", safelyParseWebsiteData(clone(initialWebsite)).success);
const invalidContent = clone(initialWebsite); invalidContent.sections[0].props.alignment = "middle";
test("invalid nested content fails", !safelyParseWebsiteData(invalidContent).success);
const noVersion = clone(initialWebsite); delete noVersion.schemaVersion;
test("missing schema version fails direct validation", !safelyParseWebsiteData(noVersion).success);

global.localStorage = { getItem: (key) => key === WEBSITE_STORAGE_KEY ? "{invalid" : null };
test("invalid localStorage JSON returns null", readStoredWebsite() === null);
global.localStorage = { getItem: (key) => key === WEBSITE_STORAGE_KEY ? JSON.stringify({ malformed: true }) : null };
test("malformed persisted data returns null", readStoredWebsite() === null);

process.stdout.write(`Website schema tests passed: ${passed}\n`);
