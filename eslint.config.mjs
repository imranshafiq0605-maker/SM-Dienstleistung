import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
<<<<<<< HEAD
  globalIgnores([
=======
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
>>>>>>> f19fbb24007937f9ee47185f268473795d462b63
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
<<<<<<< HEAD
    "node_modules/**",
    "sm-dienstleistung/.next/**",
    "sm-dienstleistung/node_modules/**",
=======
>>>>>>> f19fbb24007937f9ee47185f268473795d462b63
  ]),
]);

export default eslintConfig;
