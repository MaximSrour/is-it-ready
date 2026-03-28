import chalk from "chalk";

import { type TaskState } from "../task/types";

/**
 * Colors a status message based on the task state.
 *
 * @param {string} message - The status message to color.
 * @param {TaskState} state - The state of the task ("pending", "running", "success", "failure").
 * @returns {string} - The colored status message.
 */
export const colorStatusMessage = (message: string, state: TaskState) => {
  if (state === "failure") {
    return chalk.red(message);
  }

  if (state === "cancelled") {
    return chalk.dim(message);
  }

  return message;
};
