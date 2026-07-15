const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const ts = require("typescript");

const projectRoot = path.resolve(__dirname, "..");
const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function resolveFilename(request, parent, isMain, options) {
  return originalResolveFilename.call(this, request.startsWith("@/") ? path.join(projectRoot, request.slice(2)) : request, parent, isMain, options);
};
function compileTypeScript(module, filename) {
  const output = ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }, fileName: filename });
  module._compile(output.outputText, filename);
}
require.extensions[".ts"] = compileTypeScript;
require.extensions[".tsx"] = compileTypeScript;

const { runStage3DeterministicTests } = require("../services/ai/validateStage3.ts");
runStage3DeterministicTests().then((result) => {
  if (result.failures.length) {
    process.stderr.write(`Stage 3 failures:\n${result.failures.map((failure) => `- ${failure}`).join("\n")}\n`);
    process.exitCode = 1;
  } else process.stdout.write(`Stage 3 deterministic tests passed: ${result.passed}\n`);
}).catch((reason) => { process.stderr.write(`${reason instanceof Error ? reason.stack : String(reason)}\n`); process.exitCode = 1; });
