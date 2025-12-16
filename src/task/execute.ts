import { type Config } from "~/config/types";
import { render } from "~/renderers";
import { type RunOptions } from "~/runOptions/types";

import { type Task } from "./task";

/**
 * Runs the specified tasks with the given run options.
 *
 * @param {Config} config - The configuration containing the tasks to run.
 * @param {RunOptions} runOptions - The options to use when running the tasks.
 */
export const runTasks = async (config: Config, runOptions: RunOptions) => {
  render(config.tasks, runOptions);

  await Promise.all(
    config.tasks.map((task) => {
      return task.execute({
        onStart: () => {
          render(config.tasks, runOptions);
        },
        onFinish: () => {
          render(config.tasks, runOptions);
        },
      });
    })
  );
};

/**
 * Calculates the total number of issues across all tasks.
 *
 * @param {Task[]} tasks - The tasks to calculate issues for.
 * @returns {number} The total number of issues.
 */
export const calculateTotalIssues = (tasks: Task[]) => {
  return tasks.reduce((total, task) => {
    return total + task.getTotalErrors() + task.getTotalWarnings();
  }, 0);
};
