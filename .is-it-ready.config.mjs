export default {
  watchIgnore: [".git", "node_modules", "coverage", ".stryker-tmp"],
  executionMode: "parallel",
  tasks: [
    {
      tool: "Prettier",
      command: "npm run prettier",
      fixCommand: "npm run prettier:fix",
      dependsOn: ["ESLint", "MarkdownLint"],
    },
    {
      tool: "ESLint",
      command: "npm run lint",
      fixCommand: "npm run lint:fix",
    },
    {
      tool: "MarkdownLint",
      command: "npm run markdownlint",
      fixCommand: "npm run markdownlint:fix",
    },
    {
      tool: "CSpell",
      command: "npm run spelling",
    },
    {
      tool: "TypeScript",
      command: "npm run type-check",
    },
    {
      tool: "Vitest",
      command: "npm run test:no-coverage",
    },
    {
      tool: "Stryker",
      command: "npm run mutate",
      dependsOn: ["Vitest"],
    },
    {
      tool: "Knip",
      command: "npm run knip",
      fixCommand: "npm run knip:fix",
    },
    {
      tool: "npm audit",
      command: "npm audit --omit=dev",
    },
  ],
};
