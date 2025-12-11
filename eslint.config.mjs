import cspellESLintPluginRecommended from "@cspell/eslint-plugin/recommended";
import jsdoc from "eslint-plugin-jsdoc";
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
  cspellESLintPluginRecommended,
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
      jsdoc,
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

      "jsdoc/check-access": "off",
      "jsdoc/check-alignment": "off",
      "jsdoc/check-indentation": "off",
      "jsdoc/check-line-alignment": "off",
      "jsdoc/check-param-names": "off",
      "jsdoc/check-property-names": "off",
      "jsdoc/check-syntax": "off",
      "jsdoc/check-tag-names": "off",
      "jsdoc/check-template-names": "off",
      "jsdoc/check-types": "off",
      "jsdoc/check-values": "off",
      "jsdoc/convert-to-jsdoc-comments": "off",
      "jsdoc/empty-tags": "off",
      "jsdoc/escape-inline-tags": "off",
      "jsdoc/implements-on-classes": "off",
      "jsdoc/imports-as-dependencies": "off",
      "jsdoc/informative-docs": "off",
      "jsdoc/lines-before-block": "off",
      "jsdoc/match-description": "off",
      "jsdoc/match-name": "off",
      "jsdoc/multiline-blocks": "off",
      "jsdoc/no-bad-blocks": "off",
      "jsdoc/no-blank-block-descriptions": "off",
      "jsdoc/no-defaults": "off",
      "jsdoc/no-missing-syntax": "off",
      "jsdoc/no-multi-asterisks": "off",
      "jsdoc/no-restricted-syntax": "off",
      "jsdoc/no-types": "off",
      "jsdoc/no-undefined-types": "off",
      "jsdoc/reject-any-type": "off",
      "jsdoc/reject-function-type": "off",
      "jsdoc/require-asterisk-prefix": "off",
      "jsdoc/require-description": "off",
      "jsdoc/require-description-complete-sentence": "off",
      "jsdoc/require-example": "off",
      "jsdoc/require-file-overview": "off",
      "jsdoc/require-hyphen-before-param-description": "off",
      "jsdoc/require-jsdoc": "off",
      "jsdoc/require-next-description": "off",
      "jsdoc/require-next-type": "off",
      "jsdoc/require-param-description": "off",
      "jsdoc/require-param-name": "off",
      "jsdoc/require-param-type": "off",
      "jsdoc/require-param": "off",
      "jsdoc/require-property-description": "off",
      "jsdoc/require-property-name": "off",
      "jsdoc/require-property-type": "off",
      "jsdoc/require-property": "off",
      "jsdoc/require-rejects": "off",
      "jsdoc/require-returns-check": "off",
      "jsdoc/require-returns-description": "off",
      "jsdoc/require-returns-type": "off",
      "jsdoc/require-returns": "off",
      "jsdoc/require-template": "off",
      "jsdoc/require-template-description": "off",
      "jsdoc/require-throws": "off",
      "jsdoc/require-throws-description": "off",
      "jsdoc/require-throws-type": "off",
      "jsdoc/require-yields-check": "off",
      "jsdoc/require-yields-description": "off",
      "jsdoc/require-yields-type": "off",
      "jsdoc/require-yields": "off",
      "jsdoc/sort-tags": "off",
      "jsdoc/tag-lines": "off",
      "jsdoc/text-escaping": "off",
      "jsdoc/ts-prefer-function-type": "off",
      "jsdoc/ts-method-signature-style": "off",
      "jsdoc/ts-prefer-function-type": "off",
      "jsdoc/ts-no-unnecessary-template-expression": "off",
      "jsdoc/type-formatting": "off",
      "jsdoc/valid-types": "off",

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
