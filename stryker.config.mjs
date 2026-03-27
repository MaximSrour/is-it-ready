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
  clearTextReporter: {
    allowColor: true,
    allowEmojis: false,
    logTests: false,
    maxTestsToLog: 3,
    reportTests: false,
    reportMutants: false,
    reportScoreTable: true,
    skipFull: false,
  },
  thresholds: { break: 100 },
};
export default config;
