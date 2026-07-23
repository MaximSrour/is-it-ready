import chokidar from "chokidar";

import { type Config } from "../config/types";

import { hasTaskFailures } from "./execute";

/**
 * Logs watcher change handler failures without letting them escape as unhandled rejections.
 *
 * @param {unknown} error - The failure raised while handling a file change.
 */
const logWatcherError = (error: unknown) => {
  console.error("Unexpected error while handling a watched file change.");
  console.error(error);
};

/**
 * Starts watching files and invokes the provided change handler.
 *
 * @param {Config} config - The configuration containing watcher settings.
 * @param {() => Promise<void>} onChange - Function that handles a detected change.
 */
export const startWatcher = (config: Config, onChange: () => Promise<void>) => {
  let isRunning = false;
  const watcher = chokidar.watch(".", {
    ignored: config.watchIgnore ?? ["**/node_modules/**", "**/.git/**"],
    persistent: true,
    ignoreInitial: true,
  });

  /**
   * Executes change handling work when the watcher observes a change.
   *
   * @returns {Promise<void>}
   */
  const handleChange = async () => {
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

  watcher.on("all", () => {
    void handleChange().catch(logWatcherError);
  });

  const handleExit = () => {
    void watcher.close();
    process.exit(hasTaskFailures(config.tasks) ? 1 : 0);
  };

  process.on("SIGINT", handleExit);
  process.on("SIGTERM", handleExit);
};
