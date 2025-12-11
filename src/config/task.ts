import { type RunOptions } from "@/runOptions/types";

import { selectCommand } from "../helpers";
import { type ParsedFailure, type TaskConfig, type ToolName } from "./types";

export class Task {
  readonly label: string;
  readonly command: string;
  readonly tool: ToolName;

  readonly parseFailure?: (output: string) => ParsedFailure | undefined;

  constructor(config: TaskConfig, runOptions: RunOptions) {
    const executableCommand = selectCommand(config, runOptions);

    this.label = executableCommand.label;
    this.command = executableCommand.command;
    this.tool = config.tool;

    this.parseFailure = config.parseFailure;
  }
}
