import {
  parseEslint,
  parseKnip,
  parseMarkdownLint,
  parseNpmAudit,
  parsePrettier,
  parseTypeCheck,
  parseVitest,
} from "../parsers";
import { type TaskConfig } from "./types";

export const taskConfig: TaskConfig[] = [
  {
    label: "Formatting",
    tool: "Prettier",
    command: "npm run prettier",
    fixCommand: "npm run prettier:fix",
    parseFailure: parsePrettier,
  },
  {
    label: "Linting",
    tool: "ESLint",
    command: "npm run lint",
    looseCommand: "npm run lint:loose",
    fixCommand: "npm run lint:fix",
    parseFailure: parseEslint,
  },
  {
    label: "MD Linting",
    tool: "MarkdownLint",
    command: "npm run markdownlint",
    fixCommand: "npm run markdownlint:fix",
    parseFailure: parseMarkdownLint,
  },
  {
    label: "Type Checking",
    tool: "TypeScript",
    command: "npm run type-check",
    looseCommand: "npm run type-check:loose",
    parseFailure: parseTypeCheck,
  },
  {
    label: "Tests",
    tool: "Vitest",
    command: "npm run test",
    parseFailure: parseVitest,
  },
  {
    label: "Inventory",
    tool: "Knip",
    command: "npm run knip",
    looseCommand: "npm run knip:loose",
    fixCommand: "npm run knip:fix",
    parseFailure: parseKnip,
  },
  {
    label: "Package Health",
    tool: "npm audit",
    command: "npm audit",
    parseFailure: parseNpmAudit,
  },
];
