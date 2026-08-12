import globals from "globals";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

export default tseslint.config(
  { ignores: [".next/**", "node_modules/**", "public/**", "coverage/**", "httpmaker/**", "next-env.d.ts"] },
  {
    files: ["**/*.{js,cjs,mjs,ts,tsx,mts}"],
    languageOptions: { parser: tseslint.parser, globals: { ...globals.browser, ...globals.node } },
    plugins: { "react-hooks": reactHooks },
    rules: { "no-debugger": "error", "no-eval": "error", "react-hooks/rules-of-hooks": "error" },
  },
);
