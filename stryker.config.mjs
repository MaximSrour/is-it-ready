const config = {
  mutate: [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/index.ts",
    "!src/types.ts",
  ],
  packageManager: "npm",
  reporters: ["json", "html", "progress", "clear-text"],
  testRunner: "vitest",
  coverageAnalysis: "perTest",
  jsonReporter: {
    fileName: "reports/mutation/mutation.json",
  },
};
export default config;
