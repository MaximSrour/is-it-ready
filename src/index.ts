#!/usr/bin/env node

import chalk from "chalk";
import chokidar from "chokidar";

import { loadUserConfig } from "./config";
import { render } from "./renderers";
import { getRunOptions } from "./runOptions/runOptions";
import { type RunOptions } from "./runOptions/types";
import { type Task } from "./task";

let isRunning = false;

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
      "No user configuration found. Please create an is-it-ready config (refer to the README for more information) file."
    );
  }

  if (!runOptions.isWatchMode) {
    await runTasks(tasks, runOptions);
    const totalIssues = calculateTotalIssues(tasks);

    process.exit(totalIssues > 0 ? 1 : 0);
  }

  await runTasks(tasks, runOptions);

  startWatcher(tasks, runOptions);
}

/**
 * Runs the specified tasks with the given run options.
 *
 * @param {Task[]} tasks - The tasks to run.
 * @param {RunOptions} runOptions - The options to use when running the tasks.
 */
const runTasks = async (tasks: Task[], runOptions: RunOptions) => {
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
};

/**
 * Reruns the specified tasks with the given run options.
 *
 * @param {Task[]} tasks - The tasks to rerun.
 * @param {RunOptions} runOptions - The options to use when rerunning the tasks.
 * @returns {Promise<void>}
 */
const rerunTasks = async (tasks: Task[], runOptions: RunOptions) => {
  if (isRunning) {
    return;
  }

  isRunning = true;

  await runTasks(tasks, runOptions);

  isRunning = false;
};

/**
 * Starts the file watcher for the specified tasks.
 *
 * @param {Task[]} tasks - The tasks to watch for changes.
 * @param {RunOptions} runOptions - The options to use when running the tasks.
 */
const startWatcher = (tasks: Task[], runOptions: RunOptions) => {
  console.log(chalk.cyan("Watch mode enabled. Waiting for file changes..."));

  const watcher = chokidar.watch(".", {
    ignored: ["**/node_modules/**", "**/.git/**"],
    persistent: true,
    ignoreInitial: true,
  });

  watcher.on("all", () => {
    void rerunTasks(tasks, runOptions);
  });

  const handleExit = () => {
    void watcher.close();
    process.exit(calculateTotalIssues(tasks) > 0 ? 1 : 0);
  };

  process.on("SIGINT", handleExit);
  process.on("SIGTERM", handleExit);
};

/**
 * Calculates the total number of issues across all tasks.
 *
 * @param {Task[]} tasks - The tasks to calculate issues for.
 * @returns {number} The total number of issues.
 */
const calculateTotalIssues = (tasks: Task[]) => {
  return tasks.reduce((total, task) => {
    return total + task.getTotalErrors() + task.getTotalWarnings();
  }, 0);
};
