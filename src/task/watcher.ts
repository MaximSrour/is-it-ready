import chokidar from "chokidar";

import { type Config } from "~/config/types";
import { type RunOptions } from "~/runOptions/types";

import { calculateTotalIssues, runTasks } from "./execute";

let isRunning = false;

/**
 * Reruns the specified tasks with the given run options.
 *
 * @param {Config} config - The configuration containing the tasks to rerun.
 * @param {RunOptions} runOptions - The options to use when rerunning the tasks.
 * @returns {Promise<void>}
 */
const rerunTasks = async (config: Config, runOptions: RunOptions) => {
  if (isRunning) {
    return;
  }

  isRunning = true;

  try {
    await runTasks(config, runOptions);
  } finally {
    isRunning = false;
  }
};

/**
 * Starts the file watcher for the specified tasks.
 *
 * @param {Config} config - The configuration containing the tasks to watch.
 * @param {RunOptions} runOptions - The options to use when running the tasks.
 */
export const startWatcher = (config: Config, runOptions: RunOptions) => {
  const watcher = chokidar.watch(".", {
    ignored: config.watchIgnore ?? ["**/node_modules/**", "**/.git/**"],
    persistent: true,
    ignoreInitial: true,
  });

  watcher.on("all", () => {
    void rerunTasks(config, runOptions);
  });

  const handleExit = () => {
    void watcher.close();
    process.exit(calculateTotalIssues(config.tasks) > 0 ? 1 : 0);
  };

  process.on("SIGINT", handleExit);
  process.on("SIGTERM", handleExit);
};
