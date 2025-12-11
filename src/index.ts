#!/usr/bin/env node

import chalk from "chalk";

import { Task, taskConfig } from "./config";
import { render } from "./renderers";
import { getRunOptions } from "./runOptions/runOptions";

void main().catch((error) => {
  console.error(chalk.red("Unexpected error while running tasks."));
  console.error(error);
  process.exit(1);
});

async function main() {
  const runOptions = getRunOptions();

  const tasks: Task[] = taskConfig.map((config) => {
    return new Task(config, runOptions);
  });

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
