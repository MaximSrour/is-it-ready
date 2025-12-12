export default {
  tasks: [
    {
      tool: "Prettier",
      command: "npm run prettier",
      fixCommand: "npm run prettier:fix",
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
      tool: "TypeScript",
      command: "npm run type-check",
    },
    {
      tool: "Vitest",
      command: "npm run test",
    },
    {
      tool: "Knip",
      command: "npm run knip",
      fixCommand: "npm run knip:fix",
    },
    {
      tool: "npm audit",
      command: "npm audit",
    },
  ],
};
