import unusedImports from "eslint-plugin-unused-imports";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

const shouldUseTypechecking = true;

const isLooseMode = process.env.ESLINT_MODE === "loose";
const looseOverrides = {
  rules: {},
};

const pluginImportConfig = {
  settings: {
    "import/parsers": { "@typescript-eslint/parser": [".ts"] },
    "import/resolver": { typescript: { project: ["./tsconfig.json"] } },
  },
};

export default defineConfig([
  globalIgnores(["prettier.config.cjs", "eslint.config.mjs", "knip.config.js"]),
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: shouldUseTypechecking,
      },
    },
  },
  {
    plugins: {
      "unused-imports": unusedImports,
    },
    rules: {
      "arrow-body-style": ["warn", "always"],
      "capitalized-comments": "error",
      curly: "error",
      "no-duplicate-imports": "warn",
      "no-restricted-exports": [
        "warn",
        { restrictDefaultExports: { direct: true } },
      ],
      "no-restricted-syntax": [
        "warn",
        {
          selector: "ExportAllDeclaration",
          message:
            "Do not use `export * from 'module'`. Export individual members instead.",
        },
      ],
      "no-unneeded-ternary": "error",
      "no-useless-concat": "warn",
      "no-useless-rename": "warn",
      "prefer-const": "warn",
      "unused-imports/no-unused-imports": "warn",
      "@typescript-eslint/array-type": ["warn", { default: "array" }],
      "@typescript-eslint/ban-ts-comment": "error",
      "@typescript-eslint/consistent-indexed-object-style": ["warn", "record"],
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-empty-object-type": "error",
      "@typescript-eslint/no-unsafe-function-type": "error",
      "@typescript-eslint/no-wrapper-object-types": "error",
      "@typescript-eslint/no-empty-function": "warn",
      "@typescript-eslint/no-empty-interface": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-inferrable-types": "warn",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/no-redeclare": "error",
      "@typescript-eslint/no-misused-promises": [
        "error",
        {
          checksVoidReturn: {
            attributes: false,
          },
        },
      ],
      "@typescript-eslint/no-unnecessary-condition": "warn",
      "@typescript-eslint/no-unsafe-argument": "warn",
      "@typescript-eslint/no-unsafe-assignment": "warn",
      "@typescript-eslint/no-unsafe-call": "warn",
      "@typescript-eslint/no-unsafe-member-access": "warn",
      "@typescript-eslint/no-unsafe-return": "warn",
      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          args: "after-used",
          argsIgnorePattern: "^_",
          vars: "all",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
  pluginImportConfig,
  isLooseMode ? looseOverrides : {},
]);
