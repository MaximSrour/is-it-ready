import { type Config } from "../config/types";
import { render } from "../renderers";
import { type RunOptions } from "../runOptions/types";

import { type Task } from "./task";

/**
 * Runs the specified tasks with the given run options.
 *
 * @param {Config} config - The configuration containing the tasks to run.
 * @param {RunOptions} runOptions - The options to use when running the tasks.
 */
export const runTasks = async (config: Config, runOptions: RunOptions) => {
  config.tasks.forEach((task) => {
    task.reset();
  });

  render(config, runOptions);

  const remaining: Record<string, number> = Object.fromEntries(
    config.tasks.map((task) => {
      return [task.tool, task.dependsOn.length];
    })
  );
  const dependents: Record<string, Task[]> = Object.fromEntries(
    config.tasks.map((task): [string, Task[]] => {
      return [task.tool, [] as Task[]];
    })
  );

  const completed = new Set<string>();
  config.tasks.forEach((task) => {
    task.dependsOn.forEach((dep) => {
      dependents[dep].push(task);
    });
  });

  const readyQueue: Task[] = config.tasks.filter((task) => {
    return task.dependsOn.length === 0;
  });

  const cancelDependents = (task: Task) => {
    for (const dependent of dependents[task.tool]) {
      if (!completed.has(dependent.tool)) {
        dependent.cancel();
        completed.add(dependent.tool);
        render(config, runOptions);
        cancelDependents(dependent);
      }
    }
  };

  const onTaskComplete = (task: Task) => {
    completed.add(task.tool);
    if (task.getStatus().state === "failure") {
      cancelDependents(task);
      return;
    }

    for (const dependent of dependents[task.tool]) {
      const newCount = remaining[dependent.tool] - 1;
      remaining[dependent.tool] = newCount;
      if (newCount === 0) {
        readyQueue.push(dependent);
      }
    }
  };

  const executeTask = (task: Task) => {
    return task.execute({
      onStart: () => {
        render(config, runOptions);
      },
      onFinish: () => {
        render(config, runOptions);
      },
    });
  };

  if (config.executionMode === "sequential") {
    for (const task of readyQueue) {
      await executeTask(task);
      onTaskComplete(task);
    }

    return;
  }

  await new Promise<void>((resolve, reject) => {
    let inFlight = 0;

    const dispatch = () => {
      if (readyQueue.length > 0) {
        for (const task of readyQueue.splice(0)) {
          inFlight++;
          Promise.resolve(executeTask(task))
            .then(() => {
              inFlight--;
              onTaskComplete(task);
              dispatch();
            })
            .catch(reject);
        }
        return;
      }

      if (inFlight === 0) {
        resolve();
      }
    };

    dispatch();
  });
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

/**
 * Determines whether any task failed, regardless of parser-derived issue counts.
 *
 * @param {Task[]} tasks - The tasks to inspect.
 * @returns {boolean} True when at least one task failed.
 */
export const hasTaskFailures = (tasks: Task[]) => {
  return tasks.some((task) => {
    return task.getStatus().state === "failure";
  });
};
