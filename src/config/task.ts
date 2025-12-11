import { type ParsedFailure, type ToolName } from "@/parsers/types";
import { type RunOptions } from "@/runOptions/types";

import { selectCommand } from "../helpers";
import { type TaskConfig } from "./types";

type ConfigType = TaskConfig & {
  parseFailure?: (output: string) => ParsedFailure | undefined;
};

export class Task {
  readonly label: string;
  readonly command: string;
  readonly tool: ToolName;

  readonly parseFailure?: (output: string) => ParsedFailure | undefined;

  constructor(config: ConfigType, runOptions: RunOptions) {
    const executableCommand = selectCommand(config, runOptions);

    this.label = executableCommand.label;
    this.command = executableCommand.command;
    this.tool = config.tool;

    this.parseFailure = config.parseFailure;
  }
}
