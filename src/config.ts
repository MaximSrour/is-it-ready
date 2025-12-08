import { type StepConfig } from "./types";

export const stepConfig: StepConfig[] = [
  {
    label: "Formatting",
    tool: "Prettier",
    command: "npm run prettier",
  },
  {
    label: "Linting",
    tool: "ESLint",
    command: "npm run lint",
    looseCommand: "npm run lint:loose",
  },
  {
    label: "MD Linting",
    tool: "MarkdownLint",
    command: "npm run markdownlint",
  },
  {
    label: "Type Checking",
    tool: "TypeScript",
    command: "npm run type-check",
    looseCommand: "npm run type-check:loose",
  },
  {
    label: "Tests",
    tool: "Vitest",
    command: "npm run test",
  },
  {
    label: "Inventory",
    tool: "Knip",
    command: "npm run knip",
    looseCommand: "npm run knip:loose",
  },
  {
    label: "Package Health",
    tool: "npm audit",
    command: "npm audit",
  },
];
