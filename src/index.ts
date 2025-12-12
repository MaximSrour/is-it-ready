#!/usr/bin/env node

import chalk from "chalk";

import { loadUserConfig } from "./config";
import { render } from "./renderers";
import { getRunOptions } from "./runOptions/runOptions";

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

  const tasks = await loadUserConfig(runOptions);

  if (tasks === null) {
    throw new Error(
      "No user configuration found. Please create a .is-it-ready.config.js file."
    );
  }

  render(tasks, runOptions);

  await Promise.all(
    tasks.map((task) => {
      return task.execute({
        onStart: () => {
          render(tasks, runOptions);
        },
        onFinish: () => {
          render(tasks, runOptions);
        },
      });
    })
  );

  const { totalIssues } = tasks.reduce<{ totalIssues: number }>(
    (acc, task) => {
      return {
        totalIssues:
          acc.totalIssues + task.getTotalErrors() + task.getTotalWarnings(),
      };
    },
    { totalIssues: 0 }
  );

  process.exit(totalIssues > 0 ? 1 : 0);
}
