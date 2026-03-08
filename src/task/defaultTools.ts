import {
  parseCSpell,
  parseEslint,
  parseKnip,
  parseMarkdownLint,
  parseNpmAudit,
  parsePrettier,
  parseStryker,
  parseTypeCheck,
  parseVitest,
} from "./parsers";
import { type ToolConfig } from "./types";

export const defaultTools: ToolConfig[] = [
  {
    label: "Formatting",
    tool: "Prettier",
    parseFailure: parsePrettier,
  },
  {
    label: "Linting",
    tool: "ESLint",
    parseFailure: parseEslint,
  },
  {
    label: "MD Linting",
    tool: "MarkdownLint",
    parseFailure: parseMarkdownLint,
  },
  {
    label: "Spell Checking",
    tool: "CSpell",
    parseFailure: parseCSpell,
  },
  {
    label: "Type Checking",
    tool: "TypeScript",
    parseFailure: parseTypeCheck,
  },
  {
    label: "Tests",
    tool: "Vitest",
    parseFailure: parseVitest,
  },
  {
    label: "Mutation Testing",
    tool: "Stryker",
    parseFailure: parseStryker,
  },
  {
    label: "Inventory",
    tool: "Knip",
    parseFailure: parseKnip,
  },
  {
    label: "Package Health",
    tool: "npm audit",
    parseFailure: parseNpmAudit,
  },
];
