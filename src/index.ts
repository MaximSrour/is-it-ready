#!/usr/bin/env node

import chalk from "chalk";

import { loadUserConfig } from "~/config";
import { getRunOptions } from "~/runOptions/runOptions";

import { calculateTotalIssues, runTasks, startWatcher } from "./task";

void main().catch((error) => {
  console.error(chalk.red("Unexpected error while running tasks."));
  console.error(error);
  process.exit(1);
});

/**
 * Main entry point for executing tasks.
 */
async function main() {
  const runOptions = getRunOptions();

  const config = await loadUserConfig(runOptions);

  if (config === null) {
    throw new Error(
      "No user configuration found. Please create an is-it-ready config (refer to the README for more information) file."
    );
  }

  if (!runOptions.isWatchMode) {
    await runTasks(config, runOptions);
    const totalIssues = calculateTotalIssues(config.tasks);

    process.exit(totalIssues > 0 ? 1 : 0);
  }

  await runTasks(config, runOptions);

  startWatcher(config, runOptions);
}
