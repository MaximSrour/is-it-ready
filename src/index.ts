#!/usr/bin/env node

import chalk from "chalk";

import { loadUserConfig } from "./config";
import { type Config } from "./config/types";
import { startRenderer } from "./renderers";
import { getRunOptions } from "./runOptions/runOptions";
import { type RunOptions } from "./runOptions/types";
import { hasTaskFailures, runTasks, startWatcher } from "./task";

void main().catch((error) => {
  console.error(chalk.red("Unexpected error while running tasks."));
  console.error(error);
  process.exit(1);
});

const executeRun = async (config: Config, runOptions: RunOptions) => {
  const stopRenderer = startRenderer(config, runOptions);

  try {
    await runTasks(config);
  } finally {
    stopRenderer();
  }
};

/**
 * Main entry point for executing tasks.
 */
async function main() {
  const runOptions = getRunOptions();

  if (runOptions.isNoColor) {
    chalk.level = 0;
    process.env.NO_COLOR = "1";
    process.env.FORCE_COLOR = "0";
    process.env.npm_config_color = "never";
  }

  const config = await loadUserConfig(runOptions);

  if (config === null) {
    throw new Error(
      "No user configuration found. Please create an is-it-ready config (refer to the README for more information) file."
    );
  }

  if (!runOptions.isWatchMode) {
    await executeRun(config, runOptions);

    process.exit(hasTaskFailures(config.tasks) ? 1 : 0);
  }

  await executeRun(config, runOptions);

  startWatcher(config, () => {
    return executeRun(config, runOptions);
  });
}
