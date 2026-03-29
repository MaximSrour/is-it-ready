import chokidar from "chokidar";

import { type Config } from "../config/types";

import { hasTaskFailures } from "./execute";

let isRunning = false;

/**
 * Executes change handling work when the watcher observes a change.
 *
 * @param {() => Promise<void>} onChange - Function that handles a detected change.
 * @returns {Promise<void>}
 */
const handleChange = async (onChange: () => Promise<void>) => {
  if (isRunning) {
    return;
  }

  isRunning = true;

  try {
    await onChange();
  } finally {
    isRunning = false;
  }
};

/**
 * Starts watching files and invokes the provided change handler.
 *
 * @param {Config} config - The configuration containing watcher settings.
 * @param {() => Promise<void>} onChange - Function that handles a detected change.
 */
export const startWatcher = (config: Config, onChange: () => Promise<void>) => {
  const watcher = chokidar.watch(".", {
    ignored: config.watchIgnore ?? ["**/node_modules/**", "**/.git/**"],
    persistent: true,
    ignoreInitial: true,
  });

  watcher.on("all", () => {
    void handleChange(onChange);
  });

  const handleExit = () => {
    void watcher.close();
    process.exit(hasTaskFailures(config.tasks) ? 1 : 0);
  };

  process.on("SIGINT", handleExit);
  process.on("SIGTERM", handleExit);
};
