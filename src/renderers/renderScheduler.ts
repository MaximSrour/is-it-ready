import { type Config } from "../config/types";
import { type RunOptions } from "../runOptions/types";

import { render } from "./render";

export const RENDER_INTERVAL_MS = 1000;

/**
 * Starts a concurrent renderer scheduler for TTY output and returns a cleanup
 * function that stops the scheduler.
 *
 * @param {Config} config - Config and task metadata to render.
 * @param {RunOptions} runOptions - Options that influenced the run.
 * @returns {() => void} Cleanup function for the renderer scheduler.
 */
export const startRenderer = (config: Config, runOptions: RunOptions) => {
  render(config, runOptions);

  if (!process.stdout.isTTY) {
    return () => {
      render(config, runOptions);
    };
  }

  const interval = setInterval(() => {
    render(config, runOptions);
  }, RENDER_INTERVAL_MS);

  return () => {
    clearInterval(interval);
    render(config, runOptions);
  };
};
